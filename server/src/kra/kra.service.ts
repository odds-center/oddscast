import {
  BadRequestException,
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RaceStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Training } from '../database/entities/training.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import {
  BatchSchedule,
  BATCH_JOB_KRA_RESULT_FETCH,
} from '../database/entities/batch-schedule.entity';
import { RaceDividend } from '../database/entities/race-dividend.entity';
import { BatchScheduleStatus } from '../database/db-enums';
import { GlobalConfigService } from '../config/config.service';
import { ResultsService } from '../results/results.service';
import { PredictionsService } from '../predictions/predictions.service';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  kst,
  todayKstYyyymmdd,
  yesterdayKstYyyymmdd,
} from '../common/utils/kst';
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
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(Training)
    private readonly trainingRepo: Repository<Training>,
    @InjectRepository(JockeyResult)
    private readonly jockeyResultRepo: Repository<JockeyResult>,
    @InjectRepository(TrainerResult)
    private readonly trainerResultRepo: Repository<TrainerResult>,
    @InjectRepository(KraSyncLog)
    private readonly kraSyncLogRepo: Repository<KraSyncLog>,
    @InjectRepository(BatchSchedule)
    private readonly batchScheduleRepo: Repository<BatchSchedule>,
    @InjectRepository(RaceDividend)
    private readonly dividendRepo: Repository<RaceDividend>,
    private resultsService: ResultsService,
    private predictionsService: PredictionsService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    dayjs.extend(customParseFormat);
    this.serviceKey = this.configService.get<string>('KRA_SERVICE_KEY', '');
  }

  /** Uses GlobalConfig's kra_base_url_override, returns default URL if not set */
  private async resolveBaseUrl(): Promise<string> {
    const override = await this.globalConfigService.get(
      'kra_base_url_override',
    );
    return override?.trim() && override.length > 0
      ? override.trim()
      : DEFAULT_KRA_BASE_URL;
  }

  /** Find race id by meet/rcDate/rcNo (avoids raw SQL). */
  private async findRaceByMeetDateNo(
    meet: string,
    rcDate: string,
    rcNo: string,
  ): Promise<{ id: number } | null> {
    const r = await this.raceRepo.findOne({
      where: { meet, rcDate, rcNo },
      select: ['id'],
    });
    return r ? { id: r.id } : null;
  }

  /**
   * Build Race upsert payload from KRA item fields.
   * Race, RaceEntry[], RaceResult[] (and optionally Prediction) are one set per race;
   * use this same mapping for plan, entry sheet, and result APIs so data stays consistent.
   */
  private buildRaceUpsertPayload(params: {
    meet: string;
    meetName: string | null;
    rcDate: string;
    rcNo: string;
    rcName: string;
    rcDist?: string | null;
    rcDay?: string | null;
    rank?: string | null;
    rcPrize?: number | null;
    stTime?: string | null;
    rcCondition?: string | null;
    weather?: string | null;
    track?: string | null;
    status?: RaceStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Parameters<Repository<Race>['upsert']>[0] {
    const now = params.createdAt;
    return {
      meet: params.meet,
      meetName: params.meetName ?? null,
      rcDate: params.rcDate,
      rcNo: params.rcNo,
      rcName: params.rcName,
      rcDist: params.rcDist ?? null,
      rcDay: params.rcDay ?? null,
      rank: params.rank ?? null,
      rcPrize: params.rcPrize ?? null,
      stTime: params.stTime ?? null,
      rcCondition: params.rcCondition ?? null,
      weather: params.weather ?? null,
      track: params.track ?? null,
      ...(params.status != null && { status: params.status }),
      createdAt: now,
      updatedAt: params.updatedAt,
    };
  }

  /** For Admin: current KRA configuration status (Base URL, API key presence) */
  async getKraStatus(): Promise<{
    baseUrlInUse: string;
    serviceKeyConfigured: boolean;
  }> {
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
  @Cron('0 4 * * *', { timeZone: 'Asia/Seoul' }) // Daily 04:00 KST
  async syncDailyUpcomingRacePlans() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Daily Upcoming Race Plans Sync (next 7 days)');
    const today = this.formatYyyyMmDd(kst());
    const nextWeek = this.formatYyyyMmDd(kst().add(7, 'day'));
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
  @Cron('0 3 * * 1', { timeZone: 'Asia/Seoul' }) // Monday 03:00 KST
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
  @Cron('0 18 * * 3,4', { timeZone: 'Asia/Seoul' }) // Wed, Thu 18:00 KST
  async syncWeeklySchedule() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Weekly Schedule Sync (Pre-fetch)');
    const dates = this.getUpcomingWeekendDates();
    for (const date of dates) {
      await this.fetchRacePlanSchedule(date);
      await this.syncEntrySheet(date);
      // Also attempt analysis data (horse weight, ratings, equipment) — available 2-3 days before race day
      try {
        await this.syncAnalysisData(date);
      } catch (err) {
        this.logger.warn(`[syncWeeklySchedule] Analysis data not yet available for ${date}`, err);
      }
      await this.delay(300);
    }
  }

  /**
   * 2. Race day morning finalization (Fri, Sat, Sun 08:00)
   * Final sync before races start. Updates jockeys, weights, and ratings.
   */
  @Cron('0 8 * * 5,6,0', { timeZone: 'Asia/Seoul' }) // Fri, Sat, Sun 08:00 KST
  async syncRaceDayMorning() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running Race Day Morning Sync (Finalization)');
    const today = todayKstYyyymmdd();

    await this.syncEntrySheet(today);
    await this.syncAnalysisData(today);
  }

  /**
   * 2b. Pre-race prediction auto-generation (Fri, Sat, Sun 06:30 KST)
   * Generates AI predictions for today's races that don't have COMPLETED predictions.
   * Runs before the morning sync to ensure predictions are ready when users check.
   */
  @Cron('30 6 * * 5,6,0', { timeZone: 'Asia/Seoul' }) // Fri, Sat, Sun 06:30 KST
  async generatePreRacePredictions() {
    if (!this.ensureServiceKey()) return;
    const today = todayKstYyyymmdd();
    this.logger.log(
      `Running Pre-Race Prediction Generation for ${today}`,
    );
    try {
      const result = await this.predictionsService.generatePredictionsForDate(today);
      this.logger.log(
        `Pre-Race Predictions: ${result.generated}/${result.requested} generated, ${result.failed} failed`,
      );
      if (result.errors.length > 0) {
        this.logger.warn(
          `Pre-Race Prediction errors: ${result.errors.slice(0, 5).join('; ')}`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Pre-Race Prediction Generation failed:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /**
   * Minutes after race start to consider race "ended" for result sync.
   * Korean racing: typically ~2–3 min per race; KRA result API reflects within ~5–10 min.
   */
  private static readonly RACE_END_BUFFER_MINUTES = 10;

  /**
   * Parse race end time (rcDate + stTime + buffer) as UTC ms. KST assumed for rcDate/stTime.
   * stTime: "10:30" or "1030". If missing, use end of rcDate day (23:59 KST).
   */
  private getRaceEndTimeMs(
    rcDate: string,
    stTime: string | null,
    bufferMin = 20,
  ): number {
    const norm = String(rcDate).replace(/-/g, '').slice(0, 8);
    if (norm.length < 8) return 0;
    if (stTime && String(stTime).trim()) {
      const t = String(stTime)
        .trim()
        .replace(/^[^\d]*/, '')
        .replace(/:/g, '');
      const hour =
        t.length >= 2 ? parseInt(t.slice(0, 2), 10) : parseInt(t, 10);
      const min = t.length >= 4 ? parseInt(t.slice(2, 4), 10) : 0;
      if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
        const iso = `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`;
        const start = new Date(iso).getTime();
        if (!Number.isNaN(start)) return start + bufferMin * 60 * 1000;
      }
    }
    const endOfDay = new Date(
      `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T23:59:00+09:00`,
    ).getTime();
    return endOfDay;
  }

  /**
   * Returns rcDates that have at least one race whose end time (stTime + buffer) has passed and status is not COMPLETED.
   * Used to trigger result sync only when races have actually finished.
   */
  private async getRacesThatShouldHaveEnded(): Promise<string[]> {
    const today = todayKstYyyymmdd();
    const yesterday = yesterdayKstYyyymmdd();
    const now = Date.now();
    const bufferMin = KraService.RACE_END_BUFFER_MINUTES;

    const races = await this.raceRepo.find({
      where: [{ rcDate: today }, { rcDate: yesterday }],
      select: ['id', 'rcDate', 'stTime', 'status'],
    });
    const dates = new Set<string>();
    for (const r of races) {
      if (r.status === RaceStatus.COMPLETED) continue;
      const endMs = this.getRaceEndTimeMs(r.rcDate, r.stTime, bufferMin);
      if (endMs > 0 && endMs < now) dates.add(r.rcDate);
    }
    return Array.from(dates);
  }

  /**
   * Latest race end time (start + buffer) for the given rcDate. Used to schedule result fetch.
   * Returns end of rcDate day (23:59 KST) if no races or no stTime.
   */
  private async getLastRaceEndTimeForRcDate(rcDate: string): Promise<Date> {
    const norm = String(rcDate).replace(/-/g, '').slice(0, 8);
    if (norm.length < 8) {
      return new Date(
        `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T23:59:00+09:00`,
      );
    }
    const races = await this.raceRepo.find({
      where: { rcDate: norm },
      select: ['stTime'],
    });
    const bufferMin = KraService.RACE_END_BUFFER_MINUTES;
    let maxMs = new Date(
      `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T23:59:00+09:00`,
    ).getTime();
    for (const r of races) {
      const endMs = this.getRaceEndTimeMs(norm, r.stTime, bufferMin);
      if (endMs > 0 && endMs > maxMs) maxMs = endMs;
    }
    return new Date(maxMs);
  }

  /**
   * Enqueue KRA result fetch jobs for rcDate: one per race end time (stTime + buffer).
   * When each job runs, it fetches results for the whole rcDate so races are marked COMPLETED as soon as results are available.
   * Skips past times and dedupes by (jobType, targetRcDate, scheduledAt).
   */
  async scheduleResultFetchForRcDate(rcDate: string): Promise<void> {
    const norm = String(rcDate).replace(/-/g, '').slice(0, 8);
    if (norm.length < 8) return;
    const now = Date.now();
    const bufferMin = KraService.RACE_END_BUFFER_MINUTES;
    const races = await this.raceRepo.find({
      where: { rcDate: norm },
      select: ['id', 'stTime'],
    });
    const scheduledTimes = new Set<number>();
    for (const r of races) {
      const endMs = this.getRaceEndTimeMs(norm, r.stTime, bufferMin);
      if (endMs > 0 && endMs > now) scheduledTimes.add(endMs);
    }
    if (scheduledTimes.size === 0) return;
    const existing = await this.batchScheduleRepo
      .createQueryBuilder('b')
      .select('b.scheduledAt')
      .where('b.jobType = :jobType', { jobType: BATCH_JOB_KRA_RESULT_FETCH })
      .andWhere('b.targetRcDate = :targetRcDate', { targetRcDate: norm })
      .andWhere('b.status = :status', { status: BatchScheduleStatus.PENDING })
      .getRawMany<{ scheduledAt: Date }>();
    const existingMs = new Set(
      existing.map((r) => new Date(r.scheduledAt).getTime()),
    );
    let added = 0;
    for (const ms of scheduledTimes) {
      if (existingMs.has(ms)) continue;
      await this.batchScheduleRepo.save(
        this.batchScheduleRepo.create({
          jobType: BATCH_JOB_KRA_RESULT_FETCH,
          targetRcDate: norm,
          scheduledAt: new Date(ms),
          status: BatchScheduleStatus.PENDING,
        }),
      );
      existingMs.add(ms);
      added++;
    }
    if (added > 0) {
      this.logger.log(
        `[BatchSchedule] Enqueued ${added} KRA_RESULT_FETCH job(s) for ${norm} (per race end time)`,
      );
    }
  }

  /** List batch schedules (for Admin / KRA controller). */
  async getBatchSchedules(params?: {
    status?: string;
    limit?: number;
  }): Promise<{ items: BatchSchedule[]; byStatus: Record<string, number> }> {
    const take = Math.min(Number(params?.limit) || 50, 200);
    const qb = this.batchScheduleRepo
      .createQueryBuilder('b')
      .orderBy('b.scheduledAt', 'DESC')
      .addOrderBy('b.id', 'DESC')
      .take(take);
    if (params?.status != null && params.status !== '') {
      qb.andWhere('b.status = :status', { status: params.status });
    }
    const items = await qb.getMany();
    const byStatus = items.reduce<Record<string, number>>((acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    }, {});
    return { items, byStatus };
  }

  /** Process due batch jobs (scheduledAt <= now, status = PENDING). */
  async processDueBatchSchedules(): Promise<void> {
    const now = new Date();
    const due = await this.batchScheduleRepo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: BatchScheduleStatus.PENDING })
      .andWhere('b.scheduledAt <= :now', { now })
      .orderBy('b.scheduledAt', 'ASC')
      .take(20)
      .getMany();
    for (const job of due) {
      if (job.jobType !== BATCH_JOB_KRA_RESULT_FETCH) continue;
      const rcDate = job.targetRcDate;
      await this.batchScheduleRepo.update(job.id, {
        status: BatchScheduleStatus.RUNNING,
        startedAt: now,
        updatedAt: now,
      });
      try {
        await this.fetchRaceResults(rcDate, true);
        await this.syncAnalysisData(rcDate);
        await this.batchScheduleRepo.update(job.id, {
          status: BatchScheduleStatus.COMPLETED,
          completedAt: new Date(),
          errorMessage: null,
          updatedAt: new Date(),
        });
        this.logger.log(`[BatchSchedule] COMPLETED KRA_RESULT_FETCH ${rcDate}`);
        // Auto-generate predictions (fire-and-forget, don't block batch job)
        this.generatePredictionsForDate(rcDate).catch((e) =>
          this.logger.warn(
            `[BatchSchedule] prediction generation failed for ${rcDate}: ${e instanceof Error ? e.message : String(e)}`,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await this.batchScheduleRepo.update(job.id, {
          status: BatchScheduleStatus.FAILED,
          completedAt: new Date(),
          errorMessage: msg.slice(0, 1000),
          updatedAt: new Date(),
        });
        this.logger.warn(
          `[BatchSchedule] FAILED KRA_RESULT_FETCH ${rcDate}`,
          err,
        );
      }
    }
  }

  /**
   * Auto-create PENDING batch jobs for any races that have already ended (today/yesterday)
   * but have no associated PENDING, RUNNING, or COMPLETED batch job.
   * This makes the batch schedule system self-healing — no separate safety-net crons needed.
   */
  private async ensureResultFetchJobsForEndedRaces(): Promise<void> {
    const endedDates = await this.getRacesThatShouldHaveEnded();
    if (endedDates.length === 0) return;

    const now = new Date();
    for (const rcDate of endedDates) {
      const existing = await this.batchScheduleRepo.findOne({
        where: [
          {
            jobType: BATCH_JOB_KRA_RESULT_FETCH,
            targetRcDate: rcDate,
            status: BatchScheduleStatus.PENDING,
          },
          {
            jobType: BATCH_JOB_KRA_RESULT_FETCH,
            targetRcDate: rcDate,
            status: BatchScheduleStatus.RUNNING,
          },
          {
            jobType: BATCH_JOB_KRA_RESULT_FETCH,
            targetRcDate: rcDate,
            status: BatchScheduleStatus.COMPLETED,
          },
        ],
      });
      if (!existing) {
        this.logger.log(
          `[BatchSchedule] Auto-creating result fetch job for ended race date ${rcDate}`,
        );
        await this.batchScheduleRepo.save(
          this.batchScheduleRepo.create({
            jobType: BATCH_JOB_KRA_RESULT_FETCH,
            targetRcDate: rcDate,
            scheduledAt: now,
            status: BatchScheduleStatus.PENDING,
          }),
        );
      }
    }
  }

  /**
   * Process batch_schedules: run due jobs (scheduledAt <= now) every 5 min.
   * Jobs are enqueued when race plans are loaded (scheduleResultFetchForRcDate).
   * Also auto-creates jobs for any ended races that slipped through (self-healing).
   */
  @Cron('*/5 * * * *', { timeZone: 'Asia/Seoul' })
  async processDueBatchSchedulesCron() {
    if (!this.ensureServiceKey()) return;
    await this.ensureResultFetchJobsForEndedRaces();
    await this.processDueBatchSchedules();
  }

  /**
   * 3. Previous day results post-sync (daily 06:00 KST)
   * Only runs if yesterday was a race day (Fri/Sat/Sun).
   * Ensures results are cached in DB for immediate user access.
   */
  @Cron('0 6 * * *', { timeZone: 'Asia/Seoul' })
  async syncPreviousDayResults() {
    if (!this.ensureServiceKey()) return;
    const yesterdayStr = yesterdayKstYyyymmdd();
    const y = parseInt(yesterdayStr.slice(0, 4), 10);
    const m = parseInt(yesterdayStr.slice(4, 6), 10) - 1;
    const day = parseInt(yesterdayStr.slice(6, 8), 10);
    const weekday = new Date(y, m, day).getDay();
    if (weekday !== 0 && weekday !== 5 && weekday !== 6) return;
    this.logger.log(`Running Previous Day Result Sync: ${yesterdayStr}`);
    await this.fetchRaceResults(yesterdayStr, true);
  }

  /**
   * 4. Data consistency check (daily 05:30 KST)
   * Finds past races (in last 14 days) that have a race row but no result rows (orphaned),
   * and attempts to backfill their results from KRA API.
   * Does not filter by status so that SCHEDULED races that never received result sync are included.
   */
  @Cron('0 30 5 * * *', { timeZone: 'Asia/Seoul' })
  async syncOrphanedRaceResults() {
    if (!this.ensureServiceKey()) return;
    this.logger.log('Running orphaned race results check (last 14 days)');

    const today = kst();
    const twoWeeksAgo = today.subtract(14, 'day');
    const todayStr = this.formatYyyyMmDd(today);
    const fromStr = this.formatYyyyMmDd(twoWeeksAgo);

    const raceIdsWithResults = await this.resultRepo
      .createQueryBuilder('rr')
      .select('DISTINCT rr.raceId')
      .getRawMany<{ rr_raceId: number }>()
      .then((rows) => rows.map((r) => r.rr_raceId));
    const allInRange = await this.raceRepo
      .createQueryBuilder('r')
      .select(['r.id', 'r.rcDate', 'r.meet', 'r.rcNo'])
      .where('r.rcDate >= :from', { from: fromStr })
      .andWhere('r.rcDate < :to', { to: todayStr })
      .orderBy('r.rcDate', 'ASC')
      .getMany();
    const orphanedRaces = allInRange.filter(
      (r) => !raceIdsWithResults.includes(r.id),
    );

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
        await this.fetchRaceResults(String(date), true);
        await this.delay(500);
      } catch (err) {
        this.logger.warn(`[syncOrphanedRaceResults] Failed for ${date}`, err);
      }
    }
  }

  // --- Helper Methods ---

  /** Format as YYYYMMDD (KST date) */
  private formatYyyyMmDd(d: dayjs.Dayjs): string {
    return d.format('YYYYMMDD');
  }

  /** Normalize input to YYYYMMDD (supports YYYY-MM-DD and YYYYMMDD). Coerces to string. */
  private normalizeToYyyyMmDd(date: string): string {
    const s = String(date ?? '').trim();
    if (!s) return this.formatYyyyMmDd(kst());
    const d = s.includes('-') ? dayjs(s) : dayjs(s, 'YYYYMMDD', true);
    if (!d.isValid()) return this.formatYyyyMmDd(kst());
    return d.format('YYYYMMDD');
  }

  /**
   * Normalize KRA API response body.items to array.
   * Handles: body.items as array, body.items.item as array/single, body.items as single object.
   */
  private parseKraBodyItems(body: unknown): Record<string, unknown>[] {
    const items =
      body && typeof body === 'object' && 'items' in body
        ? (body as { items?: unknown }).items
        : undefined;
    if (!items) return [];
    if (Array.isArray(items)) return items as Record<string, unknown>[];
    if (typeof items === 'object' && items !== null && 'item' in items) {
      const raw = (items as { item?: unknown }).item;
      if (raw == null) return [];
      return Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : [raw as Record<string, unknown>];
    }
    // Single item object (e.g. one race with rcNo/rc_date)
    const obj = items as Record<string, unknown>;
    if (
      obj.rcNo != null ||
      obj.rc_no != null ||
      obj.rcDate != null ||
      obj.rc_date != null
    ) {
      return [obj];
    }
    return [];
  }

  private getTodayDateString(): string {
    return this.formatYyyyMmDd(kst());
  }

  private getUpcomingWeekendDates(): string[] {
    const today = kst();
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

  /** Throws so Admin/API callers get a clear error instead of "0건 적재" */
  private ensureServiceKeyOrThrow(): void {
    if (!this.ensureServiceKey()) {
      throw new BadRequestException(
        'KRA_SERVICE_KEY not configured. Set KRA_SERVICE_KEY in server .env (공공데이터포털 인코딩 키).',
      );
    }
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
      await this.kraSyncLogRepo.save(
        this.kraSyncLogRepo.create({
          endpoint,
          meet: opts.meet ?? null,
          rcDate: opts.rcDate ?? null,
          status: opts.status,
          recordCount: opts.recordCount ?? 0,
          errorMessage: opts.errorMessage ?? null,
          durationMs: opts.durationMs ?? null,
        }),
      );
    } catch {
      // Continue sync logic even if KraSyncLog fails
    }
  }

  // --- API Methods ---

  /**
   * Syncs Entry Sheet (Race Schedule + Entries) for a specific date.
   * Uses KRA API: /API26_2/entrySheet_2
   * Race + RaceEntry[] + RaceResult[] (+ Prediction) are one set; mapping must match fetchRaceResults.
   */
  async syncEntrySheet(date: string, opts?: KraSyncProgressOptions) {
    this.ensureServiceKeyOrThrow();
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

        if (typeof response.data === 'string' && response.data.includes('<')) {
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          body = result?.response?.body;
          items = this.parseKraBodyItems(body ?? {});
        } else if (response.data?.response?.body) {
          body = response.data.response.body as { totalCount?: number };
          items = this.parseKraBodyItems(body);
        }

        const resultCode = response.data?.response?.header?.resultCode;
        if (resultCode != null && String(resultCode) !== '00') {
          const msg = response.data?.response?.header?.resultMsg ?? 'API error';
          this.logger.warn(
            `[syncEntrySheet] ${meet.name} ${normalizedDate} resultCode=${resultCode} ${msg}`,
          );
          await this.logKraSync(endpoint, {
            meet: meet.code,
            rcDate: normalizedDate,
            status: 'FAILED',
            errorMessage: `resultCode=${resultCode} ${msg}`,
            durationMs: Date.now() - start,
          });
          continue;
        }

        // Collect all pages even if totalCount is missing: paginate until last page has fewer than numOfRows
        const numOfRows = 1000;
        const totalCount =
          body?.totalCount != null ? Number(body.totalCount) : null;
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
          const nextItems = this.parseKraBodyItems(nextBody ?? {});
          if (nextItems.length === 0) break;
          items.push(...nextItems);
          pageNo++;
          if (nextItems.length < numOfRows) break;
        }

        if (items.length === 0) {
          this.logger.warn(
            `No entries found for meet ${meet.name} on ${normalizedDate}`,
          );
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

    const rcCondition = vs('rcCondition') ?? vs('rc_condition');
    const now = new Date();
    await this.raceRepo.upsert(
      this.buildRaceUpsertPayload({
        meet: meetForRace,
        meetName: meetFromApi ?? meetName ?? null,
        rcDate: date,
        rcNo,
        rcName,
        rcDist: vs('rcDist') ?? vs('rc_dist') ?? null,
        rcDay: vs('rcDay') ?? vs('rc_day') ?? null,
        rank: vs('rank') ?? null,
        rcPrize: prize ?? null,
        stTime: stTime ?? null,
        rcCondition: rcCondition ?? null,
        createdAt: now,
        updatedAt: now,
      }),
      { conflictPaths: ['meet', 'rcDate', 'rcNo'] },
    );
    const raceRow = await this.raceRepo.findOne({
      where: { meet: meetForRace, rcDate: date, rcNo },
      select: ['id'],
    });
    if (!raceRow) {
      this.logger.warn(
        `[processEntrySheetItem] Race not found after upsert: ${meetForRace} ${date} R${rcNo}`,
      );
      return;
    }
    const race = { id: raceRow.id };

    const hrNo = vs('hrNo') || vs('hr_no') || '';
    const existingEntry = await this.entryRepo.findOne({
      where: { raceId: race.id, hrNo },
      select: ['id'],
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

    const ent = entryData;
    const chaksunTStr = ent.chaksunT != null ? String(ent.chaksunT) : null;
    if (existingEntry) {
      await this.entryRepo.update(existingEntry.id, {
        hrName: ent.hrName,
        hrNameEn: ent.hrNameEn ?? null,
        jkNo: ent.jkNo ?? null,
        jkName: ent.jkName,
        jkNameEn: ent.jkNameEn ?? null,
        trNo: ent.trNo ?? null,
        trName: ent.trName ?? null,
        owNo: ent.owNo ?? null,
        owName: ent.owName ?? null,
        wgBudam: ent.wgBudam ?? null,
        rating: ent.rating ?? null,
        // Preserve existing chulNo — only update if new value is non-null (avoid overwriting with null)
        ...(ent.chulNo != null ? { chulNo: ent.chulNo } : {}),
        dusu: ent.dusu ?? null,
        sex: ent.sex ?? null,
        age: ent.age ?? null,
        prd: ent.prd ?? null,
        chaksun1: ent.chaksun1 ?? null,
        chaksunT: chaksunTStr,
        rcCntT: ent.rcCntT ?? null,
        ord1CntT: ent.ord1CntT ?? null,
        budam: ent.budam ?? null,
      });
    } else {
      await this.entryRepo.save(
        this.entryRepo.create({
          raceId: ent.raceId,
          hrNo: ent.hrNo,
          hrName: ent.hrName,
          hrNameEn: ent.hrNameEn ?? null,
          jkNo: ent.jkNo ?? null,
          jkName: ent.jkName,
          jkNameEn: ent.jkNameEn ?? null,
          trNo: ent.trNo ?? null,
          trName: ent.trName ?? null,
          owNo: ent.owNo ?? null,
          owName: ent.owName ?? null,
          wgBudam: ent.wgBudam ?? null,
          rating: ent.rating ?? null,
          chulNo: ent.chulNo ?? null,
          dusu: ent.dusu ?? null,
          sex: ent.sex ?? null,
          age: ent.age ?? null,
          prd: ent.prd ?? null,
          chaksun1: ent.chaksun1 ?? null,
          chaksunT: chaksunTStr,
          rcCntT: ent.rcCntT ?? null,
          ord1CntT: ent.ord1CntT ?? null,
          budam: ent.budam ?? null,
        }),
      );
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
    this.ensureServiceKeyOrThrow();
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
    opts?: KraSyncProgressOptions & { generatePredictions?: boolean },
  ): Promise<{
    message: string;
    entrySheet?: { races: number; entries: number };
    results?: { totalResults: number };
    details?: string;
    jockeys?: string;
    predictions?: { generated: number; failed: number };
  }> {
    this.ensureServiceKeyOrThrow();
    const d = this.normalizeToYyyyMmDd(date);
    this.logger.log(`[syncAll] Starting full sync for ${d}`);

    const out: KraSyncAllOutput & {
      predictions?: { generated: number; failed: number };
    } = {
      message: '',
    };

    try {
      opts?.onProgress?.(5, '경주계획표 조회 중…');
      await this.fetchRacePlanSchedule(d);
      opts?.onProgress?.(20, '출전표 동기화 중…');
      const entryRes = await this.syncEntrySheet(d, opts);
      out.entrySheet = { races: entryRes.races, entries: entryRes.entries };
      await this.delay(300);

      // createRaceIfMissing: true — 결과 API에만 있는 경주도 Race 생성 후 결과·출전마 보강 기록
      opts?.onProgress?.(40, '경주 결과 수집 중…');
      const resultRes = await this.fetchRaceResults(d, true, opts);
      out.results = { totalResults: resultRes.totalResults ?? 0 };
      await this.delay(300);

      opts?.onProgress?.(50, '배당률 동기화 중…');
      try {
        await this.fetchDividends(d);
      } catch (err) {
        this.logger.warn(`[syncAll] fetchDividends failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      await this.delay(200);

      opts?.onProgress?.(60, '상세정보(훈련·장구) 동기화 중…');
      const detailRes = await this.syncAnalysisData(d);
      out.details = detailRes.message;

      opts?.onProgress?.(70, '기수 통산전적 동기화 중…');
      const jockeyRes = await this.fetchJockeyTotalResults();
      out.jockeys = jockeyRes.message;

      // Auto-generate AI predictions for races missing them
      if (opts?.generatePredictions !== false) {
        opts?.onProgress?.(80, 'AI 예측 생성 중…');
        out.predictions = await this.generatePredictionsForDate(d, opts);
      }

      opts?.onProgress?.(100, '완료');
      const predMsg = out.predictions
        ? `, ${out.predictions.generated} predictions`
        : '';
      out.message = `Full sync complete: ${out.entrySheet?.races ?? 0} races, ${out.entrySheet?.entries ?? 0} entries, ${out.results?.totalResults ?? 0} results${predMsg}`;
    } catch (err) {
      this.logger.error('[syncAll] Failed', err);
      throw err;
    }
    return out;
  }

  /**
   * Generate AI predictions for all races on a given date that don't have one yet.
   * Gracefully handles errors per-race so one failure doesn't stop the batch.
   */
  async generatePredictionsForDate(
    rcDate: string,
    opts?: KraSyncProgressOptions,
  ): Promise<{ generated: number; failed: number }> {
    const races = await this.raceRepo
      .createQueryBuilder('r')
      .select(['r.id', 'r.rcNo', 'r.meet'])
      .where('r.rcDate = :rcDate', { rcDate })
      .getMany();

    if (races.length === 0) return { generated: 0, failed: 0 };

    // Filter races that already have a completed prediction
    const raceIds = races.map((r) => r.id);
    const existing = await this.raceRepo.manager
      .createQueryBuilder()
      .select('p.raceId', 'raceId')
      .from('oddscast.predictions', 'p')
      .where('p.raceId IN (:...ids)', { ids: raceIds })
      .andWhere('p.status = :status', { status: 'COMPLETED' })
      .getRawMany<{ raceId: number }>();
    const existingIds = new Set(existing.map((e) => e.raceId));

    const toGenerate = races.filter((r) => !existingIds.has(r.id));
    if (toGenerate.length === 0) {
      this.logger.log(
        `[generatePredictionsForDate] All ${races.length} races already have predictions for ${rcDate}`,
      );
      return { generated: 0, failed: 0 };
    }

    this.logger.log(
      `[generatePredictionsForDate] Generating predictions for ${toGenerate.length}/${races.length} races on ${rcDate}`,
    );
    let generated = 0;
    let failed = 0;

    for (let i = 0; i < toGenerate.length; i++) {
      const race = toGenerate[i];
      const pct = 80 + Math.floor((i / toGenerate.length) * 18); // 80% → 98%
      opts?.onProgress?.(
        pct,
        `AI 예측 생성 중… ${race.meet} ${race.rcNo}R (${i + 1}/${toGenerate.length})`,
      );
      try {
        await this.predictionsService.generatePrediction(race.id);
        generated++;
        this.logger.log(
          `[generatePredictionsForDate] OK: ${race.meet} R${race.rcNo}`,
        );
      } catch (err) {
        failed++;
        this.logger.warn(
          `[generatePredictionsForDate] FAIL: ${race.meet} R${race.rcNo}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      // Delay between calls to avoid Gemini rate limits
      if (i < toGenerate.length - 1) await this.delay(2000);
    }

    return { generated, failed };
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
    this.ensureServiceKeyOrThrow();
    this.logger.log(
      `Starting historical backfill (race days only) from ${dateFrom} to ${dateTo}`,
    );
    const start = this.normalizeToYyyyMmDd(dateFrom);
    const end = this.normalizeToYyyyMmDd(dateTo);
    const dates = this.getRaceDateRange(start, end);
    const summary = {
      processed: 0,
      failed: [] as string[],
      totalResults: 0,
      totalRaces: 0,
    };
    const totalDates = dates.length;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const pct =
        totalDates > 0 ? Math.round(((i + 0.5) / totalDates) * 95) : 0;
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
      this.logger.warn(`Jockey sync after historical failed: ${e instanceof Error ? e.message : String(e)}`);
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

        const resBody = response.data?.response?.body;
        const resultCode = response.data?.response?.header?.resultCode;
        if (resultCode != null && String(resultCode) !== '00') {
          const msg = response.data?.response?.header?.resultMsg ?? 'API error';
          this.logger.warn(
            `[fetchRacePlanSchedule] ${meet.name} ${d} resultCode=${resultCode} ${msg}`,
          );
          await this.delay(200);
          continue;
        }

        const items = this.parseKraBodyItems(resBody ?? {});

        for (const item of items) {
          const v = (key: string): string | null => {
            const x =
              item[key] ??
              (item as Record<string, unknown>)[
                key.replace(/([A-Z])/g, '_$1').toLowerCase()
              ];
            return x != null ? String(x) : null;
          };
          const rcNo = v('rcNo') || v('rc_no') || '';
          if (!rcNo) continue;

          const meetName = meet.name;
          const rcName =
            (v('rcName') ?? v('rc_name') ?? '').trim() || `경주 ${rcNo}R`;
          const rcDist = v('rcDist') ?? v('rc_dist');
          const rcDay = v('rcDay') ?? v('rc_day');
          const rank = v('rank') ?? v('rcGrade') ?? v('rc_grade');
          const prizeRaw =
            v('rcPrize') ??
            v('rc_prize') ??
            v('chaksun1') ??
            v('chaksun_1') ??
            '0';
          const prize =
            parseInt(String(prizeRaw).replace(/,/g, ''), 10) || undefined;
          const stTime =
            v('rcStartTime') ??
            v('rc_start_time') ??
            v('stTime') ??
            v('st_time');
          const rcCondition = v('rcCondition') ?? v('rc_condition');
          const weather = v('weather');
          const track = v('track');

          const nowRace = new Date();
          await this.raceRepo.upsert(
            this.buildRaceUpsertPayload({
              meet: meetName,
              meetName,
              rcDate: d,
              rcNo,
              rcName,
              rcDist: rcDist ?? null,
              rcDay: rcDay ?? null,
              rank: rank ?? null,
              rcPrize: prize ?? null,
              stTime: stTime ?? null,
              rcCondition: rcCondition ?? null,
              weather: weather ?? null,
              track: track ?? null,
              createdAt: nowRace,
              updatedAt: nowRace,
            }),
            { conflictPaths: ['meet', 'rcDate', 'rcNo'] },
          );
          totalRaces++;
        }

        await this.delay(200);
      } catch (err) {
        this.logger.warn(
          `[fetchRacePlanSchedule] ${meet.name} ${d} failed`,
          err,
        );
      }
    }

    if (totalRaces > 0) {
      await this.scheduleResultFetchForRcDate(d);
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
    const seenDates = new Set<string>();

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

        const body = response.data?.response?.body;
        const resultCode = response.data?.response?.header?.resultCode;
        if (resultCode != null && String(resultCode) !== '00') {
          const msg = response.data?.response?.header?.resultMsg ?? 'API error';
          this.logger.warn(
            `[fetchRacePlanScheduleByYearMonth] ${rcYear}-${String(month).padStart(2, '0')} page ${pageNo} resultCode=${resultCode} ${msg}`,
          );
          break;
        }

        const items = this.parseKraBodyItems(body ?? {});

        for (const item of items) {
          const v = (key: string): string | null => {
            const x =
              item[key] ??
              (item as Record<string, unknown>)[
                key.replace(/([A-Z])/g, '_$1').toLowerCase()
              ];
            return x != null ? String(x) : null;
          };
          const rcNo = v('rcNo') || v('rc_no') || '';
          const rcDateRaw = v('rcDate') ?? v('rc_date');
          if (!rcNo || !rcDateRaw) continue;

          const rcDate = this.normalizeToYyyyMmDd(rcDateRaw);
          const meetRaw = v('meet') ?? '';
          const meetName = toKraMeetName(meetRaw) || '서울';

          const rcName =
            (v('rcName') ?? v('rc_name') ?? '').trim() || `경주 ${rcNo}R`;
          const rcDist = v('rcDist') ?? v('rc_dist');
          const rcDay = v('rcDay') ?? v('rc_day');
          const rank = v('rank') ?? v('rcGrade') ?? v('rc_grade');
          const prizeRaw =
            v('rcPrize') ??
            v('rc_prize') ??
            v('chaksun1') ??
            v('chaksun_1') ??
            '0';
          const prize =
            parseInt(String(prizeRaw).replace(/,/g, ''), 10) || undefined;
          const stTime =
            v('rcStartTime') ??
            v('rc_start_time') ??
            v('stTime') ??
            v('st_time');
          const rcCondition = v('rcCondition') ?? v('rc_condition');
          const weather = v('weather');
          const track = v('track');

          const nowRace = new Date();
          await this.raceRepo.upsert(
            this.buildRaceUpsertPayload({
              meet: meetName,
              meetName,
              rcDate,
              rcNo,
              rcName,
              rcDist: rcDist ?? null,
              rcDay: rcDay ?? null,
              rank: rank ?? null,
              rcPrize: prize ?? null,
              stTime: stTime ?? null,
              rcCondition: rcCondition ?? null,
              weather: weather ?? null,
              track: track ?? null,
              createdAt: nowRace,
              updatedAt: nowRace,
            }),
            { conflictPaths: ['meet', 'rcDate', 'rcNo'] },
          );
          totalRaces++;
          seenDates.add(rcDate);
        }

        const totalCount =
          body != null && typeof body === 'object' && 'totalCount' in body
            ? Number(String((body as { totalCount?: unknown }).totalCount))
            : 0;
        if (
          items.length < numOfRows ||
          (totalCount > 0 && totalRaces >= totalCount)
        ) {
          break;
        }
        pageNo++;
        await this.delay(200);
      } catch (err) {
        this.logger.warn(
          `[fetchRacePlanScheduleByYearMonth] ${rcYear}-${String(month).padStart(2, '0')} page ${pageNo} failed`,
          err,
        );
        break;
      }
    }

    // Schedule result fetch jobs for future race dates discovered in this sync.
    const nowMs = Date.now();
    for (const rcDate of seenDates) {
      const dateMs = new Date(
        `${rcDate.slice(0, 4)}-${rcDate.slice(4, 6)}-${rcDate.slice(6, 8)}T23:59:00+09:00`,
      ).getTime();
      if (dateMs > nowMs) {
        await this.scheduleResultFetchForRcDate(rcDate);
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
    this.ensureServiceKeyOrThrow();
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
    this.ensureServiceKeyOrThrow();
    const today = this.formatYyyyMmDd(kst());
    const threeMonthsLater = this.formatYyyyMmDd(kst().add(3, 'month'));
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

  /**
   * Fetches race results (API4_3), upserts Race, ensures RaceEntry per horse, saves RaceResult.
   * Race + RaceEntry[] + RaceResult[] (+ Prediction) are one set; Race/Entry mapping matches syncEntrySheet.
   */
  async fetchRaceResults(
    date: string,
    createRaceIfMissing = false,
    opts?: KraSyncProgressOptions,
  ): Promise<{ message: string; totalResults?: number }> {
    this.ensureServiceKeyOrThrow();
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
        // KRA official: API4_3/raceResult_3 (docs/specs/KRA_RACE_RESULT_SPEC.md)
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
        let result: {
          response?: { header?: { resultCode?: string }; body?: unknown };
        } = {};
        if (typeof response.data === 'object' && response.data?.response) {
          result = response.data as typeof result;
        } else if (
          typeof response.data === 'string' &&
          response.data.includes('<')
        ) {
          const parser = new xml2js.Parser({ explicitArray: false });
          result = await parser.parseStringPromise(response.data);
        }

        const resultCode = result?.response?.header?.resultCode;
        if (resultCode != null && String(resultCode) !== '00') {
          const msg =
            (result?.response?.header as { resultMsg?: string })?.resultMsg ??
            'API error';
          this.logger.warn(
            `[fetchRaceResults] ${meet.name} ${normalizedDate} resultCode=${resultCode} ${msg}`,
          );
          await this.logKraSync(endpoint, {
            meet: meet.code,
            rcDate: normalizedDate,
            status: 'FAILED',
            errorMessage: `resultCode=${resultCode} ${msg}`,
            durationMs: Date.now() - start,
          });
          continue;
        }

        const body = result?.response?.body;
        let items: KraApiItem[] = this.parseKraBodyItems(
          body ?? {},
        ) as KraApiItem[];

        // Pagination: fetch additional pages when totalCount is exceeded
        const totalCount =
          body != null && typeof body === 'object' && 'totalCount' in body
            ? Number((body as { totalCount?: number }).totalCount)
            : items.length;
        if (totalCount > items.length && totalCount > 0) {
          const allItems: KraApiItem[] = [...items];
          for (let pageNo = 2; allItems.length < totalCount; pageNo++) {
            const nextRes = await firstValueFrom(
              this.httpService.get(url, {
                params: { ...params, pageNo, numOfRows: 300 },
              }),
            );
            const nextBody = (
              nextRes?.data as { response?: { body?: unknown } }
            )?.response?.body;
            const nextItems = this.parseKraBodyItems(
              nextBody ?? {},
            ) as KraApiItem[];
            if (nextItems.length === 0) break;
            allItems.push(...nextItems);
            if (nextItems.length < 300) break;
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
          let race = await this.findRaceByMeetDateNo(
            meet.name,
            normalizedDate,
            rcNo,
          );

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
            const nowRace = new Date();
            const rcConditionVal =
              item.rcCondition != null
                ? String(item.rcCondition)
                : (item as Record<string, unknown>).rc_condition != null
                  ? String((item as Record<string, unknown>).rc_condition)
                  : null;
            await this.raceRepo.upsert(
              this.buildRaceUpsertPayload({
                meet: meetName,
                meetName,
                rcDate: normalizedDate,
                rcNo,
                rcName: rcNameToSave,
                rcDist: rcDistVal != null ? String(rcDistVal) : null,
                rcDay: rcDayVal != null ? String(rcDayVal) : null,
                rank: rankVal != null ? String(rankVal) : null,
                rcCondition: rcConditionVal,
                weather: weatherVal != null ? String(weatherVal) : null,
                track: trackVal != null ? String(trackVal) : null,
                status: RaceStatus.SCHEDULED,
                createdAt: nowRace,
                updatedAt: nowRace,
              }),
              { conflictPaths: ['meet', 'rcDate', 'rcNo'] },
            );
            race = await this.findRaceByMeetDateNo(
              meetName,
              normalizedDate,
              rcNo,
            );
          } else if (race) {
            const rcConditionVal =
              item.rcCondition != null
                ? String(item.rcCondition)
                : (item as Record<string, unknown>).rc_condition != null
                  ? String((item as Record<string, unknown>).rc_condition)
                  : undefined;
            await this.raceRepo.update(race.id, {
              rcName: rcNameToSave,
              ...(rcDistVal != null && { rcDist: String(rcDistVal) }),
              ...(rcDayVal != null && { rcDay: String(rcDayVal) }),
              ...(rankVal != null && { rank: String(rankVal) }),
              ...(rcConditionVal != null && { rcCondition: rcConditionVal }),
              ...(weatherVal != null && { weather: String(weatherVal) }),
              ...(trackVal != null && { track: String(trackVal) }),
              updatedAt: new Date(),
            });
          }

          if (!race) continue;

          const hrNoStr =
            item.hrNo != null
              ? String(item.hrNo)
              : item.hr_no != null
                ? String(item.hr_no)
                : '';

          const sv = (val: unknown) => (val != null ? String(val) : undefined);
          const wgBudam =
            item.wgBudam != null
              ? parseFloat(String(item.wgBudam))
              : item.wg_budam != null
                ? parseFloat(String(item.wg_budam))
                : null;
          const ageVal =
            item.age != null ? parseInt(String(item.age), 10) : null;
          const chaksun1Val =
            item.chaksun1 != null || item.rcPrize != null
              ? parseInt(String(item.chaksun1 ?? item.rcPrize ?? 0), 10)
              : null;
          const chaksunTRaw =
            item.chaksunT ?? (item as Record<string, unknown>).chaksun_t;
          const chaksunTStr =
            chaksunTRaw != null ? String(chaksunTRaw).replace(/,/g, '') : null;
          const rcCntTVal =
            item.rcCntT != null ||
            (item as Record<string, unknown>).rc_cnt_t != null
              ? parseInt(
                  String(
                    item.rcCntT ??
                      (item as Record<string, unknown>).rc_cnt_t ??
                      0,
                  ),
                  10,
                )
              : null;
          const ord1CntTVal =
            item.ord1CntT != null ||
            (item as Record<string, unknown>).ord1_cnt_t != null
              ? parseInt(
                  String(
                    item.ord1CntT ??
                      (item as Record<string, unknown>).ord1_cnt_t ??
                      0,
                  ),
                  10,
                )
              : null;

          if (hrNoStr) {
            const existingEntry = await this.entryRepo.findOne({
              where: { raceId: race.id, hrNo: hrNoStr },
              select: ['id'],
            });
            const entryPayload = {
              hrName: sv(item.hrName ?? item.hr_name) ?? '',
              hrNameEn:
                sv(
                  item.hrNameEn ?? (item as Record<string, unknown>).hr_name_en,
                ) ?? null,
              jkNo: sv(item.jkNo ?? item.jk_no) ?? null,
              jkName: sv(item.jkName ?? item.jk_name) ?? '',
              jkNameEn:
                sv(
                  item.jkNameEn ?? (item as Record<string, unknown>).jk_name_en,
                ) ?? null,
              trNo:
                sv(item.trNo ?? (item as Record<string, unknown>).tr_no) ??
                null,
              trName: sv(item.trName ?? item.tr_name) ?? null,
              owNo:
                sv(item.owNo ?? (item as Record<string, unknown>).ow_no) ??
                null,
              owName: sv(item.owName ?? item.ow_name) ?? null,
              wgBudam,
              // Preserve existing chulNo — result API includes chulNo, but only update if non-null
              ...(sv(item.chulNo ?? item.chul_no) != null ? { chulNo: sv(item.chulNo ?? item.chul_no) } : {}),
              age: ageVal,
              sex: sv(item.sex) ?? null,
              prd: sv(item.prd) ?? null,
              chaksun1: chaksun1Val,
              chaksunT: chaksunTStr,
              rcCntT: rcCntTVal,
              ord1CntT: ord1CntTVal,
              budam: sv(item.budam) ?? null,
            };
            if (!existingEntry) {
              await this.entryRepo.save(
                this.entryRepo.create({
                  raceId: race.id,
                  hrNo: hrNoStr,
                  ...entryPayload,
                }),
              );
              await this.cache.del(`race:${race.id}`);
            } else {
              await this.entryRepo.update(existingEntry.id, entryPayload);
              await this.cache.del(`race:${race.id}`);
            }
          }

          const existingResult = await this.resultRepo.findOne({
            where: { raceId: race.id, hrNo: hrNoStr },
            select: ['id'],
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

          const data = resultData;
          const sectional = (data as Record<string, unknown>).sectionalTimes as
            | Record<string, unknown>
            | null
            | undefined;
          const resultPayload = {
            ord: (data.ord ?? null) as string | null,
            ordInt: (data.ordInt ?? null) as number | null,
            ordType: (data.ordType ?? null) as string | null,
            rcTime: (data.rcTime ?? null) as string | null,
            chulNo: (data.chulNo ?? null) as string | null,
            age: (data.age ?? null) as string | null,
            sex: (data.sex ?? null) as string | null,
            jkNo: (data.jkNo ?? null) as string | null,
            jkName: (data.jkName ?? null) as string | null,
            trName: (data.trName ?? null) as string | null,
            owName: (data.owName ?? null) as string | null,
            wgBudam: (data.wgBudam ?? null) as number | null,
            wgHr: (data.wgHr ?? null) as string | null,
            hrTool: (data.hrTool ?? null) as string | null,
            diffUnit: (data.diffUnit ?? null) as string | null,
            winOdds: (data.winOdds ?? null) as number | null,
            plcOdds: (data.plcOdds ?? null) as number | null,
            track: (data.track ?? null) as string | null,
            weather: (data.weather ?? null) as string | null,
            chaksun1: (data.chaksun1 ?? null) as number | null,
            sectionalTimes: (sectional ?? null) as Record<
              string,
              unknown
            > | null,
          };
          if (existingResult) {
            await this.resultRepo.update(
              existingResult.id,
              resultPayload as Parameters<Repository<RaceResult>['update']>[1],
            );
          } else {
            await this.resultRepo.save(
              this.resultRepo.create({
                raceId: data.raceId as number,
                hrNo: data.hrNo as string,
                hrName: data.hrName as string,
                ...resultPayload,
              }),
            );
          }

          // Only mark race COMPLETED when we have actual finish data (ord = position or fall/dq/withdrawn)
          if (ordIntVal != null || ordTypeVal != null) {
            racesToUpdate.add(race.id);
          }
          totalResults++;
        }

        for (const raceId of racesToUpdate) {
          await this.raceRepo.update(raceId, {
            status: RaceStatus.COMPLETED,
            updatedAt: new Date(),
          });
          await this.cache.del(`race:${raceId}`);
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

    // COMPLETED is set only when result rows are saved (above). Do not mark by date alone.

    return {
      message: `Synced ${totalResults} results for ${date}`,
      totalResults,
    };
  }

  /**
   * Fetches confirmed payout dividends for all 7 승식 pool types (WIN, PLC, QNL, EXA, QPL, TLA, TRI).
   * Endpoint: KRA API160/integratedInfo
   * Called after fetchRaceResults — upserts into race_dividends table.
   */
  async fetchDividends(date: string): Promise<{ message: string; total: number }> {
    this.ensureServiceKeyOrThrow();
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const baseUrl = await this.resolveBaseUrl();
    const url = `${baseUrl}/API160/integratedInfo`;

    /** KRA Korean pool name → our pool code */
    const POOL_NAME_TO_CODE: Record<string, string> = {
      단승식: 'WIN',
      연승식: 'PLC',
      복승식: 'QNL',
      쌍승식: 'EXA',
      복연승식: 'QPL',
      삼복승식: 'TLA',
      삼쌍승식: 'TRI',
    };

    let total = 0;

    for (const meet of KRA_MEETS) {
      try {
        const params = {
          serviceKey: decodeURIComponent(this.serviceKey),
          meet: meet.code,
          rc_date: normalizedDate,
          numOfRows: 1000,
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

        for (const item of items) {
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          const poolNameRaw = String(item.pool ?? '').trim();
          const poolCode = POOL_NAME_TO_CODE[poolNameRaw] ?? poolNameRaw;
          const oddsVal = parseFloat(String(item.odds ?? '0'));
          const chulNo = String(item.chulNo ?? item.chul_no ?? '').trim();
          const chulNo2 = String(item.chulNo2 ?? item.chul_no2 ?? '0').trim();
          const chulNo3 = String(item.chulNo3 ?? item.chul_no3 ?? '0').trim();

          if (!rcNo || !chulNo || !poolCode || Number.isNaN(oddsVal) || oddsVal <= 0) continue;

          // Normalize "0" → empty string for unused horse slots
          const cn2 = chulNo2 === '0' ? '' : chulNo2;
          const cn3 = chulNo3 === '0' ? '' : chulNo3;

          const race = await this.findRaceByMeetDateNo(meet.name, normalizedDate, rcNo);
          if (!race) continue;

          const existing = await this.dividendRepo.findOne({
            where: { raceId: race.id, pool: poolCode, chulNo, chulNo2: cn2, chulNo3: cn3 },
            select: ['id'],
          });

          if (existing) {
            await this.dividendRepo.update(existing.id, { odds: oddsVal, poolName: poolNameRaw });
          } else {
            await this.dividendRepo.save(
              this.dividendRepo.create({
                raceId: race.id,
                pool: poolCode,
                poolName: poolNameRaw,
                chulNo,
                chulNo2: cn2,
                chulNo3: cn3,
                odds: oddsVal,
              }),
            );
          }
          total++;
        }

        this.logger.log(
          `[fetchDividends] ${meet.name} ${normalizedDate}: ${items.length} records processed`,
        );
      } catch (err) {
        this.logger.warn(
          `[fetchDividends] ${meet.name} ${normalizedDate} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { message: `Synced ${total} dividend records for ${normalizedDate}`, total };
  }

  /**
   * Fetches entry sheet (KRA_ENTRY_SHEET_SPEC)
   * Endpoint: /API26_2/entrySheet_2
   * Queries all by meet·date then filters by rcNo
   */
  async fetchRaceEntries(meet: string, date: string, raceNo: string) {
    if (!this.ensureServiceKey())
      return { message: 'KRA_SERVICE_KEY not configured' };

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

      const race = await this.findRaceByMeetDateNo(
        meet,
        normalizedDate,
        raceNo,
      );
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

        const existingEntry = await this.entryRepo.findOne({
          where: { raceId: race.id, hrNo },
          select: ['id'],
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
          wgBudam: wgBudam != null ? parseFloat(String(wgBudam)) : null,
        };

        if (existingEntry) {
          await this.entryRepo.update(existingEntry.id, {
            hrName: entryData.hrName,
            hrNameEn: entryData.hrNameEn ?? null,
            jkNo: entryData.jkNo ?? null,
            jkName: entryData.jkName,
            jkNameEn: entryData.jkNameEn ?? null,
            trNo: entryData.trNo ?? null,
            trName: entryData.trName ?? null,
            owNo: entryData.owNo ?? null,
            owName: entryData.owName ?? null,
            wgBudam: entryData.wgBudam,
          });
        } else {
          await this.entryRepo.save(
            this.entryRepo.create({
              raceId: entryData.raceId,
              hrNo: entryData.hrNo,
              hrName: entryData.hrName,
              hrNameEn: entryData.hrNameEn ?? null,
              jkNo: entryData.jkNo ?? null,
              jkName: entryData.jkName,
              jkNameEn: entryData.jkNameEn ?? null,
              trNo: entryData.trNo ?? null,
              trName: entryData.trName ?? null,
              owNo: entryData.owNo ?? null,
              owName: entryData.owName ?? null,
              wgBudam: entryData.wgBudam,
            }),
          );
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
    if (!this.ensureServiceKey())
      return { message: 'KRA_SERVICE_KEY not configured' };

    const baseUrl = await this.resolveBaseUrl();
    const raceRow = await this.findRaceByMeetDateNo(meet, date, raceNo);
    if (!raceRow) return { message: 'No entries' };

    const entries = await this.entryRepo.find({
      where: { raceId: raceRow.id },
      select: ['id', 'hrNo'],
    });
    if (entries.length === 0) return { message: 'No entries' };

    const meetCode = this.meetNameToCode(meet);

    for (const entry of entries) {
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

        const chaksunTStr = prizeT != null ? String(prizeT) : null;
        await this.entryRepo.update(entry.id, {
          rating: rating ?? null,
          rcCntT: rcCntT ?? null,
          ord1CntT: ord1CntT ?? null,
          chaksunT: chaksunTStr,
          sex: vs('sex') ?? null,
          age: vi('age') ?? null,
          prd: vs('prd') ?? vs('name') ?? null,
        });

        await this.delay(150);
      } catch (e) {
        this.logger.warn(`Horse details fetch failed for ${entry.hrNo}: ${e instanceof Error ? e.message : String(e)}`);
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
    if (!this.ensureServiceKey())
      return { message: 'KRA_SERVICE_KEY not configured' };

    const baseUrl = await this.resolveBaseUrl();
    const raceRow = await this.findRaceByMeetDateNo(meet, date, raceNo);
    if (!raceRow) return { message: 'No entries' };

    const entries = await this.entryRepo.find({
      where: { raceId: raceRow.id },
      select: ['id', 'hrNo'],
    });
    if (entries.length === 0) return { message: 'No entries' };

    const trDateTo = this.normalizeToYyyyMmDd(date);
    const trDateFrom = dayjs(date, 'YYYYMMDD')
      .subtract(14, 'day')
      .format('YYYYMMDD');

    for (const entry of entries) {
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

        await this.trainingRepo.delete({ raceEntryId: entry.id });

        const trainingSummaries: string[] = [];
        const nowTr = new Date();
        for (const item of items) {
          const trDate = String(item.trDate ?? item.tr_date ?? '');
          const trTime = String(item.trTime ?? item.tr_time ?? '');
          const trType = String(item.trType ?? item.tr_type ?? '');
          const trContent = String(item.trContent ?? item.tr_content ?? '');
          const place = String(item.place ?? '');
          const intensity = trType || trContent || '';
          const trEndTime =
            String(item.trEndTime ?? item.tr_end_time ?? '') || null;
          const trDuration =
            String(item.trDuration ?? item.tr_duration ?? '') || null;
          const managerType =
            String(item.managerType ?? item.manager_type ?? '') || null;
          const managerName =
            String(item.managerName ?? item.manager_name ?? '') || null;
          const weather = String(item.weather ?? '') || null;
          const trackCondition =
            String(item.trackCondition ?? item.track_condition ?? '') || null;

          await this.trainingRepo.save(
            this.trainingRepo.create({
              raceEntryId: entry.id,
              horseNo: entry.hrNo ?? '',
              trDate,
              trTime: trTime || null,
              trEndTime,
              trDuration,
              trContent: trContent || null,
              trType: trType || null,
              managerType,
              managerName,
              place: place || null,
              weather,
              trackCondition,
              intensity: intensity || null,
              createdAt: nowTr,
              updatedAt: nowTr,
            }),
          );
          trainingSummaries.push(`${trDate} ${trType || trContent}`);
        }

        if (trainingSummaries.length > 0) {
          const trainingData = {
            count: items.length,
            summary: trainingSummaries.slice(-7),
          };
          await this.entryRepo.update(entry.id, {
            trainingData,
          });
        }

        await this.delay(200);
      } catch (e) {
        this.logger.warn(`Training fetch failed for horse ${entry.hrNo}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { message: 'Fetched training data' };
  }

  // --- Group C: Jockey Data ---

  async fetchJockeyTotalResults(meet?: string) {
    this.ensureServiceKeyOrThrow();
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

          const nowJk = new Date();
          await this.jockeyResultRepo.upsert(
            {
              meet: m.code,
              jkNo,
              jkName,
              rcCntT,
              ord1CntT,
              ord2CntT,
              ord3CntT,
              winRateTsum,
              quRateTsum,
              chaksunT: String(chaksunT),
              updatedAt: nowJk,
            },
            { conflictPaths: ['meet', 'jkNo'] },
          );
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

            const nowTr = new Date();
            await this.trainerResultRepo.upsert(
              {
                meet: m.code,
                trNo,
                trName,
                rcCntT,
                ord1CntT,
                ord2CntT,
                ord3CntT,
                winRateTsum,
                quRateTsum,
                plRateTsum: plRateTsum ?? null,
                rcCntY: rcCntY ?? null,
                ord1CntY: ord1CntY ?? null,
                ord2CntY: ord2CntY ?? null,
                ord3CntY: ord3CntY ?? null,
                winRateY: winRateY ?? null,
                quRateY: quRateY ?? null,
                plRateY: plRateY ?? null,
                updatedAt: nowTr,
              },
              { conflictPaths: ['meet', 'trNo'] },
            );
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
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          const race = await this.raceRepo.findOne({
            where: { meet: meet.name, rcDate: date, rcNo },
            select: ['id', 'weather', 'track'],
          });
          if (race) {
            const weather = item.weather ?? race.weather;
            const track =
              (item.track ?? item.moisture)
                ? `${item.track ?? ''} (moisture ${item.moisture ?? '-'}%)`
                : race.track;
            await this.raceRepo.update(race.id, {
              weather,
              track,
              updatedAt: new Date(),
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

    const entries = await this.entryRepo
      .createQueryBuilder('re')
      .innerJoin('re.race', 'r')
      .select('re.id', 'id')
      .addSelect('re.hrNo', 'hrNo')
      .addSelect('r.meet', 'meet')
      .where('r.rcDate = :rcDate', { rcDate: normalizedDate })
      .getRawMany<{ id: number; hrNo: string; meet: string }>();
    if (entries.length === 0) return { updated: 0 };

    const needKeys = new Set(entries.map((e) => `${e.meet}:${e.hrNo}`));
    const entryByKey = new Map(entries.map((e) => [`${e.meet}:${e.hrNo}`, e]));

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

          const ratingVal = rating1 ?? null;
          const ratingHistoryForDb: Record<string, unknown> | null =
            ratingHistory.length > 0
              ? (ratingHistory as unknown as Record<string, unknown>)
              : null;
          await this.entryRepo.update(entry.id, {
            rating: ratingVal,
            ratingHistory: ratingHistoryForDb,
          } as Parameters<Repository<RaceEntry>['update']>[1]);
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
          typeof (error as { response?: { status?: number } }).response
            ?.status === 'number'
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

    const entries = await this.entryRepo
      .createQueryBuilder('re')
      .innerJoin('re.race', 'r')
      .select('re.id', 'id')
      .addSelect('re.hrNo', 'hrNo')
      .addSelect('r.meet', 'meet')
      .where('r.rcDate = :rcDate', { rcDate: normalizedDate })
      .getRawMany<{ id: number; hrNo: string; meet: string }>();
    if (entries.length === 0) return { updated: 0 };

    const needKeys = new Set(entries.map((e) => `${e.meet}:${e.hrNo}`));
    const entryByKey = new Map(entries.map((e) => [`${e.meet}:${e.hrNo}`, e]));
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
            const sectionalStats =
              Object.keys(stats).length > 0 ? JSON.stringify(stats) : null;

            if (sectionalStats) {
              const sectionalStatsObj = JSON.parse(sectionalStats) as Record<
                string,
                unknown
              >;
              await this.entryRepo.update(entry.id, {
                sectionalStats: sectionalStatsObj,
              } as Parameters<Repository<RaceEntry>['update']>[1]);
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
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          const hrNo = String(item.hrNo ?? item.hr_no ?? '');
          const raceRow = await this.findRaceByMeetDateNo(
            meet.name,
            date,
            rcNo,
          );
          if (!raceRow) continue;

          const entry = await this.entryRepo.findOne({
            where: { raceId: raceRow.id, hrNo },
            select: ['id'],
          });
          if (entry) {
            const raw = item.wgHr ?? item.wg_hr ?? null;
            const horseWeight =
              raw == null
                ? null
                : typeof raw === 'number'
                  ? String(raw)
                  : String(raw);
            await this.entryRepo.update(entry.id, { horseWeight });
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
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          const hrNo = String(item.hrNo ?? item.hr_no ?? '');
          const raceRow = await this.findRaceByMeetDateNo(
            meet.name,
            date,
            rcNo,
          );
          if (!raceRow) continue;

          const entry = await this.entryRepo.findOne({
            where: { raceId: raceRow.id, hrNo },
            select: ['id'],
          });
          if (entry) {
            const equipmentRaw =
              item.hrTool ?? item.equipment ?? item.equipChange ?? null;
            const equipment =
              equipmentRaw != null ? String(equipmentRaw) : null;
            const bleedingInfoObj =
              item.bleCnt != null ||
              item.bleDate != null ||
              item.medicalInfo != null
                ? ({
                    bleCnt: item.bleCnt,
                    bleDate: item.bleDate,
                    medicalInfo: item.medicalInfo,
                  } as Record<string, unknown>)
                : null;
            await this.entryRepo.update(entry.id, {
              equipment,
              bleedingInfo: bleedingInfoObj,
            } as Parameters<Repository<RaceEntry>['update']>[1]);
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
          const rcNo = String(item.rcNo ?? item.rc_no ?? '');
          const raceRow = await this.findRaceByMeetDateNo(
            meet.name,
            date,
            rcNo,
          );
          if (!raceRow) continue;

          const entry = await this.entryRepo.findOne({
            where: { raceId: raceRow.id, hrNo },
            select: ['id'],
          });
          if (entry) {
            await this.entryRepo.update(entry.id, { isScratched: true });
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
    this.ensureServiceKeyOrThrow();
    this.logger.log(
      `Syncing analysis data (Training, Equipment, etc.) for date: ${date}`,
    );
    const normalizedDate = this.normalizeToYyyyMmDd(date);
    const races = await this.raceRepo.find({
      where: { rcDate: normalizedDate },
      select: ['meet', 'rcDate', 'rcNo'],
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

    // 8. Jockey total results (jktresult) — auto-sync within analysis pipeline
    try {
      await this.fetchJockeyTotalResults();
    } catch (err) {
      this.logger.warn(
        `[syncAnalysisData] Jockey total results sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
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

        let raceRow = await this.findRaceByMeetDateNo(meet.name, rcDate, rcNo);
        if (!raceRow) {
          await this.raceRepo.upsert(
            {
              meet: meet.name,
              meetName: meet.name,
              rcDate,
              rcNo,
              rcDist,
              rcName,
              rank: '일반',
              rcPrize: 5000000,
            },
            { conflictPaths: ['meet', 'rcDate', 'rcNo'] },
          );
          raceRow = await this.findRaceByMeetDateNo(meet.name, rcDate, rcNo);
        }
        const raceId = raceRow!.id;
        raceCount++;

        const chaksunTStr = '50000000';
        for (const e of ENTRIES) {
          const existing = await this.entryRepo.findOne({
            where: { raceId, hrNo: e.hrNo },
            select: ['id'],
          });
          if (existing) {
            await this.entryRepo.update(existing.id, {
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
              chaksunT: chaksunTStr,
              rcCntT: 20,
              ord1CntT: 3,
            });
          } else {
            await this.entryRepo.save(
              this.entryRepo.create({
                raceId,
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
                chaksunT: chaksunTStr,
                rcCntT: 20,
                ord1CntT: 3,
              }),
            );
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
