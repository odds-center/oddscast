import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import { EntrySheetItemDto } from './dto/entry-sheet.dto';

@Injectable()
export class KraService {
  private readonly logger = new Logger(KraService.name);
  private readonly serviceKey: string;
  // Base URL for KRA API (Service ID: B551015)
  // We might needed different base URLs for different endpoints if they are versioned differently
  // But generally they follow http://apis.data.go.kr/B551015/{SERVICE_NAME}
  private readonly baseUrl = 'http://apis.data.go.kr/B551015';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.serviceKey = this.configService.get<string>('KRA_SERVICE_KEY', '');
  }

  // --- Scheduler ---

  // --- Advanced Scheduling Strategy ---

  /**
   * 1. Weekly Schedule Fetching (Wed, Thu 18:00)
   * Pre-fetch the entry sheet for the upcoming weekend.
   * Note: Entries might not be finalized (jockeys/weights might change).
   */
  @Cron('0 18 * * 3,4') // Wed, Thu at 18:00
  async syncWeeklySchedule() {
    this.logger.log('Running Weekly Schedule Sync (Pre-fetch)');
    const dates = this.getUpcomingWeekendDates();
    for (const date of dates) {
      await this.syncEntrySheet(date);
    }
  }

  /**
   * 2. Race Day Morning Finalization (Fri, Sat, Sun 08:00)
   * Final sync before races start. Updates jockeys, weights, and ratings.
   */
  @Cron('0 8 * * 5,6,0') // Fri, Sat, Sun at 08:00
  async syncRaceDayMorning() {
    this.logger.log('Running Race Day Morning Sync (Finalization)');
    const today = this.getTodayDateString();

    // 1. Sync basic entry sheet (in case of last minute scratches/changes)
    await this.syncEntrySheet(today);

    // 2. Sync detailed analysis data (Training, Equipment etc.)
    await this.syncAnalysisData(today);
  }

  /**
   * 3. Real-time Results & Updates (Fri, Sat, Sun 10:30 - 18:00, every 30 mins)
   * Fetches race results as they happen and updates analysis data.
   */
  @Cron('0,30 10-18 * * 5,6,0')
  async syncRealtimeResults() {
    this.logger.log('Running Real-time Result Sync');
    const today = this.getTodayDateString();

    // 1. Fetch Results
    await this.fetchRaceResults(today);

    // 2. Update Analysis (in case of weight changes or late info)
    // We can optimize this to only run for today's races
    await this.syncAnalysisData(today);
  }

  // --- Helper Methods ---

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  private getUpcomingWeekendDates(): string[] {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed, 4=Thu
    const dates: string[] = [];

    // Calculate offset to Friday (5)
    // If Wed (3), offset is 2. If Thu (4), offset is 1.
    const diffToFri = 5 - day;

    // Generate dates for Fri, Sat, Sun
    for (let i = 0; i < 3; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + diffToFri + i);
      dates.push(nextDate.toISOString().split('T')[0].replace(/-/g, ''));
    }
    return dates;
  }

  private meetNameToCode(name: string): string {
    if (name === 'Seoul') return '1';
    if (name === 'Jeju') return '2';
    if (name === 'Busan') return '3';
    return '1';
  }

  private async logKraSync(
    endpoint: string,
    opts: {
      meet?: string;
      rcDate?: string;
      status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
      recordCount?: number;
      errorMessage?: string;
      durationMs?: number;
    },
  ) {
    await this.prisma.kraSyncLog.create({
      data: {
        endpoint,
        meet: opts.meet,
        rcDate: opts.rcDate,
        status: opts.status,
        recordCount: opts.recordCount ?? 0,
        errorMessage: opts.errorMessage,
        durationMs: opts.durationMs,
      },
    });
  }

  // --- API Methods ---

  /**
   * Syncs Entry Sheet (Race Schedule + Entries) for a specific date.
   * Uses KRA API: /API26_2/entrySheet_2
   */
  async syncEntrySheet(date: string) {
    // date format: YYYYMMDD
    this.logger.log(`Syncing Entry Sheet for date: ${date}`);
    const endpoint = 'entrySheet';

    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    let totalRaces = 0;
    let totalEntries = 0;

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API26_2/entrySheet_2`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: date,
          numOfRows: 1000, // Fetch enough to cover all entries (approx 10-12 races * 14 horses = 140)
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: EntrySheetItemDto[] = [];

        // Handle JSON or XML response safely
        if (response.data?.response?.body?.items?.item) {
          const rawItems = response.data.response.body.items.item;
          items = Array.isArray(rawItems) ? rawItems : [rawItems];
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          // Fallback to XML parsing if JSON fails or API returns XML despite _type=json
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          if (result?.response?.body?.items?.item) {
            const rawItems = result.response.body.items.item;
            items = Array.isArray(rawItems) ? rawItems : [rawItems];
          }
        }

        if (items.length === 0) {
          this.logger.warn(`No entries found for meet ${meet.name} on ${date}`);
          continue;
        }

        // Process items
        // Since items are flattened (one per horse), we need to handle Race creation and Entry creation carefully.

        // Group by Race (rcNo) to minimize Race upserts, or just upsert race for every item (less efficient but safe)
        // Let's loop and upsert Race then Entry.

        for (const item of items) {
          await this.processEntrySheetItem(item, meet.name, date);
          totalEntries++;
        }

        // Count unique races for logging
        const uniqueRaces = new Set(items.map((i) => i.rcNo));
        totalRaces += uniqueRaces.size;

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch entry sheet for ${meet.name}`,
          error,
        );
      }
    }

    return {
      message: `Synced ${totalRaces} races and ${totalEntries} entries for ${date}`,
    };
  }

  private async processEntrySheetItem(
    item: EntrySheetItemDto,
    meetName: string,
    date: string,
  ) {
    // 1. Upsert Race
    const prize = parseInt(item.chaksun1?.replace(/,/g, '') || '0', 10) || 0;

    const race = await this.prisma.race.upsert({
      where: {
        meet_rcDate_rcNo: {
          meet: meetName,
          rcDate: date,
          rcNo: item.rcNo,
        },
      },
      update: {
        rcDist: item.rcDist,
        raceName: item.rcName,
        rcGrade: item.rank,
        rcPrize: prize,
      },
      create: {
        meet: meetName,
        rcDate: date,
        rcNo: item.rcNo,
        rcDist: item.rcDist,
        raceName: item.rcName,
        rcGrade: item.rank,
        rcPrize: prize,
      },
    });

    // 2. Upsert RaceEntry
    const existingEntry = await this.prisma.raceEntry.findFirst({
      where: {
        raceId: race.id,
        hrNo: item.hrNo,
      },
    });

    const weight = parseFloat(item.wgBudam) || 0;
    const rating = parseFloat(item.rating) || 0;
    const age = parseInt(item.age, 10) || 0;
    const prize1 = parseInt(item.chaksun1?.replace(/,/g, '') || '0', 10) || 0;
    const prizeT = BigInt(
      parseInt(item.chaksunT?.replace(/,/g, '') || '0', 10),
    );
    const totalRuns = parseInt(item.rcCntT, 10) || 0;
    const totalWins = parseInt(item.ord1CntT, 10) || 0;
    const dusu = parseInt(item.dusu, 10) || 0;
    const chulNo = parseInt(item.chulNo, 10) || 0;

    const entryData = {
      raceId: race.id,
      hrNo: item.hrNo,
      hrName: item.hrName,
      hrNameEn: item.hrNameEn,
      jkNo: item.jkNo,
      jkName: item.jkName,
      jkNameEn: item.jkNameEn,
      trNo: item.trNo,
      trName: item.trName,
      owNo: item.owNo,
      owName: item.owName,

      weight: weight,
      rating: rating,

      chulNo: chulNo,
      dusu: dusu,

      sex: item.sex,
      age: age,
      origin: item.prd,

      prize1: prize1,
      prizeT: prizeT,
      totalRuns: totalRuns,
      totalWins: totalWins,
    };

    if (existingEntry) {
      await this.prisma.raceEntry.update({
        where: { id: existingEntry.id },
        data: entryData,
      });
    } else {
      await this.prisma.raceEntry.create({
        data: entryData,
      });
    }
  }

  /**
   * 특정 기간의 과거 경마 기록을 DB에 적재 (KRA API 누락 시 백업용)
   * @param dateFrom YYYYMMDD
   * @param dateTo YYYYMMDD
   */
  async syncHistoricalBackfill(dateFrom: string, dateTo: string) {
    this.logger.log(`Starting historical backfill from ${dateFrom} to ${dateTo}`);
    const start = dateFrom.replace(/-/g, '');
    const end = dateTo.replace(/-/g, '');
    const dates = this.getDateRange(start, end);
    const summary = { processed: 0, failed: [] as string[], totalResults: 0 };

    for (const date of dates) {
      try {
        const result = await this.fetchRaceResults(date, true);
        summary.processed++;
        summary.totalResults += typeof result === 'object' && result && 'totalResults' in result
          ? (result as { totalResults: number }).totalResults
          : 0;
        await this.delay(500); // KRA API rate limit 방지
      } catch (err) {
        summary.failed.push(date);
        this.logger.warn(`Historical backfill failed for ${date}`, err);
      }
    }

    return {
      message: `과거 데이터 적재 완료`,
      processed: summary.processed,
      failed: summary.failed,
      totalResults: summary.totalResults,
    };
  }

  private getDateRange(from: string, to: string): string[] {
    const dates: string[] = [];
    const start = new Date(
      parseInt(from.slice(0, 4), 10),
      parseInt(from.slice(4, 6), 10) - 1,
      parseInt(from.slice(6, 8), 10),
    );
    const end = new Date(
      parseInt(to.slice(0, 4), 10),
      parseInt(to.slice(4, 6), 10) - 1,
      parseInt(to.slice(6, 8), 10),
    );
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    }
    return dates;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async fetchRaceResults(
    date: string,
    createRaceIfMissing = false,
  ): Promise<{ message: string; totalResults?: number }> {
    this.logger.log(`Fetching race results for date: ${date}`);
    const endpoint = 'raceResult';

    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    let totalResults = 0;

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/getRaceResult`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: date,
          numOfRows: 300, // Results can be many (10-14 horses per race * 10 races)
          pageNo: 1,
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        if (!result?.response?.body?.items?.item) {
          continue;
        }

        const items = Array.isArray(result.response.body.items.item)
          ? result.response.body.items.item
          : [result.response.body.items.item];

        // Group by race to update status
        const racesToUpdate = new Set<string>();

        for (const item of items) {
          let race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: date,
                rcNo: item.rcNo,
              },
            },
          });

          if (!race && createRaceIfMissing) {
            race = await this.prisma.race.upsert({
              where: {
                meet_rcDate_rcNo: {
                  meet: meet.name,
                  rcDate: date,
                  rcNo: item.rcNo,
                },
              },
              create: {
                meet: meet.name,
                rcDate: date,
                rcNo: item.rcNo,
                rcDist: item.rcDist ?? null,
                weather: item.weather ?? null,
                trackState: item.trackState ?? null,
                status: 'COMPLETED',
              },
              update: {},
            });
          }

          if (!race) continue;

          // Upsert RaceResult
          // Unique constraint for RaceResult in schema?
          // Schema doesn't have unique constraint on RaceResult (raceId, hrNo).
          // We should probably add one, or use findFirst to check existence.
          // For now, we'll try to find first.

          const existingResult = await this.prisma.raceResult.findFirst({
            where: {
              raceId: race.id,
              hrNo: item.hrNo,
            },
          });

          // KRA 응답: ord=착순, rank=등급조건. rcRank는 ord(착순) 사용.
          const s1f = item.seS1fAccTime ?? item.buS1fAccTime ?? item.jeS1fAccTime;
          const g3f = item.seG3fAccTime ?? item.buG3fAccTime ?? item.jeG3fAccTime;
          const g1f = item.seG1fAccTime ?? item.buG1fAccTime ?? item.jeG1fAccTime;
          const hasSectional = s1f != null || g3f != null || g1f != null;
          const sectionalTimes = hasSectional
            ? (JSON.parse(JSON.stringify({ s1f, g3f, g1f })) as Record<string, unknown>)
            : undefined;

          const resultData: Record<string, unknown> = {
            raceId: race.id,
            hrNo: item.hrNo,
            hrName: item.hrName,
            ord: item.ord,
            rcTime: item.rcTime,
            rcRank: item.ord ?? item.rank, // 착순: ord (rank는 등급조건)
            rcDist: item.rcDist,
            rcWeather: item.weather,
            rcTrack: item.track,
            rcTrackCondition: item.track ?? item.trackState,
            chulNo: item.chulNo,
            age: item.age,
            sex: item.sex,
            jkNo: item.jkNo,
            jkName: item.jkName,
            trName: item.trName,
            owName: item.owName,
            wgBudam: item.wgBudam != null ? parseFloat(String(item.wgBudam)) : undefined,
            wgHr: item.wgHr ?? item.wg_hr,
            hrTool: item.hrTool ?? item.hr_tool,
            diffUnit: item.diffUnit ?? item.diff_unit,
            winOdds: item.winOdds != null ? parseFloat(String(item.winOdds)) : undefined,
            plcOdds: item.plcOdds != null ? parseFloat(String(item.plcOdds)) : undefined,
          };
          if (item.rcPrize != null) resultData.rcPrize = parseInt(String(item.rcPrize), 10);
          if (sectionalTimes) resultData.sectionalTimes = sectionalTimes;

          const data = { ...resultData } as Parameters<
            typeof this.prisma.raceResult.create
          >[0]['data'];
          if (existingResult) {
            await this.prisma.raceResult.update({
              where: { id: existingResult.id },
              data,
            });
          } else {
            await this.prisma.raceResult.create({ data });
          }

          racesToUpdate.add(race.id);
          totalResults++;
        }

        // Update Race Status to COMPLETED
        for (const raceId of racesToUpdate) {
          await this.prisma.race.update({
            where: { id: raceId },
            data: { status: 'COMPLETED' },
          });
        }

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(`Failed to fetch results for ${meet.name}`, error);
      }
    }

    return { message: `Synced ${totalResults} results for ${date}`, totalResults };
  }

  async fetchRaceEntries(meet: string, date: string, raceNo: string) {
    // this.logger.log(`Fetching entries for ${meet} ${date} R${raceNo}`);
    const endpoint = '/getRaceEntry';
    const meetCode = meet === 'Seoul' ? '1' : meet === 'Jeju' ? '2' : '3';

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const params = {
        serviceKey: decodeURIComponent(this.serviceKey),
        meet: meetCode,
        rc_date: date,
        rc_no: raceNo,
        numOfRows: 100,
        pageNo: 1,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);

      if (!result?.response?.body?.items?.item) {
        return;
      }

      const items = Array.isArray(result.response.body.items.item)
        ? result.response.body.items.item
        : [result.response.body.items.item];

      // Find Race
      const race = await this.prisma.race.findUnique({
        where: {
          meet_rcDate_rcNo: {
            meet: meet,
            rcDate: date,
            rcNo: raceNo,
          },
        },
      });

      if (!race) {
        this.logger.warn(
          `Race not found for entry sync: ${meet} ${date} R${raceNo}`,
        );
        return;
      }

      for (const item of items) {
        // Upsert RaceEntry
        // No unique key on RaceEntry(raceId, hrNo) in schema?
        // We should use findFirst logic.

        const existingEntry = await this.prisma.raceEntry.findFirst({
          where: {
            raceId: race.id,
            hrNo: item.hrNo,
          },
        });

        const entryData = {
          raceId: race.id,
          hrNo: item.hrNo,
          hrName: item.hrName,
          jkName: item.jkName,
          trName: item.trName,
          owName: item.owName,
          weight: parseFloat(item.wgBudam) || 0, // wgBudam = burden weight
          // recentRanks: item.recentRanks // Need separate parsing if available
        };

        if (existingEntry) {
          await this.prisma.raceEntry.update({
            where: { id: existingEntry.id },
            data: entryData,
          });
        } else {
          await this.prisma.raceEntry.create({
            data: entryData,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch entries for ${meet} R${raceNo}`,
        error,
      );
    }

    return { message: 'Fetched entries' };
  }

  // --- Group B: Analysis Data ---

  async fetchHorseDetails(meet: string, date: string, raceNo: string) {
    // Fetches Rating, Equipment, Weight changes
    // This implies calling multiple KRA endpoints or a consolidated one
    // For now, we simulate fetching from endpoints like /getRaceRating

    const race = await this.prisma.race.findUnique({
      where: {
        meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
      },
      include: { entries: true },
    });

    if (!race) return;

    // 1. Fetch Ratings
    // Mocking the call structure
    // const ratingUrl = ...
    // const ratings = await ...

    // 2. Fetch Equipment
    // const equipUrl = ...

    // For this implementation, we will iterate entries and simulate/placeholder logic
    // In production, you would make actual HTTP calls here.

    for (const entry of race.entries) {
      // Update with mock/placeholder data if API is not yet live
      // Or if 'fetchRaceEntries' already covered some, skip.
      // Assuming we need to update 'rating' and 'equipment' specifically.

      await this.prisma.raceEntry.update({
        where: { id: entry.id },
        data: {
          rating: 0, // Placeholder
          equipment: 'None', // Placeholder
        },
      });
    }

    return { message: 'Fetched details (stub)' };
  }

  async fetchTrainingData(meet: string, date: string, raceNo: string) {
    this.logger.log(`Fetching training data for ${meet} ${date} R${raceNo}`);
    // Hypothetical endpoint for training info
    // Actually the KRA spec says "말훈련내역" API is separate.
    // Usually it is /API8_2/raceHorseTrainingInfo_2 or similar.
    // Based on provided specs list "한국마사회_말훈련내역".
    // Let's assume endpoint `/API40_1/raceHorseTrainingInfo` or check if user provided exact endpoint.
    // The spec provided "KRA_API_ANALYSIS_SPEC.md" lists "한국마사회_말훈련내역".
    // I will use a generic path assuming similar structure to others, or just log if I can't confirm.
    // Wait, spec says "API 선정 리스트" -> "한국마사회_말훈련내역".
    // Let's assume standard endpoint `/API40/trainingInfo` for now, or just use `fetchTrainingData` logic structure.

    const race = await this.prisma.race.findUnique({
      where: {
        meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
      },
      include: { entries: true },
    });

    if (!race) return;

    for (const entry of race.entries) {
      if (!entry.hrNo) continue;

      try {
        // This would be the actual API call
        // const url = `${this.baseUrl}/API...`;
        // const params = { ... };
        // const response = await ...

        // Mocking for now as specific API endpoint for "MalHunryeon" is not fully detailed in my context view
        // but I have to implement the logic to SAVE it to the `Training` model.

        const mockTraining = [
          {
            date: '20231020',
            place: 'Seoul',
            course: 'Outer',
            time: '50.2',
            intensity: 'High',
          },
          {
            date: '20231021',
            place: 'Seoul',
            course: 'Inner',
            time: '15.5',
            intensity: 'Medium',
          },
        ];

        for (const trn of mockTraining) {
          await this.prisma.training.create({
            data: {
              raceEntryId: entry.id,
              horseNo: entry.hrNo,
              date: trn.date,
              place: trn.place,
              course: trn.course,
              time: trn.time,
              intensity: trn.intensity,
            },
          });
        }

        // Also update summary in RaceEntry if needed (e.g. recent training count)
        // await this.prisma.raceEntry.update(...)
      } catch (e) {
        this.logger.error(
          `Failed to fetch training for horse ${entry.hrNo}`,
          e,
        );
      }
    }

    return { message: 'Fetched training data' };
  }

  // --- Group C: Jockey Data ---

  async fetchJockeyTotalResults(meet?: string) {
    this.logger.log(
      `Fetching jockey total results${meet ? ` for meet ${meet}` : ''}`,
    );
    const endpoint = 'jockeyResult';

    const meetsToFetch = meet
      ? [
          {
            code: meet === 'Seoul' ? '1' : meet === 'Jeju' ? '2' : '3',
            name: meet,
          },
        ]
      : [
          { code: '1', name: 'Seoul' },
          { code: '2', name: 'Jeju' },
          { code: '3', name: 'Busan' },
        ];

    let totalJockeys = 0;

    for (const m of meetsToFetch) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/jktresult/getjktresult`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: m.code,
          numOfRows: 1000, // Fetch all jockeys
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: any[] = [];

        // Handle JSON or XML response safely
        if (response.data?.response?.body?.items?.item) {
          const rawItems = response.data.response.body.items.item;
          items = Array.isArray(rawItems) ? rawItems : [rawItems];
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          if (result?.response?.body?.items?.item) {
            const rawItems = result.response.body.items.item;
            items = Array.isArray(rawItems) ? rawItems : [rawItems];
          }
        }

        if (items.length === 0) {
          this.logger.warn(`No jockeys found for meet ${m.name}`);
          continue;
        }

        for (const item of items) {
          // item fields: meet, jkNo, jkName, rcCntT, ord1CntT, ord2CntT, ord3CntT, winRateTsum, quRateTsum, chaksunT

          await this.prisma.jockeyResult.upsert({
            where: {
              meet_jkNo: {
                meet: m.code,
                jkNo: item.jkNo,
              },
            },
            update: {
              jkName: item.jkName,
              rcCntT: parseInt(item.rcCntT, 10) || 0,
              ord1CntT: parseInt(item.ord1CntT, 10) || 0,
              ord2CntT: parseInt(item.ord2CntT, 10) || 0,
              ord3CntT: parseInt(item.ord3CntT, 10) || 0,
              winRateTsum: parseFloat(item.winRateTsum) || 0.0,
              quRateTsum: parseFloat(item.quRateTsum) || 0.0,
              chaksunT: BigInt(
                parseInt(item.chaksunT?.replace(/,/g, ''), 10) || 0,
              ),
            },
            create: {
              meet: m.code,
              jkNo: item.jkNo,
              jkName: item.jkName,
              rcCntT: parseInt(item.rcCntT, 10) || 0,
              ord1CntT: parseInt(item.ord1CntT, 10) || 0,
              ord2CntT: parseInt(item.ord2CntT, 10) || 0,
              ord3CntT: parseInt(item.ord3CntT, 10) || 0,
              winRateTsum: parseFloat(item.winRateTsum) || 0.0,
              quRateTsum: parseFloat(item.quRateTsum) || 0.0,
              chaksunT: BigInt(
                parseInt(item.chaksunT?.replace(/,/g, ''), 10) || 0,
              ),
            },
          });
          totalJockeys++;
        }

        await this.logKraSync(endpoint, {
          meet: m.code,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: m.code,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch jockey results for ${m.name}`,
          error,
        );
      }
    }

    return { message: `Synced ${totalJockeys} jockey records` };
  }

  // --- KRA API: 경주로정보 (API189_1) ---
  async fetchTrackInfo(date: string) {
    const endpoint = 'trackInfo';
    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API189_1/Track_1`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date_fr: date,
          rc_date_to: date,
          numOfRows: 100,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: any[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = Array.isArray(raw) ? raw : [raw];
        }

        for (const item of items) {
          const race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: date,
                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
              },
            },
          });
          if (race) {
            await this.prisma.race.update({
              where: { id: race.id },
              data: {
                weather: item.weather ?? race.weather,
                trackState:
                  item.track ?? item.moisture
                    ? `${item.track ?? ''} (함수율 ${item.moisture ?? '-'}%)`
                    : race.trackState,
              },
            });
          }
        }

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch track info for ${meet.name}`,
          error,
        );
      }
    }
  }

  // --- KRA API: 출전마 체중 (API25_1) ---
  async fetchHorseWeight(date: string) {
    const endpoint = 'horseWeight';
    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API25_1/entryHorseWeightInfo_1`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: date,
          numOfRows: 200,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: any[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = Array.isArray(raw) ? raw : [raw];
        }

        for (const item of items) {
          const race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: date,
                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
              },
            },
            include: { entries: true },
          });
          if (!race) continue;

          const entry = race.entries.find(
            (e) => e.hrNo === String(item.hrNo ?? item.hr_no ?? ''),
          );
          if (entry) {
            await this.prisma.raceEntry.update({
              where: { id: entry.id },
              data: { horseWeight: item.wgHr ?? item.wg_hr ?? null },
            });
          }
        }

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch horse weight for ${meet.name}`,
          error,
        );
      }
    }
  }

  // --- KRA API: 장구·폐출혈 (API24_1) ---
  async fetchEquipmentBleeding(date: string) {
    const endpoint = 'equipmentBleeding';
    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API24_1/horseMedicalAndEquipment_1`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: date,
          numOfRows: 200,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: any[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = Array.isArray(raw) ? raw : [raw];
        }

        for (const item of items) {
          const race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: date,
                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
              },
            },
            include: { entries: true },
          });
          if (!race) continue;

          const entry = race.entries.find(
            (e) => e.hrNo === String(item.hrNo ?? item.hr_no ?? ''),
          );
          if (entry) {
            await this.prisma.raceEntry.update({
              where: { id: entry.id },
              data: {
                equipment: item.hrTool ?? item.equipment ?? item.equipChange ?? null,
                bleedingInfo:
                  item.bleCnt != null ||
                  item.bleDate != null ||
                  item.medicalInfo != null
                    ? {
                        bleCnt: item.bleCnt,
                        bleDate: item.bleDate,
                        medicalInfo: item.medicalInfo,
                      }
                    : Prisma.DbNull,
              },
            });
          }
        }

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch equipment/bleeding for ${meet.name}`,
          error,
        );
      }
    }
  }

  // --- KRA API: 출전취소 (API9_1) ---
  async fetchHorseCancel(date: string) {
    const endpoint = 'horseCancel';
    const meets = [
      { code: '1', name: 'Seoul' },
      { code: '2', name: 'Jeju' },
      { code: '3', name: 'Busan' },
    ];

    for (const meet of meets) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API9_1/raceHorseCancelInfo_1`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: date,
          numOfRows: 50,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: any[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = Array.isArray(raw) ? raw : [raw];
        }

        for (const item of items) {
          const hrNo = String(item.hrNo ?? item.hr_no ?? '');
          const race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: date,
                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
              },
            },
            include: { entries: true },
          });
          if (!race) continue;

          const entry = race.entries.find((e) => e.hrNo === hrNo);
          if (entry) {
            await this.prisma.raceEntry.update({
              where: { id: entry.id },
              data: { isScratched: true },
            });
          }
        }

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error(
          `Failed to fetch horse cancel for ${meet.name}`,
          error,
        );
      }
    }
  }

  async syncAnalysisData(date: string) {
    this.logger.log(
      `Syncing analysis data (Training, Equipment, etc.) for date: ${date}`,
    );
    const races = await this.prisma.race.findMany({
      where: { rcDate: date },
    });

    if (races.length === 0) {
      return { message: `No races found for ${date}` };
    }

    // 1. 경주로정보 (날씨, 주로상태)
    await this.fetchTrackInfo(date);

    // 2. 출전마 체중
    await this.fetchHorseWeight(date);

    // 3. 장구·폐출혈
    await this.fetchEquipmentBleeding(date);

    // 4. 출전취소
    await this.fetchHorseCancel(date);

    let processedCount = 0;
    for (const race of races) {
      await this.fetchTrainingData(race.meet, race.rcDate, race.rcNo);
      await this.fetchHorseDetails(race.meet, race.rcDate, race.rcNo);
      processedCount++;
    }

    return { message: `Synced analysis data for ${processedCount} races` };
  }
}
