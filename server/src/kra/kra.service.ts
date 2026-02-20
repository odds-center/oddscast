import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalConfigService } from '../config/config.service';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { KRA_MEETS, meetToCode, toKraMeetName } from './constants';
import { parseOrd } from './ord-parser';
import type { KraApiItem, KraSyncAllOutput } from '@goldenrace/shared';

const DEFAULT_KRA_BASE_URL = 'http://apis.data.go.kr/B551015';

@Injectable()
export class KraService {
  private readonly logger = new Logger(KraService.name);
  private readonly serviceKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private globalConfigService: GlobalConfigService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    dayjs.extend(customParseFormat);
    this.serviceKey = this.configService.get<string>('KRA_SERVICE_KEY', '');
  }

  /** GlobalConfig의 kra_base_url_override 사용, 없으면 기본 URL 반환 */
  private async resolveBaseUrl(): Promise<string> {
    const override = await this.globalConfigService.get('kra_base_url_override');
    return (override?.trim() && override.length > 0) ? override.trim() : DEFAULT_KRA_BASE_URL;
  }

  /** Admin용: 현재 KRA 설정 상태 (Base URL, API 키 여부) */
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
   * 0. 미래 경주계획표 (매주 월요일 03:00)
   * API72_2 경주계획표로 오늘~1년 내 금·토·일 Race 적재.
   * 출전표(API26_2)는 경주 2~3일 전에만 제공되므로, 미래 스케줄은 경주계획표로 먼저 확보.
   */
  @Cron('0 3 * * 1') // Monday 03:00
  async syncFutureRacePlans() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Future Race Plans Sync (API72_2)');
    await this.syncUpcomingSchedules();
  }

  /**
   * 1. Weekly Schedule Fetching (Wed, Thu 18:00)
   * Pre-fetch the entry sheet for the upcoming weekend.
   * 먼저 경주계획표로 Race 생성 후 출전표 적재.
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
   * 3. Real-time Results & Updates (Fri, Sat, Sun 10:30 - 19:00, every 30 mins)
   * Fetches race results as they happen and updates analysis data.
   */
  @Cron('0,30 10-19 * * 5,6,0')
  async syncRealtimeResults() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Real-time Result Sync');
    const today = this.getTodayDateString();

    // 1. Fetch Results
    await this.fetchRaceResults(today);

    // 2. Update Analysis (in case of weight changes or late info)
    await this.syncAnalysisData(today);
  }

  /**
   * 4. 다음날 새벽 — 전날(금·토·일) 경주 결과 사후 동기화
   * KRA API에 결과가 올라온 뒤 DB에 미리 적재해 두어 사용자 요청 시 즉시 응답
   */
  @Cron('0 6 * * *') // 매일 06:00
  async syncPreviousDayResults() {
    if (!this.ensureServiceKey()) return;
    const yesterday = dayjs().subtract(1, 'day');
    const day = yesterday.day();
    if (day !== 0 && day !== 5 && day !== 6) return;
    const dateStr = this.formatYyyyMmDd(yesterday);
    this.logger.log(`Running Previous Day Result Sync: ${dateStr}`);
    await this.fetchRaceResults(dateStr);
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
    const baseUrl = await this.resolveBaseUrl();

    let totalRaces = 0;
    let totalEntries = 0;

    for (const meet of KRA_MEETS) {
      const start = Date.now();
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

        // totalCount가 없어도 전체 페이지 수집: 마지막 페이지가 numOfRows 미만일 때까지 페이징
        const numOfRows = 1000;
        const totalCount = body?.totalCount != null ? Number(body.totalCount) : null;
        let pageNo = 2;
        for (;;) {
          const shouldFetchMore =
            totalCount != null
              ? totalCount > items.length && totalCount > 0
              : items.length >= numOfRows; // 마지막 응답이 꽉 찼으면 다음 페이지 있을 수 있음
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
   * 특정 날짜에 대한 스케줄 적재 (경주계획표 → 출전표)
   * date 지정 시 Admin sync/schedule에서 사용.
   */
  async syncScheduleForDate(date: string): Promise<{
    message: string;
    races: number;
    entries: number;
  }> {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY 미설정.',
        races: 0,
        entries: 0,
      };
    }
    const d = this.normalizeToYyyyMmDd(date);
    const planRes = await this.fetchRacePlanSchedule(d);
    const entryRes = await this.syncEntrySheet(d);
    return {
      message: `스케줄 적재 완료: ${planRes.races}경주(계획표), ${entryRes.entries}출마`,
      races: Math.max(planRes.races ?? 0, entryRes.races ?? 0),
      entries: entryRes.entries ?? 0,
    };
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
      await this.fetchRacePlanSchedule(d);
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

  /**
   * API72_2 경주계획표 — 미래 경주일에도 스케줄(경주 정보) 조회 가능.
   * 출전표(API26_2)는 보통 경주 2~3일 전에만 데이터 제공.
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
        this.logger.warn(`[fetchRacePlanSchedule] ${meet.name} ${d} 실패`, err);
      }
    }

    return { races: totalRaces };
  }

  /**
   * API72_2 경주계획표 — 특정 연·월 전체 조회 (meet 생략 시 해당 월 전 경마장 데이터).
   * 연도 전체 적재 시 1~12월 루프로 호출하면 됨.
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
        this.logger.warn(`[fetchRacePlanScheduleByYearMonth] ${rcYear}-${String(month).padStart(2, '0')} page ${pageNo} 실패`, err);
        break;
      }
    }

    return { races: totalRaces };
  }

  /**
   * API72_2 경주계획표 — 특정 연도 전체(1~12월) 적재.
   * 월별 12회 호출로 해당 연도 시행일을 DB에 모두 넣음. (예: 2026년 전체)
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
   * 오늘부터 1년 내 미래 경주일(금·토·일) 전체 적재.
   * 1) API72_2 경주계획표로 Race 생성 (미래 일정도 조회 가능)
   * 2) API26_2 출전표로 출전마 추가 (보통 경주 2~3일 전부터 가능)
   */
  async syncUpcomingSchedules(): Promise<{
    message: string;
    races: number;
    entries: number;
    datesProcessed: number;
  }> {
    if (!this.ensureServiceKey()) {
      return {
        message: 'KRA_SERVICE_KEY 미설정. server/.env에 KRA_SERVICE_KEY를 추가하세요.',
        races: 0,
        entries: 0,
        datesProcessed: 0,
      };
    }
    const today = this.formatYyyyMmDd(dayjs());
    const oneYearLater = this.formatYyyyMmDd(dayjs().add(1, 'year'));
    const dates = this.getRaceDateRange(today, oneYearLater);

    this.logger.log(
      `[syncUpcomingSchedules] ${dates.length}일(금·토·일) 경주계획표+출전표 적재: ${today} ~ ${oneYearLater}`,
    );

    let totalRaces = 0;
    let totalEntries = 0;

    for (const d of dates) {
      try {
        // 1) 경주계획표(API72_2) — 미래 일정도 조회 가능
        const planRes = await this.fetchRacePlanSchedule(d);

        // 2) 출전표(API26_2) — 출전마 정보 (경주 2~3일 전부터 보통 제공)
        const entryRes = await this.syncEntrySheet(d);

        totalRaces += Math.max(planRes.races ?? 0, entryRes.races ?? 0);
        totalEntries += entryRes.entries ?? 0;

        await this.delay(300);
      } catch (err) {
        this.logger.warn(`[syncUpcomingSchedules] ${d} 실패`, err);
      }
    }

    return {
      message: `미래 스케줄 적재 완료: ${dates.length}일, ${totalRaces}경주, ${totalEntries}출마`,
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
  ): Promise<{ message: string; totalResults?: number }> {
    if (!this.ensureServiceKey()) {
      return { message: 'KRA_SERVICE_KEY 미설정.', totalResults: 0 };
    }
    this.logger.log(`Fetching race results for date: ${date}`);
    const endpoint = 'raceResult';
    const baseUrl = await this.resolveBaseUrl();

    let totalResults = 0;
    const failed500Meets: string[] = [];

    for (const meet of KRA_MEETS) {
      const start = Date.now();
      try {
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        // KRA 공식: API4_3/raceResult_3 (docs/legacy/KRA_OFFICIAL_GUIDE.md)
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

    // 날짜가 지났으면 결과 데이터 수신 여부와 관계없이 해당 날짜 경주를 COMPLETED로 업데이트
    // (KRA API 실패·데이터 미수신 시에도 종료 처리)
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
          `날짜 지난 경주 ${updated.count}건 COMPLETED 처리 (rcDate=${normalizedDate})`,
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
   * 출전표 조회 (KRA_ENTRY_SHEET_SPEC)
   * Endpoint: /API26_2/entrySheet_2
   * meet·date 기준 전체 조회 후 rcNo로 필터
   */
  async fetchRaceEntries(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

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
   * 경주마 상세정보 조회 (KRA_RACE_HORSE_INFO_SPEC)
   * Endpoint: /API8_2/raceHorseInfo_2
   * rcCntT, ord1CntT, rating 등으로 RaceEntry 보강
   */
  async fetchHorseDetails(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

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
   * 말훈련내역 조회 (KRA_TRAINING_SPEC)
   * Endpoint: /trcontihi/gettrcontihi
   * 경기일 기준 최근 2주 훈련 데이터만 조회
   */
  async fetchTrainingData(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey()) return { message: 'KRA_SERVICE_KEY 미설정' };

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

  // --- KRA API: 조교사 상세정보 (API19_1 trainerInfo_1) ---
  /**
   * meet별 조교사 통산 성적 조회 후 TrainerResult에 저장
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

          // API 응답: camelCase 또는 snake_case 지원
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

  // --- KRA API: 경주로정보 (API189_1) ---
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

  // --- KRA API: 경주마 레이팅 정보 (API77) ---
  /**
   * 당일 출전마의 레이팅 추이(rating1~4) 조회 후 RaceEntry 업데이트
   * API77은 meet/hr_no 필터 미지원 → 페이지네이션하여 당일 hrNo 세트와 매칭
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
      } catch (error) {
        await this.logKraSync(endpoint, {
          rcDate: normalizedDate,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
        this.logger.error('Failed to fetch race horse ratings', error);
        break;
      }
    }

    return { updated };
  }

  // --- KRA API: 마필 구간별 경주기록 (API37_1 sectionRecord_1) ---
  /**
   * 당일 출전마의 구간별(S1F, G3F, G1F) 기록 조회 후 RaceEntry.sectionalStats 저장
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

  // --- KRA API: 출전마 체중 (API25_1) ---
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

  // --- KRA API: 출전취소 (API9_1) ---
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

    // 5. 조교사 상세정보 (API19_1) — 승률/복승률
    await this.fetchTrainerInfo();

    // 6. 경주마 레이팅 정보 (API77) — rating1~4 추이
    await this.fetchRaceHorseRatings(date);

    // 6.5. 마필 구간별 경주기록 (API37_1) — S1F/G3F/G1F
    await this.fetchHorseSectionalRecords(date);

    // 7. 훈련·경주마상세 (경주별)
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
