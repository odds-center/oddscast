import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { KRA_MEETS, meetToCode } from './constants';
import type { KraApiItem, KraSyncAllOutput } from '@goldenrace/shared';
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
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    dayjs.extend(customParseFormat);
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
    if (!this.ensureServiceKey()) return;
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
    if (!this.ensureServiceKey()) return;
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
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Real-time Result Sync');
    const today = this.getTodayDateString();

    // 1. Fetch Results
    await this.fetchRaceResults(today);

    // 2. Update Analysis (in case of weight changes or late info)
    // We can optimize this to only run for today's races
    await this.syncAnalysisData(today);
  }

  // --- Helper Methods ---

  /** YYYYMMDD 형식으로 반환 (로컬 날짜) */
  private formatYyyyMmDd(d: dayjs.Dayjs): string {
    return d.format('YYYYMMDD');
  }

  /** 입력을 YYYYMMDD로 정규화 (YYYY-MM-DD, YYYYMMDD 지원) */
  private normalizeToYyyyMmDd(date: string): string {
    const d = date.includes('-') ? dayjs(date) : dayjs(date, 'YYYYMMDD');
    return d.format('YYYYMMDD');
  }

  private getTodayDateString(): string {
    return this.formatYyyyMmDd(dayjs());
  }

  private getUpcomingWeekendDates(): string[] {
    const today = dayjs();
    const day = today.day(); // 0=Sun, 1=Mon, ..., 3=Wed, 4=Thu
    const dates: string[] = [];

    const diffToFri = 5 - day;
    for (let i = 0; i < 3; i++) {
      dates.push(this.formatYyyyMmDd(today.add(diffToFri + i, 'day')));
    }
    return dates;
  }

  /** @deprecated use meetToCode from constants */
  private meetNameToCode(name: string): string {
    return meetToCode(name);
  }

  /** KRA API 호출 전 serviceKey 검사. 없으면 스킵하여 500 에러 폭주 방지 */
  private ensureServiceKey(): boolean {
    if (!this.serviceKey?.trim()) {
      this.logger.warn(
        '[KraSync] KRA_SERVICE_KEY가 비어있어 KRA API 호출을 스킵합니다. .env에 인코딩된 API 키를 설정하세요.',
      );
      return false;
    }
    return true;
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
    try {
      await this.prisma.kraSyncLog.create({
        data: {
          endpoint,
          meet: opts.meet ?? null,
          rcDate: opts.rcDate ?? null,
          status: opts.status,
          recordCount: opts.recordCount ?? 0,
          errorMessage: opts.errorMessage ?? null,
          durationMs: opts.durationMs ?? null,
        },
      });
    } catch {
      // KraSyncLog 실패해도 sync 로직은 계속 진행
    }
  }

  // --- API Methods ---

  /**
   * Syncs Entry Sheet (Race Schedule + Entries) for a specific date.
   * Uses KRA API: /API26_2/entrySheet_2
   */
  async syncEntrySheet(date: string) {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY 미설정. .env에 API 키를 추가하세요.',
        races: 0,
        entries: 0,
      };
    }
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    this.logger.log(`Syncing Entry Sheet for date: ${normalizedDate}`);
    const endpoint = 'entrySheet';

    let totalRaces = 0;
    let totalEntries = 0;

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const url = `${this.baseUrl}/API26_2/entrySheet_2`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: normalizedDate,
          rc_month: normalizedDate.slice(0, 6),
          numOfRows: 1000,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: Record<string, unknown>[] = [];
        let body: { totalCount?: number } | undefined;

        if (response.data?.response?.body?.items?.item) {
          body = response.data.response.body;
          const rawItems = response.data.response.body.items.item;
          items = Array.isArray(rawItems) ? rawItems : [rawItems];
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          if (result?.response?.body?.items?.item) {
            body = result.response.body;
            const rawItems = result.response.body.items.item;
            items = Array.isArray(rawItems) ? rawItems : [rawItems];
          }
        }

        const totalCount =
          body?.totalCount != null ? Number(body.totalCount) : items.length;
        if (totalCount > items.length && totalCount > 0) {
          for (let pageNo = 2; items.length < totalCount; pageNo++) {
            const nextRes = await firstValueFrom(
              this.httpService.get(url, {
                params: { ...params, pageNo, numOfRows: 1000 },
              }),
            );
            const raw = nextRes?.data?.response?.body?.items?.item;
            if (!raw) break;
            const arr = Array.isArray(raw) ? raw : [raw];
            items.push(...arr);
            if (arr.length < 1000) break;
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
          await this.processEntrySheetItem(item, meet.name, normalizedDate);
          totalEntries++;
        }

        // Count unique races for logging
        const uniqueRaces = new Set(
          items.map((i: KraApiItem) => i?.rcNo ?? i?.rc_no ?? ''),
        );
        totalRaces += uniqueRaces.size;

        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: normalizedDate,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: normalizedDate,
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
      message: `Synced ${totalRaces} races and ${totalEntries} entries for ${normalizedDate}`,
      races: totalRaces,
      entries: totalEntries,
    };
  }

  private async processEntrySheetItem(
    item: Record<string, unknown>,
    meetName: string,
    date: string,
  ) {
    const v = (key: string): unknown =>
      item[key] ?? item[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
    const vs = (key: string): string | null => {
      const x = v(key);
      return x != null ? String(x) : null;
    };
    const rcNo = vs('rcNo') || vs('rc_no') || '';
    if (!rcNo) return;

    const chaksun1 = vs('chaksun1') || vs('chaksun_1') || '0';
    const prize = parseInt(chaksun1.replace(/,/g, ''), 10) || undefined;

    const stTime = vs('stTime') ?? vs('st_time') ?? null;
    const meetFromApi = vs('meet');
    const meetForRace =
      meetFromApi && ['서울', '제주', '부산경남'].includes(meetFromApi)
        ? meetFromApi
        : meetName;

    const rcNameRaw = vs('rcName') ?? vs('rc_name') ?? vs('raceName');
    const rcName =
      rcNameRaw && rcNameRaw.trim() ? rcNameRaw.trim() : `경주 ${rcNo}R`;

    const race = await this.prisma.race.upsert({
      where: {
        meet_rcDate_rcNo: { meet: meetForRace, rcDate: date, rcNo },
      },
      update: {
        rcDist: vs('rcDist') ?? vs('rc_dist'),
        rcName,
        rcDay: vs('rcDay') ?? vs('rc_day'),
        rank: vs('rank'),
        rcPrize: prize,
        meetName: meetFromApi ?? meetName,
        stTime: stTime ?? undefined,
      },
      create: {
        meet: meetForRace,
        rcDate: date,
        rcNo,
        rcDist: vs('rcDist') ?? vs('rc_dist'),
        rcName,
        rcDay: vs('rcDay') ?? vs('rc_day'),
        rank: vs('rank'),
        rcPrize: prize,
        meetName: meetFromApi ?? meetName,
        stTime: stTime ?? undefined,
      },
    });

    const hrNo = vs('hrNo') || vs('hr_no') || '';
    const existingEntry = await this.prisma.raceEntry.findFirst({
      where: { raceId: race.id, hrNo },
    });

    const wgBudamRaw = v('wgBudam') ?? v('wg_budam');
    const weight =
      wgBudamRaw != null ? parseFloat(String(wgBudamRaw)) : undefined;
    const ratingVal = v('rating');
    const rating =
      ratingVal != null ? parseFloat(String(ratingVal)) : undefined;
    const ageVal = v('age');
    const age = ageVal != null ? parseInt(String(ageVal), 10) : undefined;
    const chaksun1Raw = v('chaksun1') ?? v('chaksun_1');
    const prize1 =
      chaksun1Raw != null
        ? parseInt(String(chaksun1Raw).replace(/,/g, ''), 10)
        : undefined;
    const chaksunTRaw = v('chaksunT') ?? v('chaksun_t');
    const prizeT =
      chaksunTRaw != null
        ? BigInt(parseInt(String(chaksunTRaw).replace(/,/g, ''), 10) || 0)
        : undefined;
    const rcCntTRaw = v('rcCntT') ?? v('rc_cnt_t');
    const totalRuns =
      rcCntTRaw != null ? parseInt(String(rcCntTRaw), 10) : undefined;
    const ord1CntTRaw = v('ord1CntT') ?? v('ord1_cnt_t');
    const totalWins =
      ord1CntTRaw != null ? parseInt(String(ord1CntTRaw), 10) : undefined;
    const dusuVal = v('dusu');
    const dusu = dusuVal != null ? parseInt(String(dusuVal), 10) : undefined;
    const chulNoVal = v('chulNo') ?? v('chul_no');
    const chulNo = chulNoVal != null ? String(chulNoVal) : undefined;
    const budam = vs('budam');

    const entryData = {
      raceId: race.id,
      hrNo,
      hrName: vs('hrName') || vs('hr_name') || '',
      hrNameEn: vs('hrNameEn') || vs('hr_name_en'),
      jkNo: vs('jkNo') || vs('jk_no'),
      jkName: vs('jkName') || vs('jk_name') || '',
      jkNameEn: vs('jkNameEn') || vs('jk_name_en'),
      trNo: vs('trNo') || vs('tr_no'),
      trName: vs('trName') || vs('tr_name'),
      owNo: vs('owNo') || vs('ow_no'),
      owName: vs('owName') || vs('ow_name'),
      wgBudam: weight,
      rating,
      chulNo,
      dusu,
      sex: vs('sex'),
      age,
      prd: vs('prd'),
      chaksun1: prize1,
      chaksunT: prizeT,
      rcCntT: totalRuns,
      ord1CntT: totalWins,
      budam: budam ?? undefined,
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
    await this.cache.del(`race:${race.id}`);
  }

  /**
   * 특정 날짜 기준 전체 적재 (출전표 → 결과 → 상세 → 기수)
   * 경기일·예정일 동기화 시 사용
   */
  async syncAll(date: string): Promise<{
    message: string;
    entrySheet?: { races: number; entries: number };
    results?: { totalResults: number };
    details?: string;
    jockeys?: string;
  }> {
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY 미설정.' };
    }
    const d = this.normalizeToYyyyMmDd(date);
    this.logger.log(`[syncAll] Starting full sync for ${d}`);

    const out: KraSyncAllOutput = {
      message: '',
    };

    try {
      const entryRes = await this.syncEntrySheet(d);
      out.entrySheet = { races: entryRes.races, entries: entryRes.entries };
      await this.delay(300);

      const resultRes = await this.fetchRaceResults(d);
      out.results = { totalResults: resultRes.totalResults ?? 0 };
      await this.delay(300);

      const detailRes = await this.syncAnalysisData(d);
      out.details = detailRes.message;

      const jockeyRes = await this.fetchJockeyTotalResults();
      out.jockeys = jockeyRes.message;
      out.message = `전체 적재 완료: ${out.entrySheet?.races ?? 0}경주, ${out.entrySheet?.entries ?? 0}출마, ${out.results?.totalResults ?? 0}결과`;
    } catch (err) {
      this.logger.error('[syncAll] Failed', err);
      throw err;
    }
    return out;
  }

  /**
   * 특정 기간의 과거 경마 기록을 DB에 적재 (KRA API 누락 시 백업용)
   * 경주결과 + 경주로정보 + 기수 통산
   */
  async syncHistoricalBackfill(dateFrom: string, dateTo: string) {
    if (!this.ensureServiceKey()) return;
    this.logger.log(
      `Starting historical backfill (race days only) from ${dateFrom} to ${dateTo}`,
    );
    const start = this.normalizeToYyyyMmDd(dateFrom);
    const end = this.normalizeToYyyyMmDd(dateTo);
    const dates = this.getRaceDateRange(start, end);
    const summary = { processed: 0, failed: [] as string[], totalResults: 0 };

    for (const date of dates) {
      try {
        const result = await this.fetchRaceResults(date, true);
        summary.processed++;
        summary.totalResults +=
          typeof result === 'object' && result && 'totalResults' in result
            ? (result as { totalResults: number }).totalResults
            : 0;
        await this.fetchTrackInfo(date);
        await this.delay(500);
      } catch (err) {
        summary.failed.push(date);
        this.logger.warn(`Historical backfill failed for ${date}`, err);
      }
    }

    try {
      await this.fetchJockeyTotalResults();
    } catch (e) {
      this.logger.warn('Jockey sync after historical failed', e);
    }

    return {
      message: `과거 데이터 적재 완료`,
      processed: summary.processed,
      failed: summary.failed,
      totalResults: summary.totalResults,
    };
  }

  /** 금·토·일 경주일만 포함 (한국 경마 운영일) */
  private getRaceDateRange(from: string, to: string): string[] {
    const dates: string[] = [];
    const start = dayjs(from, 'YYYYMMDD');
    const end = dayjs(to, 'YYYYMMDD');
    for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) {
      const day = d.day(); // 0=일, 5=금, 6=토
      if (day === 0 || day === 5 || day === 6) {
        dates.push(this.formatYyyyMmDd(d));
      }
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
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY 미설정.', totalResults: 0 };
    }
    this.logger.log(`Fetching race results for date: ${date}`);
    const endpoint = 'raceResult';

    let totalResults = 0;
    const failed500Meets: string[] = [];

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        // KRA 공식: API4_3/raceResult_3 (docs/legacy/KRA_OFFICIAL_GUIDE.md)
        const url = `${this.baseUrl}/API4_3/raceResult_3`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: normalizedDate,
          numOfRows: 300,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );
        let result: { response?: { body?: { items?: { item?: unknown } } } };
        if (
          typeof response.data === 'object' &&
          response.data?.response?.body?.items?.item
        ) {
          result = response.data as typeof result;
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          const parser = new xml2js.Parser({ explicitArray: false });
          result = await parser.parseStringPromise(response.data);
        } else {
          result = {};
        }

        if (!result?.response?.body?.items?.item) {
          continue;
        }

        let items = Array.isArray(result.response.body.items.item)
          ? result.response.body.items.item
          : [result.response.body.items.item];

        // 페이지네이션: totalCount 초과 시 추가 페이지 조회
        const body = result.response?.body as
          | { totalCount?: number }
          | undefined;
        const totalCount =
          body?.totalCount != null ? Number(body.totalCount) : items.length;
        if (totalCount > items.length && totalCount > 0) {
          const allItems: KraApiItem[] = [...items];
          for (let pageNo = 2; allItems.length < totalCount; pageNo++) {
            const nextRes = await firstValueFrom(
              this.httpService.get(url, {
                params: { ...params, pageNo, numOfRows: 300 },
              }),
            );
            const nextResult = nextRes?.data as typeof result;
            const nextItems = nextResult?.response?.body?.items?.item;
            if (!nextItems) break;
            const arr = Array.isArray(nextItems) ? nextItems : [nextItems];
            allItems.push(...arr);
            if (arr.length < 300) break;
          }
          items = allItems;
        }

        const racesToUpdate = new Set<number>();

        const getRcName = (it: KraApiItem): string | null => {
          const v = it.rcName ?? it.rc_name ?? it.raceName ?? it.race_name;
          if (v != null && String(v).trim()) return String(v).trim();
          return null;
        };
        const rcNameFallback = (rcNoStr: string) => `경주 ${rcNoStr}R`;

        for (const item of items as KraApiItem[]) {
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          let race = await this.prisma.race.findUnique({
            where: {
              meet_rcDate_rcNo: {
                meet: meet.name,
                rcDate: normalizedDate,
                rcNo,
              },
            },
          });

          const rcNameVal = getRcName(item);
          const rcNameToSave = rcNameVal ?? rcNameFallback(rcNo);
          const rcDistVal = item.rcDist ?? item.rc_dist;
          const rcDayVal = item.rcDay ?? item.rc_day;
          const rankVal = item.rank;
          const weatherVal = item.weather;
          const trackVal = item.track ?? item.trackState ?? item.track;

          if (!race && createRaceIfMissing) {
            const meetName =
              item.meet &&
              ['서울', '제주', '부산경남'].includes(String(item.meet))
                ? String(item.meet)
                : meet.name;
            race = await this.prisma.race.upsert({
              where: {
                meet_rcDate_rcNo: {
                  meet: meetName,
                  rcDate: normalizedDate,
                  rcNo,
                },
              },
              create: {
                meet: meetName,
                rcDate: normalizedDate,
                rcNo,
                rcDist: rcDistVal != null ? String(rcDistVal) : null,
                rcName: rcNameToSave,
                rcDay: rcDayVal != null ? String(rcDayVal) : null,
                rank: rankVal != null ? String(rankVal) : null,
                weather: weatherVal != null ? String(weatherVal) : null,
                track: trackVal != null ? String(trackVal) : null,
                status: 'COMPLETED',
              },
              update: {
                rcName: rcNameToSave,
                rcDist: rcDistVal != null ? String(rcDistVal) : undefined,
                rcDay: rcDayVal != null ? String(rcDayVal) : undefined,
                rank: rankVal != null ? String(rankVal) : undefined,
                weather: weatherVal != null ? String(weatherVal) : undefined,
                track: trackVal != null ? String(trackVal) : undefined,
              },
            });
          } else if (race) {
            const patch: Prisma.RaceUpdateInput = { rcName: rcNameToSave };
            if (rcDistVal != null) patch.rcDist = String(rcDistVal);
            if (rcDayVal != null) patch.rcDay = String(rcDayVal);
            if (rankVal != null) patch.rank = String(rankVal);
            if (weatherVal != null) patch.weather = String(weatherVal);
            if (trackVal != null) patch.track = String(trackVal);
            await this.prisma.race.update({
              where: { id: race.id },
              data: patch,
            });
          }

          if (!race) continue;

          const hrNoStr =
            item.hrNo != null
              ? String(item.hrNo)
              : item.hr_no != null
                ? String(item.hr_no)
                : '';

          // RaceEntry 연동: 결과 API만 먼저 실행된 경우 Entry 없음 → 결과 데이터로 Entry 보강
          if (hrNoStr) {
            const existingEntry = await this.prisma.raceEntry.findFirst({
              where: { raceId: race.id, hrNo: hrNoStr },
            });
            if (!existingEntry) {
              const sv = (val: unknown) =>
                val != null ? String(val) : undefined;
              await this.prisma.raceEntry.create({
                data: {
                  raceId: race.id,
                  hrNo: hrNoStr,
                  hrName: sv(item.hrName ?? item.hr_name) ?? '',
                  jkNo: sv(item.jkNo ?? item.jk_no),
                  jkName: sv(item.jkName ?? item.jk_name) ?? '',
                  trName: sv(item.trName ?? item.tr_name),
                  owName: sv(item.owName ?? item.ow_name),
                  wgBudam:
                    item.wgBudam != null
                      ? parseFloat(String(item.wgBudam))
                      : item.wg_budam != null
                        ? parseFloat(String(item.wg_budam))
                        : undefined,
                  chulNo: sv(item.chulNo ?? item.chul_no),
                  age:
                    item.age != null
                      ? parseInt(String(item.age), 10)
                      : undefined,
                  sex: sv(item.sex),
                },
              });
              await this.cache.del(`race:${race.id}`);
            }
          }

          // Upsert RaceResult
          // Unique constraint for RaceResult in schema?
          // Schema doesn't have unique constraint on RaceResult (raceId, hrNo).
          // We should probably add one, or use findFirst to check existence.
          // For now, we'll try to find first.

          const existingResult = await this.prisma.raceResult.findFirst({
            where: {
              raceId: race.id,
              hrNo: hrNoStr,
            },
          });

          // KRA 응답: ord=착순, rank=등급조건. rcRank는 ord(착순) 사용.
          const s1f =
            item.seS1fAccTime ?? item.buS1fAccTime ?? item.jeS1fAccTime;
          const g3f =
            item.seG3fAccTime ?? item.buG3fAccTime ?? item.jeG3fAccTime;
          const g1f =
            item.seG1fAccTime ?? item.buG1fAccTime ?? item.jeG1fAccTime;
          const hasSectional = s1f != null || g3f != null || g1f != null;
          const sectionalTimes = hasSectional
            ? (JSON.parse(JSON.stringify({ s1f, g3f, g1f })) as Record<
                string,
                unknown
              >)
            : undefined;

          const sv = (val: unknown) => (val != null ? String(val) : undefined);
          const ordStr = sv(item.ord);
          const ordIntVal =
            ordStr != null && /^\d+$/.test(ordStr)
              ? parseInt(ordStr, 10)
              : undefined;
          const resultData: Record<string, unknown> = {
            raceId: race.id,
            hrNo: sv(item.hrNo ?? item.hr_no) ?? '',
            hrName: sv(item.hrName ?? item.hr_name) ?? '',
            ord: ordStr,
            ordInt: ordIntVal,
            rcTime: sv(item.rcTime),
            chulNo: sv(item.chulNo ?? item.chul_no),
            age: sv(item.age),
            sex: sv(item.sex),
            jkNo: sv(item.jkNo ?? item.jk_no),
            jkName: sv(item.jkName ?? item.jk_name),
            trName: sv(item.trName ?? item.tr_name),
            owName: sv(item.owName ?? item.ow_name),
            wgBudam:
              item.wgBudam != null
                ? parseFloat(String(item.wgBudam))
                : item.wg_budam != null
                  ? parseFloat(String(item.wg_budam))
                  : undefined,
            wgHr: sv(item.wgHr ?? item.wg_hr),
            hrTool: sv(item.hrTool ?? item.hr_tool),
            diffUnit: sv(item.diffUnit ?? item.diff_unit),
            winOdds:
              item.winOdds != null
                ? parseFloat(String(item.winOdds))
                : undefined,
            plcOdds:
              item.plcOdds != null
                ? parseFloat(String(item.plcOdds))
                : undefined,
            track: sv(item.track ?? item.trackState),
            weather: sv(item.weather),
            chaksun1:
              item.rcPrize != null || item.chaksun1 != null
                ? parseInt(String(item.rcPrize ?? item.chaksun1), 10)
                : undefined,
          };
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
        const msg = error instanceof Error ? error.message : String(error);
        const errResp =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        const is500 = typeof errResp === 'number' && errResp === 500;
        await this.logKraSync(endpoint, {
          meet: meet.code,
          rcDate: date,
          status: 'FAILED',
          errorMessage: msg.slice(0, 500),
          durationMs: Date.now() - start,
        });
        if (is500) {
          failed500Meets.push(meet.name);
        } else {
          this.logger.error(`Failed to fetch results for ${meet.name}`, error);
        }
      }
    }

    if (failed500Meets.length > 0) {
      this.logger.warn(
        `KRA API 500 for ${date} (${failed500Meets.join(', ')}) - 해당 날짜 경주 없을 수 있음`,
      );
    }

    return {
      message: `Synced ${totalResults} results for ${date}`,
      totalResults,
    };
  }

  /**
   * 출전표 조회 (KRA_ENTRY_SHEET_SPEC)
   * Endpoint: /API26_2/entrySheet_2
   * meet·date 기준 전체 조회 후 rcNo로 필터
   */
  async fetchRaceEntries(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

    const meetCode = this.meetNameToCode(meet);
    const normalizedDate = this.normalizeToYyyyMmDd(date);

    try {
      const url = `${this.baseUrl}/API26_2/entrySheet_2`;
      const params = {
        serviceKey: decodeURIComponent(this.serviceKey),
        meet: meetCode,
        rc_date: normalizedDate,
        rc_month: normalizedDate.slice(0, 6),
        numOfRows: 500,
        pageNo: 1,
        _type: 'json',
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      let items: Record<string, unknown>[] = [];
      if (response.data?.response?.body?.items?.item) {
        const raw = response.data.response.body.items.item;
        items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
      } else if (
        typeof response.data === 'string' &&
        response.data.includes('<')
      ) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);
        if (result?.response?.body?.items?.item) {
          const raw = result.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
        }
      }

      const filtered = items.filter(
        (i) => String(i.rcNo ?? i.rc_no ?? '') === String(raceNo),
      );
      if (filtered.length === 0) return { message: 'No entries for race' };

      const race = await this.prisma.race.findUnique({
        where: {
          meet_rcDate_rcNo: { meet, rcDate: normalizedDate, rcNo: raceNo },
        },
      });
      if (!race) {
        this.logger.warn(`Race not found: ${meet} ${date} R${raceNo}`);
        return { message: 'Race not found' };
      }

      for (const item of filtered) {
        const v = (k: string) =>
          item[k] ?? item[k.replace(/([A-Z])/g, '_$1').toLowerCase()];
        const vs = (k: string) => (v(k) != null ? String(v(k)) : null);
        const hrNo = vs('hrNo') || vs('hr_no') || '';
        if (!hrNo) continue;

        const existingEntry = await this.prisma.raceEntry.findFirst({
          where: { raceId: race.id, hrNo },
        });
        const wgBudam = v('wgBudam') ?? v('wg_budam');
        const entryData = {
          raceId: race.id,
          hrNo,
          hrName: vs('hrName') || vs('hr_name') || '',
          hrNameEn: vs('hrNameEn') || vs('hr_name_en'),
          jkNo: vs('jkNo') || vs('jk_no'),
          jkName: vs('jkName') || vs('jk_name') || '',
          jkNameEn: vs('jkNameEn') || vs('jk_name_en'),
          trNo: vs('trNo') || vs('tr_no'),
          trName: vs('trName') || vs('tr_name'),
          owNo: vs('owNo') || vs('ow_no'),
          owName: vs('owName') || vs('ow_name'),
          wgBudam: wgBudam != null ? parseFloat(String(wgBudam)) : undefined,
        };

        if (existingEntry) {
          await this.prisma.raceEntry.update({
            where: { id: existingEntry.id },
            data: entryData,
          });
        } else {
          await this.prisma.raceEntry.create({ data: entryData });
        }
      }
      return { message: `Fetched ${filtered.length} entries` };
    } catch (error) {
      this.logger.error(
        `Failed to fetch entries for ${meet} R${raceNo}`,
        error,
      );
      return { message: 'Fetch failed' };
    }
  }

  // --- Group B: Analysis Data ---

  /**
   * 경주마 상세정보 조회 (KRA_RACE_HORSE_INFO_SPEC)
   * Endpoint: /API8_2/raceHorseInfo_2
   * rcCntT, ord1CntT, rating 등으로 RaceEntry 보강
   */
  async fetchHorseDetails(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

    const race = await this.prisma.race.findUnique({
      where: {
        meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
      },
      include: { entries: true },
    });

    if (!race || race.entries.length === 0) return { message: 'No entries' };

    const meetCode = this.meetNameToCode(meet);

    for (const entry of race.entries) {
      if (!entry.hrNo) continue;

      try {
        const url = `${this.baseUrl}/API8_2/raceHorseInfo_2`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meetCode,
          hr_no: entry.hrNo,
          act_gubun: 'y',
          numOfRows: 1,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let item: Record<string, unknown> | null = null;
        const body = response.data?.response?.body ?? response.data?.body;
        if (body?.items?.item) {
          const raw = body.items.item;
          item = Array.isArray(raw) ? raw[0] : raw;
        }

        if (!item) continue;

        const v = (k: string) =>
          item![k] ?? item![k.replace(/([A-Z])/g, '_$1').toLowerCase()];
        const vi = (k: string) => {
          const x = v(k);
          return x != null ? parseInt(String(x), 10) : undefined;
        };
        const vf = (k: string) => {
          const x = v(k);
          return x != null ? parseFloat(String(x)) : undefined;
        };
        const vs = (k: string) => (v(k) != null ? String(v(k)) : undefined);

        const rating = vf('rating') ?? vi('rating');
        const rcCntT = vi('rcCntT') ?? vi('rc_cnt_t');
        const ord1CntT = vi('ord1CntT') ?? vi('ord1_cnt_t');
        const chaksunT = v('chaksunT') ?? v('chaksun_t');
        const prizeT =
          chaksunT != null
            ? BigInt(parseInt(String(chaksunT).replace(/,/g, ''), 10) || 0)
            : undefined;

        await this.prisma.raceEntry.update({
          where: { id: entry.id },
          data: {
            rating: rating ?? undefined,
            rcCntT: rcCntT ?? undefined,
            ord1CntT: ord1CntT ?? undefined,
            chaksunT: prizeT ?? undefined,
            sex: vs('sex') ?? undefined,
            age: vi('age') ?? undefined,
            prd: vs('prd') ?? vs('name') ?? undefined,
          },
        });

        await this.delay(150);
      } catch (e) {
        this.logger.warn(`Horse details fetch failed for ${entry.hrNo}`, e);
      }
    }

    return { message: 'Fetched horse details' };
  }

  /**
   * 말훈련내역 조회 (KRA_TRAINING_SPEC)
   * Endpoint: /trcontihi/gettrcontihi
   * 경기일 기준 최근 2주 훈련 데이터만 조회
   */
  async fetchTrainingData(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

    const race = await this.prisma.race.findUnique({
      where: {
        meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
      },
      include: { entries: true },
    });

    if (!race || race.entries.length === 0) return { message: 'No entries' };

    const trDateTo = this.normalizeToYyyyMmDd(date);
    const trDateFrom = dayjs(date, 'YYYYMMDD')
      .subtract(14, 'day')
      .format('YYYYMMDD');

    for (const entry of race.entries) {
      if (!entry.hrNo) continue;

      try {
        const url = `${this.baseUrl}/trcontihi/gettrcontihi`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          hrno: entry.hrNo,
          tr_date_fr: trDateFrom,
          tr_date_to: trDateTo,
          numOfRows: 50,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: Record<string, unknown>[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
        }

        // 기존 훈련 데이터 삭제 후 재적재 (raceEntryId 기준)
        await this.prisma.training.deleteMany({
          where: { raceEntryId: entry.id },
        });

        const trainingSummaries: string[] = [];
        for (const item of items) {
          const trDate = String(item.trDate ?? item.tr_date ?? '');
          const trTime = String(item.trTime ?? item.tr_time ?? '');
          const trType = String(item.trType ?? item.tr_type ?? '');
          const trContent = String(item.trContent ?? item.tr_content ?? '');
          const place = String(item.place ?? '');
          const intensity = trType || trContent || '';

          await this.prisma.training.create({
            data: {
              raceEntryId: entry.id,
              horseNo: entry.hrNo,
              trDate,
              trTime: trTime || undefined,
              trEndTime:
                String(item.trEndTime ?? item.tr_end_time ?? '') || undefined,
              trDuration:
                String(item.trDuration ?? item.tr_duration ?? '') || undefined,
              trContent: trContent || undefined,
              trType: trType || undefined,
              managerType:
                String(item.managerType ?? item.manager_type ?? '') ||
                undefined,
              managerName:
                String(item.managerName ?? item.manager_name ?? '') ||
                undefined,
              place: place || undefined,
              weather: String(item.weather ?? '') || undefined,
              trackCondition:
                String(item.trackCondition ?? item.track_condition ?? '') ||
                undefined,
              intensity: intensity || undefined,
            },
          });
          trainingSummaries.push(`${trDate} ${trType || trContent}`);
        }

        if (trainingSummaries.length > 0) {
          await this.prisma.raceEntry.update({
            where: { id: entry.id },
            data: {
              trainingData: {
                count: items.length,
                summary: trainingSummaries.slice(-7),
              } as Prisma.InputJsonValue,
            },
          });
        }

        await this.delay(200);
      } catch (e) {
        this.logger.warn(`Training fetch failed for horse ${entry.hrNo}`, e);
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
      ? [{ code: meetToCode(meet), name: meet }]
      : KRA_MEETS;

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

        let items: KraApiItem[] = [];

        // Handle JSON or XML response safely
        if (response.data?.response?.body?.items?.item) {
          const rawItems = response.data.response.body.items.item;
          items = (
            Array.isArray(rawItems) ? rawItems : [rawItems]
          ) as KraApiItem[];
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          if (result?.response?.body?.items?.item) {
            const rawItems = result.response.body.items.item;
            items = (
              Array.isArray(rawItems) ? rawItems : [rawItems]
            ) as KraApiItem[];
          }
        }

        if (items.length === 0) {
          this.logger.warn(`No jockeys found for meet ${m.name}`);
          continue;
        }

        for (const item of items) {
          // item fields: meet, jkNo, jkName, rcCntT, ord1CntT, ord2CntT, ord3CntT, winRateTsum, quRateTsum, chaksunT
          const jkNo = String(item.jkNo ?? item.jk_no ?? '').trim();
          if (!jkNo) continue;

          const jkName = String(item.jkName ?? item.jk_name ?? '');
          const rcCntT =
            parseInt(String(item.rcCntT ?? item.rc_cnt_t ?? ''), 10) || 0;
          const ord1CntT =
            parseInt(String(item.ord1CntT ?? item.ord1_cnt_t ?? ''), 10) || 0;
          const ord2CntT =
            parseInt(String(item.ord2CntT ?? item.ord2_cnt_t ?? ''), 10) || 0;
          const ord3CntT =
            parseInt(String(item.ord3CntT ?? item.ord3_cnt_t ?? ''), 10) || 0;
          const winRateTsum =
            parseFloat(String(item.winRateTsum ?? item.win_rate_tsum ?? '')) ||
            0.0;
          const quRateTsum =
            parseFloat(String(item.quRateTsum ?? item.qu_rate_tsum ?? '')) ||
            0.0;
          const chaksunStr = String(
            item.chaksunT ?? item.chaksun_t ?? '',
          ).replace(/,/g, '');
          const chaksunT = BigInt(parseInt(chaksunStr, 10) || 0);

          await this.prisma.jockeyResult.upsert({
            where: {
              meet_jkNo: {
                meet: m.code,
                jkNo,
              },
            },
            update: {
              jkName,
              rcCntT,
              ord1CntT,
              ord2CntT,
              ord3CntT,
              winRateTsum,
              quRateTsum,
              chaksunT,
            },
            create: {
              meet: m.code,
              jkNo,
              jkName,
              rcCntT,
              ord1CntT,
              ord2CntT,
              ord3CntT,
              winRateTsum,
              quRateTsum,
              chaksunT,
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

    for (const meet of KRA_MEETS) {
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

        let items: KraApiItem[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
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
                track:
                  (item.track ?? item.moisture)
                    ? `${item.track ?? ''} (함수율 ${item.moisture ?? '-'}%)`
                    : race.track,
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
        this.logger.error(`Failed to fetch track info for ${meet.name}`, error);
      }
    }
  }

  // --- KRA API: 출전마 체중 (API25_1) ---
  async fetchHorseWeight(date: string) {
    const endpoint = 'horseWeight';

    for (const meet of KRA_MEETS) {
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

        let items: KraApiItem[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
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

    for (const meet of KRA_MEETS) {
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

        let items: KraApiItem[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
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
                equipment:
                  item.hrTool ?? item.equipment ?? item.equipChange ?? null,
                bleedingInfo:
                  item.bleCnt != null ||
                  item.bleDate != null ||
                  item.medicalInfo != null
                    ? ({
                        bleCnt: item.bleCnt,
                        bleDate: item.bleDate,
                        medicalInfo: item.medicalInfo,
                      } as Prisma.InputJsonValue)
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

    for (const meet of KRA_MEETS) {
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

        let items: KraApiItem[] = [];
        if (response.data?.response?.body?.items?.item) {
          const raw = response.data.response.body.items.item;
          items = (Array.isArray(raw) ? raw : [raw]) as KraApiItem[];
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
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY 미설정.' };
    }
    this.logger.log(
      `Syncing analysis data (Training, Equipment, etc.) for date: ${date}`,
    );
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const races = await this.prisma.race.findMany({
      where: { rcDate: normalizedDate },
      select: { meet: true, rcDate: true, rcNo: true },
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

  /**
   * 샘플 경주 데이터 적재 (KRA API 키 없이 개발용)
   * Admin에서 호출하여 즉시 테스트 데이터 로드
   */
  async seedSampleRaces(
    date?: string,
  ): Promise<{ races: number; entries: number; rcDate: string }> {
    const rcDate = date
      ? this.normalizeToYyyyMmDd(date)
      : this.getTodayDateString();

    const MEETS = [KRA_MEETS[0], KRA_MEETS[2]]; // 서울, 부산경남 (샘플용)
    const ENTRIES = [
      {
        hrNo: '001',
        hrName: '다크호스',
        jkName: '김기수',
        trName: '이조교',
        wgBudam: 56,
      },
      {
        hrNo: '002',
        hrName: '썬더볼트',
        jkName: '박기수',
        trName: '최조교',
        wgBudam: 55,
      },
      {
        hrNo: '003',
        hrName: '스타더스트',
        jkName: '정기수',
        trName: '김조교',
        wgBudam: 57,
      },
      {
        hrNo: '004',
        hrName: '라이팅킹',
        jkName: '강기수',
        trName: '박조교',
        wgBudam: 56,
      },
      {
        hrNo: '005',
        hrName: '실버문',
        jkName: '조기수',
        trName: '정조교',
        wgBudam: 54,
      },
    ];

    let raceCount = 0;
    let entryCount = 0;

    for (const meet of MEETS) {
      for (let r = 1; r <= 4; r++) {
        const rcNo = String(r).padStart(2, '0');
        const rcName = `${r}장 경주`;
        const rcDist = [1000, 1200, 1400, 1600][r % 4].toString();

        let race = await this.prisma.race.findFirst({
          where: { meet: meet.name, rcDate, rcNo },
        });
        if (!race) {
          race = await this.prisma.race.create({
            data: {
              meet: meet.name,
              meetName: meet.name,
              rcDate,
              rcNo,
              rcDist,
              rcName,
              rank: '일반',
              rcPrize: 5000000,
            },
          });
        }
        raceCount++;

        for (const e of ENTRIES) {
          const existing = await this.prisma.raceEntry.findFirst({
            where: { raceId: race.id, hrNo: e.hrNo },
          });
          const data = {
            raceId: race.id,
            hrNo: e.hrNo,
            hrName: e.hrName,
            jkName: e.jkName,
            trName: e.trName,
            wgBudam: e.wgBudam,
            chulNo: e.hrNo,
            dusu: ENTRIES.length,
            age: 4,
            sex: '거',
            prd: '국산',
            chaksun1: 3000000,
            chaksunT: BigInt(50000000),
            rcCntT: 20,
            ord1CntT: 3,
          };
          if (existing) {
            await this.prisma.raceEntry.update({
              where: { id: existing.id },
              data,
            });
          } else {
            await this.prisma.raceEntry.create({ data });
          }
          entryCount++;
        }
      }
    }

    this.logger.log(
      `Sample races seeded: ${raceCount} races, ${entryCount} entries for ${rcDate}`,
    );
    return { races: raceCount, entries: entryCount, rcDate };
  }
}
