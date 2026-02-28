import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalConfigService } from '../config/config.service';
import { ResultsService } from '../results/results.service';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { KRA_MEETS, meetToCode, toKraMeetName } from './constants';
import { parseOrd } from './ord-parser';
import type { KraApiItem, KraSyncAllOutput } from '@oddscast/shared';

const DEFAULT_KRA_BASE_URL = 'http://apis.data.go.kr/B551015';

export interface KraSyncProgressOptions {
  onProgress?: (percent: number, message: string) => void;
}

@Injectable()
export class KraService {
  private readonly logger = new Logger(KraService.name);
  private readonly serviceKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private globalConfigService: GlobalConfigService,
    private prisma: PrismaService,
    private resultsService: ResultsService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    dayjs.extend(customParseFormat);
    this.serviceKey = this.configService.get<string>('KRA_SERVICE_KEY', '');
  }

  /** Uses GlobalConfig's kra_base_url_override, returns default URL if not set */
  private async resolveBaseUrl(): Promise<string> {
    const override = await this.globalConfigService.get('kra_base_url_override');
    return (override?.trim() && override.length > 0) ? override.trim() : DEFAULT_KRA_BASE_URL;
  }

  /** For Admin: current KRA configuration status (Base URL, API key presence) */
  async getKraStatus(): Promise<{ baseUrlInUse: string; serviceKeyConfigured: boolean }> {
    const baseUrlInUse = await this.resolveBaseUrl();
    return {
      baseUrlInUse,
      serviceKeyConfigured: this.ensureServiceKey(),
    };
  }

  // --- Scheduler ---

  // --- Advanced Scheduling Strategy ---

  /**
   * 0-a. Daily upcoming race plan sync (every day 04:00)
   * Fetches race plans for the next 7 days (Fri/Sat/Sun only) via API72_2.
   * Lightweight: only processes ~3 race days max. Keeps upcoming schedules fresh.
   */
  @Cron('0 4 * * *') // Daily 04:00
  async syncDailyUpcomingRacePlans() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Daily Upcoming Race Plans Sync (next 7 days)');
    const today = this.formatYyyyMmDd(dayjs());
    const nextWeek = this.formatYyyyMmDd(dayjs().add(7, 'day'));
    const dates = this.getRaceDateRange(today, nextWeek);

    for (const d of dates) {
      try {
        await this.fetchRacePlanSchedule(d);
        await this.delay(200);
      } catch (err) {
        this.logger.warn(`[syncDailyUpcomingRacePlans] ${d} failed`, err);
      }
    }
  }

  /**
   * 0-b. Monthly race plan sync (every Monday 03:00)
   * Fetches race plans for the next 3 months via API72_2.
   * Ensures longer-term schedule visibility for the calendar.
   */
  @Cron('0 3 * * 1') // Monday 03:00
  async syncFutureRacePlans() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Future Race Plans Sync (next 3 months)');
    await this.syncUpcomingSchedules();
  }

  /**
   * 1. Weekly schedule pre-fetch (Wed, Thu 18:00)
   * Fetches race plan + entry sheet for the upcoming weekend.
   * Entry sheets (API26_2) are usually available 2-3 days before race day.
   */
  @Cron('0 18 * * 3,4') // Wed, Thu at 18:00
  async syncWeeklySchedule() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Weekly Schedule Sync (Pre-fetch)');
    const dates = this.getUpcomingWeekendDates();
    for (const date of dates) {
      await this.fetchRacePlanSchedule(date);
      await this.syncEntrySheet(date);
      await this.delay(300);
    }
  }

  /**
   * 2. Race day morning finalization (Fri, Sat, Sun 08:00)
   * Final sync before races start. Updates jockeys, weights, and ratings.
   */
  @Cron('0 8 * * 5,6,0') // Fri, Sat, Sun at 08:00
  async syncRaceDayMorning() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Race Day Morning Sync (Finalization)');
    const today = this.getTodayDateString();

    await this.syncEntrySheet(today);
    await this.syncAnalysisData(today);
  }

  /**
   * 3. Real-time results (Fri, Sat, Sun 10:30-19:00, every 30 mins)
   * Fetches race results as they happen and updates analysis data.
   */
  @Cron('0,30 10-19 * * 5,6,0')
  async syncRealtimeResults() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Real-time Result Sync');
    const today = this.getTodayDateString();

    await this.fetchRaceResults(today, true);
    await this.syncAnalysisData(today);
  }

  /**
   * 4. Previous day results post-sync (daily 06:00)
   * Only runs if yesterday was a race day (Fri/Sat/Sun).
   * Ensures results are cached in DB for immediate user access.
   */
  @Cron('0 6 * * *') // Daily 06:00
  async syncPreviousDayResults() {
    if (!this.ensureServiceKey()) return;
    const yesterday = dayjs().subtract(1, 'day');
    const day = yesterday.day();
    if (day !== 0 && day !== 5 && day !== 6) return;
    const dateStr = this.formatYyyyMmDd(yesterday);
    this.logger.log(`Running Previous Day Result Sync: ${dateStr}`);
    await this.fetchRaceResults(dateStr, true);
  }

  /**
   * 5. Data consistency check (daily 05:30)
   * Finds past races that have plans but no results (orphaned),
   * and attempts to backfill their results from KRA API.
   * Scans the last 14 days to catch any missed results.
   */
  @Cron('0 30 5 * * *') // Daily 05:30
  async syncOrphanedRaceResults() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running orphaned race results check (last 14 days)');

    const today = dayjs();
    const twoWeeksAgo = today.subtract(14, 'day');
    const todayStr = this.formatYyyyMmDd(today);
    const fromStr = this.formatYyyyMmDd(twoWeeksAgo);

    const orphanedRaces = await this.prisma.race.findMany({
      where: {
        rcDate: { gte: fromStr, lt: todayStr },
        status: 'COMPLETED',
        results: { none: {} },
      },
      select: { id: true, rcDate: true, meet: true, rcNo: true },
      orderBy: { rcDate: 'asc' },
    });

    if (orphanedRaces.length === 0) {
      this.logger.log('No orphaned races found — data is consistent');
      return;
    }

    const dates = [...new Set(orphanedRaces.map((r) => r.rcDate))];
    this.logger.log(
      `Found ${orphanedRaces.length} races without results across ${dates.length} dates. Backfilling...`,
    );

    for (const date of dates) {
      try {
        await this.fetchRaceResults(date, true);
        await this.delay(500);
      } catch (err) {
        this.logger.warn(`[syncOrphanedRaceResults] Failed for ${date}`, err);
      }
    }
  }

  // --- Helper Methods ---

  /** Format as YYYYMMDD (local date) */
  private formatYyyyMmDd(d: dayjs.Dayjs): string {
    return d.format('YYYYMMDD');
  }

  /** Normalize input to YYYYMMDD (supports YYYY-MM-DD and YYYYMMDD) */
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

  /** Checks serviceKey before KRA API call. Skips if not set to prevent 500 error spam */
  private ensureServiceKey(): boolean {
    if (!this.serviceKey?.trim()) {
      this.logger.warn(
        '[KraSync] KRA_SERVICE_KEY is empty, skipping KRA API calls. Set encoded API key in .env.',
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
        // Continue sync logic even if KraSyncLog fails
      }
  }

  // --- API Methods ---

  /**
   * Syncs Entry Sheet (Race Schedule + Entries) for a specific date.
   * Uses KRA API: /API26_2/entrySheet_2
   */
  async syncEntrySheet(date: string, opts?: KraSyncProgressOptions) {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY not configured. Add API key to .env.',
        races: 0,
        entries: 0,
      };
    }
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    this.logger.log(`Syncing Entry Sheet for date: ${normalizedDate}`);
    const endpoint = 'entrySheet';
    const baseUrl = await this.resolveBaseUrl();

    let totalRaces = 0;
    let totalEntries = 0;
    const totalMeets = KRA_MEETS.length;

    for (let meetIndex = 0; meetIndex < KRA_MEETS.length; meetIndex++) {
      const meet = KRA_MEETS[meetIndex];
      const start = Date.now();
      opts?.onProgress?.(
        Math.round(((meetIndex + 0.5) / totalMeets) * 100),
        `출전표 동기화: ${meet.name} (${meetIndex + 1}/${totalMeets})`,
      );
      try {
        const url = `${baseUrl}/API26_2/entrySheet_2`;
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

        // Collect all pages even if totalCount is missing: paginate until last page has fewer than numOfRows
        const numOfRows = 1000;
        const totalCount = body?.totalCount != null ? Number(body.totalCount) : null;
        let pageNo = 2;
        for (;;) {
          const shouldFetchMore =
            totalCount != null
              ? totalCount > items.length && totalCount > 0
              : items.length >= numOfRows; // If last response is full, there may be a next page
          if (!shouldFetchMore) break;

          const nextRes = await firstValueFrom(
            this.httpService.get(url, {
              params: { ...params, pageNo, numOfRows },
            }),
          );
          const nextBody = nextRes?.data?.response?.body;
          const raw = nextBody?.items?.item;
          if (!raw) break;
          const arr = Array.isArray(raw) ? raw : [raw];
          items.push(...arr);
          pageNo++;
          if (arr.length < numOfRows) break;
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

    opts?.onProgress?.(100, '완료');
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
   * Loads schedule for a specific date (race plan schedule → entry sheet)
   * Used in Admin sync/schedule when date is specified.
   */
  async syncScheduleForDate(
    date: string,
    opts?: KraSyncProgressOptions,
  ): Promise<{
    message: string;
    races: number;
    entries: number;
  }> {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY not configured.',
        races: 0,
        entries: 0,
      };
    }
    const d = this.normalizeToYyyyMmDd(date);
    opts?.onProgress?.(10, '경주계획표 조회 중…');
    const planRes = await this.fetchRacePlanSchedule(d);
    opts?.onProgress?.(50, '출전표 동기화 중…');
    const entryRes = await this.syncEntrySheet(d, opts);
    opts?.onProgress?.(100, '완료');
    return {
      message: `Schedule load complete: ${planRes.races} races (plan), ${entryRes.entries} entries`,
      races: Math.max(planRes.races ?? 0, entryRes.races ?? 0),
      entries: entryRes.entries ?? 0,
    };
  }

  /**
   * Full sync for a specific date (entry sheet → results → details → jockeys)
   * Used when syncing race day/scheduled date
   */
  async syncAll(
    date: string,
    opts?: KraSyncProgressOptions,
  ): Promise<{
    message: string;
    entrySheet?: { races: number; entries: number };
    results?: { totalResults: number };
    details?: string;
    jockeys?: string;
  }> {
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY not configured.' };
    }
    const d = this.normalizeToYyyyMmDd(date);
    this.logger.log(`[syncAll] Starting full sync for ${d}`);

    const out: KraSyncAllOutput = {
      message: '',
    };

    try {
      opts?.onProgress?.(5, '경주계획표 조회 중…');
      await this.fetchRacePlanSchedule(d);
      opts?.onProgress?.(25, '출전표 동기화 중…');
      const entryRes = await this.syncEntrySheet(d, opts);
      out.entrySheet = { races: entryRes.races, entries: entryRes.entries };
      await this.delay(300);

      // createRaceIfMissing: true — 결과 API에만 있는 경주도 Race 생성 후 결과·출전마 보강 기록
      opts?.onProgress?.(50, '경주 결과 수집 중…');
      const resultRes = await this.fetchRaceResults(d, true, opts);
      out.results = { totalResults: resultRes.totalResults ?? 0 };
      await this.delay(300);

      opts?.onProgress?.(75, '상세정보(훈련·장구) 동기화 중…');
      const detailRes = await this.syncAnalysisData(d);
      out.details = detailRes.message;

      opts?.onProgress?.(95, '기수 통산전적 동기화 중…');
      const jockeyRes = await this.fetchJockeyTotalResults();
      out.jockeys = jockeyRes.message;
      opts?.onProgress?.(100, '완료');
      out.message = `Full sync complete: ${out.entrySheet?.races ?? 0} races, ${out.entrySheet?.entries ?? 0} entries, ${out.results?.totalResults ?? 0} results`;
    } catch (err) {
      this.logger.error('[syncAll] Failed', err);
      throw err;
    }
    return out;
  }

  /**
   * Full historical backfill for a date range (Fri/Sat/Sun only).
   * Runs: race plan → entry sheet → results → track info per date,
   * then jockey totals at the end. Ensures data consistency between
   * race plans and results.
   */
  async syncHistoricalBackfill(
    dateFrom: string,
    dateTo: string,
    opts?: KraSyncProgressOptions,
  ) {
    if (!this.ensureServiceKey()) return;
    this.logger.log(
      `Starting historical backfill (race days only) from ${dateFrom} to ${dateTo}`,
    );
    const start = this.normalizeToYyyyMmDd(dateFrom);
    const end = this.normalizeToYyyyMmDd(dateTo);
    const dates = this.getRaceDateRange(start, end);
    const summary = { processed: 0, failed: [] as string[], totalResults: 0, totalRaces: 0 };
    const totalDates = dates.length;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const pct = totalDates > 0 ? Math.round(((i + 0.5) / totalDates) * 95) : 0;
      opts?.onProgress?.(pct, `과거 데이터: ${date} (${i + 1}/${totalDates})`);
      try {
        // 1) Race plan (API72_2) — create Race records first
        const planRes = await this.fetchRacePlanSchedule(date);
        summary.totalRaces += planRes.races ?? 0;
        await this.delay(200);

        // 2) Entry sheet (API26_2) — add horse/jockey entries
        await this.syncEntrySheet(date);
        await this.delay(200);

        // 3) Results (API4_3) — fetch results, create if missing
        const result = await this.fetchRaceResults(date, true);
        summary.processed++;
        summary.totalResults +=
          typeof result === 'object' && result && 'totalResults' in result
            ? (result as { totalResults: number }).totalResults
            : 0;

        // 4) Track info
        await this.fetchTrackInfo(date);
        await this.delay(300);
      } catch (err) {
        summary.failed.push(date);
        this.logger.warn(`Historical backfill failed for ${date}`, err);
      }
    }

    opts?.onProgress?.(97, '기수 통산전적 동기화 중…');
    try {
      await this.fetchJockeyTotalResults();
    } catch (e) {
      this.logger.warn('Jockey sync after historical failed', e);
    }
    opts?.onProgress?.(100, '완료');

    return {
      message: `Historical backfill complete: ${summary.processed} days, ${summary.totalRaces} races, ${summary.totalResults} results`,
      processed: summary.processed,
      failed: summary.failed,
      totalResults: summary.totalResults,
      totalRaces: summary.totalRaces,
    };
  }

  /** Only Fri/Sat/Sun — Korean horse racing days */
  private getRaceDateRange(from: string, to: string): string[] {
    const dates: string[] = [];
    const start = dayjs(from, 'YYYYMMDD');
    const end = dayjs(to, 'YYYYMMDD');
    for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) {
      const day = d.day(); // 0=Sun, 5=Fri, 6=Sat
      if (day === 0 || day === 5 || day === 6) {
        dates.push(this.formatYyyyMmDd(d));
      }
    }
    return dates;
  }

  /**
   * API72_2 race plan schedule — supports future race date queries.
   * Entry sheets (API26_2) are usually available only 2-3 days before race day.
   */
  async fetchRacePlanSchedule(date: string): Promise<{ races: number }> {
    if (!this.ensureServiceKey()) {
      return { races: 0 };
    }
    const d = this.normalizeToYyyyMmDd(date);
    const baseUrl = await this.resolveBaseUrl();
    const url = `${baseUrl}/API72_2/racePlan_2`;

    let totalRaces = 0;

    for (const meet of KRA_MEETS) {
      try {
        const params: Record<string, string | number> = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_year: d.slice(0, 4),
          rc_month: d.slice(0, 6),
          rc_date: d,
          numOfRows: 500,
          pageNo: 1,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: Record<string, unknown>[] = [];
        const bodyItems = response.data?.response?.body?.items;
        if (bodyItems) {
          if (Array.isArray(bodyItems)) {
            items = bodyItems;
          } else if (bodyItems.item) {
            const raw = bodyItems.item;
            items = Array.isArray(raw) ? raw : [raw];
          }
        }

        for (const item of items) {
          const v = (key: string): string | null => {
            const x = item[key] ?? (item as Record<string, unknown>)[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
            return x != null ? String(x) : null;
          };
          const rcNo = v('rcNo') || v('rc_no') || '';
          if (!rcNo) continue;

          const meetName = meet.name;
          const rcName = (v('rcName') ?? v('rc_name') ?? '').trim() || `경주 ${rcNo}R`;
          const rcDist = v('rcDist') ?? v('rc_dist');
          const rcDay = v('rcDay') ?? v('rc_day');
          const rank = v('rank') ?? v('rcGrade') ?? v('rc_grade');
          const prizeRaw = v('rcPrize') ?? v('rc_prize') ?? v('chaksun1') ?? v('chaksun_1') ?? '0';
          const prize = parseInt(String(prizeRaw).replace(/,/g, ''), 10) || undefined;
          const stTime = v('rcStartTime') ?? v('rc_start_time') ?? v('stTime') ?? v('st_time');

          await this.prisma.race.upsert({
            where: { meet_rcDate_rcNo: { meet: meetName, rcDate: d, rcNo } },
            update: { rcDist: rcDist ?? undefined, rcName, rcDay: rcDay ?? undefined, rank: rank ?? undefined, rcPrize: prize, stTime: stTime ?? undefined },
            create: { meet: meetName, rcDate: d, rcNo, rcDist: rcDist ?? undefined, rcName, rcDay: rcDay ?? undefined, rank: rank ?? undefined, rcPrize: prize, meetName, stTime: stTime ?? undefined },
          });
          totalRaces++;
        }

        await this.delay(200);
      } catch (err) {
        this.logger.warn(`[fetchRacePlanSchedule] ${meet.name} ${d} failed`, err);
      }
    }

    return { races: totalRaces };
  }

  /**
   * API72_2 race plan schedule — queries all data for a specific year/month (if meet omitted, all racecourses for that month).
   * For full year load, call in a loop for months 1~12.
   */
  async fetchRacePlanScheduleByYearMonth(
    year: number,
    month: number,
  ): Promise<{ races: number }> {
    if (!this.ensureServiceKey()) {
      return { races: 0 };
    }
    const rcYear = String(year);
    const rcMonth = `${year}${String(month).padStart(2, '0')}`;
    const baseUrl = await this.resolveBaseUrl();
    const url = `${baseUrl}/API72_2/racePlan_2`;

    let totalRaces = 0;
    const numOfRows = 500;
    let pageNo = 1;

    for (;;) {
      try {
        const params: Record<string, string | number> = {
          serviceKey: decodeURIComponent(this.serviceKey),
          rc_year: rcYear,
          rc_month: rcMonth,
          numOfRows,
          pageNo,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: Record<string, unknown>[] = [];
        const body = response.data?.response?.body;
        const bodyItems = body?.items;
        if (bodyItems) {
          if (Array.isArray(bodyItems)) {
            items = bodyItems;
          } else if (bodyItems.item) {
            const raw = bodyItems.item;
            items = Array.isArray(raw) ? raw : [raw];
          }
        }

        for (const item of items) {
          const v = (key: string): string | null => {
            const x = item[key] ?? (item as Record<string, unknown>)[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
            return x != null ? String(x) : null;
          };
          const rcNo = v('rcNo') || v('rc_no') || '';
          const rcDateRaw = v('rcDate') ?? v('rc_date');
          if (!rcNo || !rcDateRaw) continue;

          const rcDate = this.normalizeToYyyyMmDd(rcDateRaw);
          const meetRaw = v('meet') ?? '';
          const meetName = toKraMeetName(meetRaw) || '서울';

          const rcName = (v('rcName') ?? v('rc_name') ?? '').trim() || `경주 ${rcNo}R`;
          const rcDist = v('rcDist') ?? v('rc_dist');
          const rcDay = v('rcDay') ?? v('rc_day');
          const rank = v('rank') ?? v('rcGrade') ?? v('rc_grade');
          const prizeRaw = v('rcPrize') ?? v('rc_prize') ?? v('chaksun1') ?? v('chaksun_1') ?? '0';
          const prize = parseInt(String(prizeRaw).replace(/,/g, ''), 10) || undefined;
          const stTime = v('rcStartTime') ?? v('rc_start_time') ?? v('stTime') ?? v('st_time');

          await this.prisma.race.upsert({
            where: { meet_rcDate_rcNo: { meet: meetName, rcDate, rcNo } },
            update: { rcDist: rcDist ?? undefined, rcName, rcDay: rcDay ?? undefined, rank: rank ?? undefined, rcPrize: prize, stTime: stTime ?? undefined },
            create: { meet: meetName, rcDate, rcNo, rcDist: rcDist ?? undefined, rcName, rcDay: rcDay ?? undefined, rank: rank ?? undefined, rcPrize: prize, meetName, stTime: stTime ?? undefined },
          });
          totalRaces++;
        }

        const totalCount =
          body?.totalCount != null ? Number(String(body.totalCount)) : 0;
        if (
          items.length < numOfRows ||
          (totalCount > 0 && totalRaces >= totalCount)
        ) {
          break;
        }
        pageNo++;
        await this.delay(200);
      } catch (err) {
        this.logger.warn(`[fetchRacePlanScheduleByYearMonth] ${rcYear}-${String(month).padStart(2, '0')} page ${pageNo} failed`, err);
        break;
      }
    }

    return { races: totalRaces };
  }

  /**
   * API72_2 race plan schedule — loads entire year (months 1~12).
   * Calls 12 times by month to insert all race days for that year into DB. (e.g., full year 2026)
   */
  async fetchRacePlanScheduleForYear(year: number): Promise<{
    races: number;
    monthsProcessed: number;
  }> {
    if (!this.ensureServiceKey()) {
      return { races: 0, monthsProcessed: 0 };
    }
    let totalRaces = 0;
    for (let month = 1; month <= 12; month++) {
      const result = await this.fetchRacePlanScheduleByYearMonth(year, month);
      totalRaces += result.races;
      await this.delay(300);
    }
    return { races: totalRaces, monthsProcessed: 12 };
  }

  /**
   * Fetch upcoming race schedules for the next 3 months (Fri/Sat/Sun).
   * 1) API72_2 race plan — available even for future dates
   * 2) API26_2 entry sheet — usually available 2-3 days before race day
   */
  async syncUpcomingSchedules(): Promise<{
    message: string;
    races: number;
    entries: number;
    datesProcessed: number;
  }> {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY not configured.',
        races: 0,
        entries: 0,
        datesProcessed: 0,
      };
    }
    const today = this.formatYyyyMmDd(dayjs());
    const threeMonthsLater = this.formatYyyyMmDd(dayjs().add(3, 'month'));
    const dates = this.getRaceDateRange(today, threeMonthsLater);

    this.logger.log(
      `[syncUpcomingSchedules] ${dates.length} race days (Fri/Sat/Sun): ${today} ~ ${threeMonthsLater}`,
    );

    let totalRaces = 0;
    let totalEntries = 0;

    for (const d of dates) {
      try {
        const planRes = await this.fetchRacePlanSchedule(d);
        const entryRes = await this.syncEntrySheet(d);

        totalRaces += Math.max(planRes.races ?? 0, entryRes.races ?? 0);
        totalEntries += entryRes.entries ?? 0;

        await this.delay(300);
      } catch (err) {
        this.logger.warn(`[syncUpcomingSchedules] ${d} failed`, err);
      }
    }

    return {
      message: `Schedule sync complete: ${dates.length} days, ${totalRaces} races, ${totalEntries} entries`,
      races: totalRaces,
      entries: totalEntries,
      datesProcessed: dates.length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async fetchRaceResults(
    date: string,
    createRaceIfMissing = false,
    opts?: KraSyncProgressOptions,
  ): Promise<{ message: string; totalResults?: number }> {
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY not configured.', totalResults: 0 };
    }
    this.logger.log(`Fetching race results for date: ${date}`);
    const endpoint = 'raceResult';
    const baseUrl = await this.resolveBaseUrl();

    let totalResults = 0;
    const failed500Meets: string[] = [];
    const totalMeets = KRA_MEETS.length;

    for (let meetIndex = 0; meetIndex < KRA_MEETS.length; meetIndex++) {
      const meet = KRA_MEETS[meetIndex];
      opts?.onProgress?.(
        Math.round(((meetIndex + 0.5) / totalMeets) * 100),
        `경주 결과 수집: ${meet.name} (${meetIndex + 1}/${totalMeets})`,
      );
      const start = Date.now();
      try {
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        // KRA official: API4_3/raceResult_3 (docs/legacy/KRA_OFFICIAL_GUIDE.md)
        const url = `${baseUrl}/API4_3/raceResult_3`;
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

        // Pagination: fetch additional pages when totalCount is exceeded
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

          // RaceEntry integration: if results API runs first, Entry may be missing → supplement Entry with results data
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

          // KRA response: ord=finishing order, rank=grade condition. rcRank uses ord (finishing order).
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
          const { ordInt: ordIntVal, ordType: ordTypeVal } = parseOrd(ordStr);
          const resultData: Record<string, unknown> = {
            raceId: race.id,
            hrNo: sv(item.hrNo ?? item.hr_no) ?? '',
            hrName: sv(item.hrName ?? item.hr_name) ?? '',
            ord: ordStr,
            ordInt: ordIntVal,
            ordType: ordTypeVal,
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
        // Update prediction accuracy and generate post-race summary
        await Promise.allSettled(
          Array.from(racesToUpdate).map((raceId) =>
            this.resultsService.onResultsSyncedForRace(raceId),
          ),
        );

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
        `KRA API 500 for ${date} (${failed500Meets.join(', ')}) - may not have races on that date`,
      );
    }

    // If date has passed, update races for that date to COMPLETED regardless of whether results data was received
    // (Mark as completed even if KRA API fails or data is not received)
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const today = dayjs().format('YYYYMMDD');
    if (normalizedDate < today) {
      const updated = await this.prisma.race.updateMany({
        where: {
          rcDate: normalizedDate,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        data: { status: 'COMPLETED' },
      });
      if (updated.count > 0) {
        this.logger.log(
          `Marked ${updated.count} past-date races as COMPLETED (rcDate=${normalizedDate})`,
        );
        for (const r of await this.prisma.race.findMany({
          where: { rcDate: normalizedDate },
          select: { id: true },
        })) {
          await this.cache.del(`race:${r.id}`);
        }
      }
    }

    return {
      message: `Synced ${totalResults} results for ${date}`,
      totalResults,
    };
  }

  /**
   * Fetches entry sheet (KRA_ENTRY_SHEET_SPEC)
   * Endpoint: /API26_2/entrySheet_2
   * Queries all by meet·date then filters by rcNo
   */
  async fetchRaceEntries(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY not configured' };

    const meetCode = this.meetNameToCode(meet);
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const baseUrl = await this.resolveBaseUrl();

    try {
      const url = `${baseUrl}/API26_2/entrySheet_2`;
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
   * Fetches race horse details (KRA_RACE_HORSE_INFO_SPEC)
   * Endpoint: /API8_2/raceHorseInfo_2
   * Supplements RaceEntry with rcCntT, ord1CntT, rating, etc.
   */
  async fetchHorseDetails(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY not configured' };

    const baseUrl = await this.resolveBaseUrl();
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
        const url = `${baseUrl}/API8_2/raceHorseInfo_2`;
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
   * Fetches horse training history (KRA_TRAINING_SPEC)
   * Endpoint: /trcontihi/gettrcontihi
   * Only queries training data for the last 2 weeks from race day
   */
  async fetchTrainingData(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY not configured' };

    const baseUrl = await this.resolveBaseUrl();
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
        const url = `${baseUrl}/trcontihi/gettrcontihi`;
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

        // Delete existing training data then reload (by raceEntryId)
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
    const baseUrl = await this.resolveBaseUrl();

    const meetsToFetch = meet
      ? [{ code: meetToCode(meet), name: meet }]
      : KRA_MEETS;

    let totalJockeys = 0;

    for (const m of meetsToFetch) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/jktresult/getjktresult`;
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

  // --- KRA API: Trainer Details (API19_1 trainerInfo_1) ---
  /**
   * Fetches trainer total results by meet and saves to TrainerResult
   * @see docs/specs/KRA_TRAINER_SPEC.md
   */
  async fetchTrainerInfo(meet?: string): Promise<{ updated: number }> {
    this.logger.log(`Fetching trainer info${meet ? ` for meet ${meet}` : ''}`);
    const endpoint = 'trainerInfo';
    const baseUrl = await this.resolveBaseUrl();

    const meetsToFetch = meet
      ? [{ code: meetToCode(meet), name: meet }]
      : KRA_MEETS;

    let totalTrainers = 0;

    for (const m of meetsToFetch) {
      let pageNo = 1;
      const numOfRows = 500;
      let hasMore = true;

      while (hasMore) {
        const start = Date.now();
        try {
          const url = `${baseUrl}/API19_1/trainerInfo_1`;
          const params = {
            serviceKey: decodeURIComponent(this.serviceKey),
            meet: m.code,
            numOfRows,
            pageNo,
            _type: 'json',
          };

          const response = await firstValueFrom(
            this.httpService.get(url, { params }),
          );

          // API response: supports camelCase or snake_case
          let items: Array<Record<string, unknown>> = [];

          if (response.data?.response?.body?.items?.item) {
            const raw = response.data.response.body.items.item;
            items = Array.isArray(raw) ? raw : [raw];
          }

          const totalCount =
            response.data?.response?.body?.totalCount ??
            response.data?.response?.body?.totalcount ??
            0;

          for (const item of items) {
            const trNo = String(item.trNo ?? item['tr_no'] ?? '').trim();
            if (!trNo) continue;

            const trName = String(item.trName ?? item['tr_name'] ?? '');
            const rcCntT =
              parseInt(String(item.rcCntT ?? item['rc_cnt_t'] ?? ''), 10) || 0;
            const ord1CntT =
              parseInt(String(item.ord1CntT ?? item['ord1_cnt_t'] ?? ''), 10) ||
              0;
            const ord2CntT =
              parseInt(String(item.ord2CntT ?? item['ord2_cnt_t'] ?? ''), 10) ||
              0;
            const ord3CntT =
              parseInt(String(item.ord3CntT ?? item['ord3_cnt_t'] ?? ''), 10) ||
              0;
            const winRateTsum =
              parseFloat(
                String(item.winRateTsum ?? item['win_rate_tsum'] ?? ''),
              ) || 0.0;
            const quRateTsum =
              parseFloat(
                String(item.quRateTsum ?? item['qu_rate_tsum'] ?? ''),
              ) || 0.0;
            const plRateTsumRaw = item.plRateTsum ?? item['pl_rate_tsum'];
            const plRateTsum =
              plRateTsumRaw != null
                ? parseFloat(String(plRateTsumRaw))
                : undefined;

            const rcCntY =
              item.rcCntY != null || item['rc_cnt_y'] != null
                ? parseInt(String(item.rcCntY ?? item['rc_cnt_y'] ?? ''), 10) ||
                  0
                : undefined;
            const ord1CntY =
              item.ord1CntY != null || item['ord1_cnt_y'] != null
                ? parseInt(
                    String(item.ord1CntY ?? item['ord1_cnt_y'] ?? ''),
                    10,
                  ) || 0
                : undefined;
            const ord2CntY =
              item.ord2CntY != null || item['ord2_cnt_y'] != null
                ? parseInt(
                    String(item.ord2CntY ?? item['ord2_cnt_y'] ?? ''),
                    10,
                  ) || 0
                : undefined;
            const ord3CntY =
              item.ord3CntY != null || item['ord3_cnt_y'] != null
                ? parseInt(
                    String(item.ord3CntY ?? item['ord3_cnt_y'] ?? ''),
                    10,
                  ) || 0
                : undefined;
            const winRateY =
              item.winRateY != null || item['win_rate_y'] != null
                ? parseFloat(
                    String(item.winRateY ?? item['win_rate_y'] ?? ''),
                  ) || undefined
                : undefined;
            const quRateY =
              item.quRateY != null || item['qu_rate_y'] != null
                ? parseFloat(String(item.quRateY ?? item['qu_rate_y'] ?? '')) ||
                  undefined
                : undefined;
            const plRateY =
              item.plRateY != null || item['pl_rate_y'] != null
                ? parseFloat(String(item.plRateY ?? item['pl_rate_y'] ?? '')) ||
                  undefined
                : undefined;

            await this.prisma.trainerResult.upsert({
              where: {
                meet_trNo: { meet: m.code, trNo },
              },
              update: {
                trName,
                rcCntT,
                ord1CntT,
                ord2CntT,
                ord3CntT,
                winRateTsum,
                quRateTsum,
                plRateTsum: plRateTsum ?? undefined,
                rcCntY,
                ord1CntY,
                ord2CntY,
                ord3CntY,
                winRateY,
                quRateY,
                plRateY,
              },
              create: {
                meet: m.code,
                trNo,
                trName,
                rcCntT,
                ord1CntT,
                ord2CntT,
                ord3CntT,
                winRateTsum,
                quRateTsum,
                plRateTsum: plRateTsum ?? undefined,
                rcCntY,
                ord1CntY,
                ord2CntY,
                ord3CntY,
                winRateY,
                quRateY,
                plRateY,
              },
            });
            totalTrainers++;
          }

          const total =
            typeof totalCount === 'number'
              ? totalCount
              : parseInt(String(totalCount), 10) || 0;
          hasMore = items.length >= numOfRows && total > pageNo * numOfRows;
          pageNo++;

          await this.logKraSync(endpoint, {
            meet: m.code,
            status: 'SUCCESS',
            recordCount: items.length,
            durationMs: Date.now() - start,
          });
        } catch (error) {
          hasMore = false;
          await this.logKraSync(endpoint, {
            meet: m.code,
            status: 'FAILED',
            errorMessage:
              error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - start,
          });
          this.logger.error(
            `Failed to fetch trainer info for ${m.name}`,
            error,
          );
        }
      }
    }

    return { updated: totalTrainers };
  }

  // --- KRA API: Track Info (API189_1) ---
  async fetchTrackInfo(date: string) {
    const endpoint = 'trackInfo';
    const baseUrl = await this.resolveBaseUrl();

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/API189_1/Track_1`;
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
                    ? `${item.track ?? ''} (moisture ${item.moisture ?? '-'}%)`
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

  // --- KRA API: Race Horse Rating Info (API77) ---
  /**
   * Fetches rating history (rating1~4) for today's entries and updates RaceEntry
   * API77 doesn't support meet/hr_no filter → paginate and match with today's hrNo set
   * @see docs/specs/KRA_RATING_SPEC.md
   */
  async fetchRaceHorseRatings(date: string): Promise<{ updated: number }> {
    const endpoint = 'raceHorseRating';
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const baseUrl = await this.resolveBaseUrl();

    const entries = await this.prisma.raceEntry.findMany({
      where: { race: { rcDate: normalizedDate } },
      select: { id: true, hrNo: true, race: { select: { meet: true } } },
    });
    if (entries.length === 0) return { updated: 0 };

    const needKeys = new Set(
      entries.map((e) => `${e.race?.meet ?? ''}:${e.hrNo}`),
    );
    const entryByKey = new Map(
      entries.map((e) => [`${e.race?.meet ?? ''}:${e.hrNo}`, e]),
    );

    let updated = 0;
    let pageNo = 1;
    const numOfRows = 500;
    let hasMore = true;

    while (hasMore && needKeys.size > 0) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/API77/raceHorseRating`;
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          numOfRows,
          pageNo,
          _type: 'json',
        };

        const response = await firstValueFrom(
          this.httpService.get(url, { params }),
        );

        let items: Array<{
          meet?: string;
          hrNo?: string;
          hrName?: string;
          rating1?: string | number;
          rating2?: string | number;
          rating3?: string | number;
          rating4?: string | number;
        }> = [];
        const body = response.data?.response?.body;
        if (body?.items?.item) {
          const raw = body.items.item;
          items = Array.isArray(raw) ? raw : [raw];
        }

        for (const item of items) {
          const meetRaw = String(item.meet ?? '');
          const meetStr = ['서울', '제주', '부산경남'].includes(meetRaw)
            ? meetRaw
            : meetRaw === '1'
              ? '서울'
              : meetRaw === '2'
                ? '제주'
                : meetRaw === '3'
                  ? '부산경남'
                  : null;
          const hrNo = item.hrNo != null ? String(item.hrNo) : '';
          if (!meetStr || !hrNo) continue;

          const key = `${meetStr}:${hrNo}`;
          if (!needKeys.has(key)) continue;

          const entry = entryByKey.get(key);
          if (!entry) continue;

          const r1 = item.rating1;
          const rating1 = r1 != null ? parseFloat(String(r1)) : undefined;
          const ratingHistory: number[] = [];
          for (const r of [item.rating2, item.rating3, item.rating4]) {
            if (r != null) {
              const v = parseFloat(String(r));
              if (!Number.isNaN(v)) ratingHistory.push(v);
            }
          }

          await this.prisma.raceEntry.update({
            where: { id: entry.id },
            data: {
              rating: rating1 ?? undefined,
              ratingHistory:
                ratingHistory.length > 0 ? ratingHistory : undefined,
            },
          });
          needKeys.delete(key);
          updated++;
        }

        hasMore = items.length >= numOfRows;
        pageNo++;
        if (items.length === 0) hasMore = false;

        await this.logKraSync(endpoint, {
          rcDate: normalizedDate,
          status: 'SUCCESS',
          recordCount: items.length,
          durationMs: Date.now() - start,
        });

        await this.delay(200);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        await this.logKraSync(endpoint, {
          rcDate: normalizedDate,
          status: 'FAILED',
          errorMessage: msg,
          durationMs: Date.now() - start,
        });
        const statusCode =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          typeof (error as { response?: { status?: number } }).response?.status === 'number'
            ? (error as { response: { status: number } }).response.status
            : null;
        this.logger.warn(
          `Failed to fetch race horse ratings${statusCode != null ? ` (${statusCode})` : ''}: ${msg}`,
        );
        break;
      }
    }

    return { updated };
  }

  // --- KRA API: Horse Sectional Race Records (API37_1 sectionRecord_1) ---
  /**
   * Fetches sectional records (S1F, G3F, G1F) for today's entries and saves to RaceEntry.sectionalStats
   * @see docs/specs/KRA_HORSE_SECTIONAL_SPEC.md
   */
  async fetchHorseSectionalRecords(date: string): Promise<{ updated: number }> {
    const endpoint = 'horseSectional';
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const baseUrl = await this.resolveBaseUrl();

    const entries = await this.prisma.raceEntry.findMany({
      where: { race: { rcDate: normalizedDate } },
      select: { id: true, hrNo: true, race: { select: { meet: true } } },
    });
    if (entries.length === 0) return { updated: 0 };

    const needKeys = new Set(
      entries.map((e) => `${e.race?.meet ?? ''}:${e.hrNo}`),
    );
    const entryByKey = new Map(
      entries.map((e) => [`${e.race?.meet ?? ''}:${e.hrNo}`, e]),
    );
    let updated = 0;

    for (const meet of KRA_MEETS) {
      let pageNo = 1;
      const numOfRows = 100;
      let hasMore = true;

      while (hasMore) {
        const start = Date.now();
        try {
          const url = `${baseUrl}/API37_1/sectionRecord_1`;
          const params = {
            serviceKey: decodeURIComponent(this.serviceKey),
            meet: meet.code,
            rc_date: normalizedDate,
            numOfRows,
            pageNo,
            _type: 'json',
          };

          const response = await firstValueFrom(
            this.httpService.get(url, { params }),
          );

          const body = response.data?.response?.body;
          let items: Array<Record<string, unknown>> = [];
          if (body?.items?.item) {
            const raw = body.items.item;
            items = Array.isArray(raw) ? raw : [raw];
          }

          for (const item of items) {
            const meetStr = meet.name;
            const hrNo = String(item.hrNo ?? item['hr_no'] ?? '').trim();
            if (!hrNo) continue;

            const key = `${meetStr}:${hrNo}`;
            if (!needKeys.has(key)) continue;

            const entry = entryByKey.get(key);
            if (!entry) continue;

            const s1fAvg = this.parseSectionalVal(
              item.s1fAvg ??
                item['s1f_avg'] ??
                item.S1F_AVG ??
                item['S1F'] ??
                item.seS1fAccTime,
            );
            const g1fAvg = this.parseSectionalVal(
              item.g1fAvg ??
                item['g1f_avg'] ??
                item.G1F_AVG ??
                item['G1F'] ??
                item.seG1fAccTime,
            );
            const s1fMin = this.parseSectionalVal(
              item.s1fMin ?? item['s1f_min'] ?? item.S1F_MIN,
            );
            const s1fMax = this.parseSectionalVal(
              item.s1fMax ?? item['s1f_max'] ?? item.S1F_MAX,
            );
            const g1fMin = this.parseSectionalVal(
              item.g1fMin ?? item['g1f_min'] ?? item.G1F_MIN,
            );
            const g1fMax = this.parseSectionalVal(
              item.g1fMax ?? item['g1f_max'] ?? item.G1F_MAX,
            );

            const stats: Record<string, number> = {};
            if (s1fAvg != null) stats.s1fAvg = s1fAvg;
            if (g1fAvg != null) stats.g1fAvg = g1fAvg;
            if (s1fMin != null) stats.s1fMin = s1fMin;
            if (s1fMax != null) stats.s1fMax = s1fMax;
            if (g1fMin != null) stats.g1fMin = g1fMin;
            if (g1fMax != null) stats.g1fMax = g1fMax;
            const sectionalStats: Prisma.InputJsonValue | undefined =
              Object.keys(stats).length > 0 ? stats : undefined;

            if (sectionalStats) {
              await this.prisma.raceEntry.update({
                where: { id: entry.id },
                data: { sectionalStats },
              });
              needKeys.delete(key);
              updated++;
            }
          }

          hasMore = items.length >= numOfRows;
          pageNo++;

          await this.logKraSync(endpoint, {
            meet: meet.code,
            rcDate: normalizedDate,
            status: 'SUCCESS',
            recordCount: items.length,
            durationMs: Date.now() - start,
          });

          await this.delay(200);
        } catch (error) {
          hasMore = false;
          await this.logKraSync(endpoint, {
            meet: meet.code,
            rcDate: normalizedDate,
            status: 'FAILED',
            errorMessage:
              error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - start,
          });
          this.logger.error(
            `Failed to fetch horse sectional for ${meet.name}`,
            error,
          );
        }
      }
    }

    return { updated };
  }

  private parseSectionalVal(val: unknown): number | null {
    if (val == null) return null;
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  // --- KRA API: Entry Horse Weight (API25_1) ---
  async fetchHorseWeight(date: string) {
    const endpoint = 'horseWeight';
    const baseUrl = await this.resolveBaseUrl();

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/API25_1/entryHorseWeightInfo_1`;
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
            const raw = item.wgHr ?? item.wg_hr ?? null;
            const horseWeight =
              raw == null ? null : typeof raw === 'number' ? String(raw) : String(raw);
            await this.prisma.raceEntry.update({
              where: { id: entry.id },
              data: { horseWeight },
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

  // --- KRA API: Equipment & Bleeding (API24_1) ---
  async fetchEquipmentBleeding(date: string) {
    const endpoint = 'equipmentBleeding';
    const baseUrl = await this.resolveBaseUrl();

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/API24_1/horseMedicalAndEquipment_1`;
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

  // --- KRA API: Entry Cancellation (API9_1) ---
  async fetchHorseCancel(date: string) {
    const endpoint = 'horseCancel';
    const baseUrl = await this.resolveBaseUrl();

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const url = `${baseUrl}/API9_1/raceHorseCancelInfo_1`;
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
      return { message: 'KRA_SERVICE_KEY not configured.' };
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

    // 1. Track info (weather, track condition)
    await this.fetchTrackInfo(date);

    // 2. Entry horse weight
    await this.fetchHorseWeight(date);

    // 3. Equipment & bleeding
    await this.fetchEquipmentBleeding(date);

    // 4. Entry cancellation
    await this.fetchHorseCancel(date);

    // 5. Trainer details (API19_1) — win rate/place rate
    await this.fetchTrainerInfo();

    // 6. Race horse rating info (API77) — rating1~4 history
    await this.fetchRaceHorseRatings(date);

    // 6.5. Horse sectional race records (API37_1) — S1F/G3F/G1F
    await this.fetchHorseSectionalRecords(date);

    // 7. Training & race horse details (by race)
    let processedCount = 0;
    for (const race of races) {
      await this.fetchTrainingData(race.meet, race.rcDate, race.rcNo);
      await this.fetchHorseDetails(race.meet, race.rcDate, race.rcNo);
      processedCount++;
    }

    return { message: `Synced analysis data for ${processedCount} races` };
  }

  /**
   * Loads sample race data (for development without KRA API key)
   * Called from Admin to immediately load test data
   */
  async seedSampleRaces(
    date?: string,
  ): Promise<{ races: number; entries: number; rcDate: string }> {
    const rcDate = date
      ? this.normalizeToYyyyMmDd(date)
      : this.getTodayDateString();

    const MEETS = [KRA_MEETS[0], KRA_MEETS[2]]; // Seoul, BusanGyeongnam (for samples)
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
        const rcName = `Race ${r}`;
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
