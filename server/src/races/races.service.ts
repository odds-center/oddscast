import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PredictionStatus, RaceStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { RaceDividend } from '../database/entities/race-dividend.entity';
import { Prediction } from '../database/entities/prediction.entity';
import {
  CreateRaceDto,
  UpdateRaceDto,
  RaceFilterDto,
  CreateRaceEntryDto,
} from './dto/race.dto';
import { toKraMeetName } from '../kra/constants';
import {
  serializeRace,
  serializeRaces,
} from '../common/serializers/kra.serializer';
import { toKraMeetForDb } from '@oddscast/shared';
import { sortRacesByNumericRcNo } from '../common/utils/race-sort';
import { todayKstYyyymmdd, yesterdayKstYyyymmdd } from '../common/utils/kst';
import { KraService } from '../kra/kra.service';

type RaceRow = Record<string, unknown> & {
  id: number;
  rcDate: string;
  meet: string;
  rcNo: string;
  meetName?: string | null;
  status?: string | null;
  stTime?: string | null;
};
type EntryRow = Record<string, unknown> & { raceId: number };

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  /** Minutes after stTime to consider a race ended. */
  private static readonly RACE_END_BUFFER_MINUTES = 10;

  /**
   * Lock to prevent concurrent on-demand fetches for the same rcDate.
   * Stores timestamp (ms) of the last fetch attempt per rcDate.
   */
  private readonly onDemandFetchLock = new Map<string, number>();

  /** Minimum interval (ms) between on-demand fetch attempts for the same rcDate. */
  private static readonly ON_DEMAND_COOLDOWN_MS = 60_000;

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(RaceDividend)
    private readonly dividendRepo: Repository<RaceDividend>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly kraService: KraService,
  ) {}

  /**
   * Check if a race has ended based on rcDate + stTime + buffer.
   * Only considers today/yesterday races to avoid unnecessary API calls for old races.
   */
  private _isRaceEnded(race: RaceRow): boolean {
    const today = todayKstYyyymmdd();
    const yesterday = yesterdayKstYyyymmdd();
    if (race.rcDate !== today && race.rcDate !== yesterday) return false;
    if (!race.stTime) return false;

    const dateStr = race.rcDate;
    const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    const endMs =
      new Date(`${isoDate}T${race.stTime}:00+09:00`).getTime() +
      RacesService.RACE_END_BUFFER_MINUTES * 60_000;
    return Date.now() >= endMs;
  }

  /**
   * Whether a race is definitively in the past (date-based + time-based).
   * Used to guard status correction: don't mark COMPLETED if race hasn't started.
   */
  private _isRacePast(race: RaceRow): boolean {
    const today = todayKstYyyymmdd();
    // Past date = definitely over
    if (race.rcDate < today) return true;
    // Future date = definitely not over
    if (race.rcDate > today) return false;
    // Today: check stTime + buffer
    if (!race.stTime) return false;
    return this._isRaceEnded(race);
  }

  /**
   * Try to fetch results from KRA API on-demand for the given rcDate.
   * Uses a cooldown lock to prevent excessive API calls (max 1 per rcDate per minute).
   * Returns true if fetch was attempted, false if skipped due to cooldown.
   */
  private async _tryOnDemandResultFetch(rcDate: string): Promise<boolean> {
    const now = Date.now();
    const lastAttempt = this.onDemandFetchLock.get(rcDate) ?? 0;
    if (now - lastAttempt < RacesService.ON_DEMAND_COOLDOWN_MS) {
      return false;
    }
    this.onDemandFetchLock.set(rcDate, now);

    try {
      this.logger.log(`On-demand result fetch triggered for rcDate=${rcDate}`);
      await this.kraService.fetchRaceResults(rcDate, false);
      return true;
    } catch (err: unknown) {
      this.logger.warn(
        `On-demand result fetch failed for rcDate=${rcDate}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  async findAll(filters: RaceFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const { q, date, dateFrom, dateTo, meet, status } = filters;

    // Use DB-level numeric ordering for rcNo (avoids fetching 5000 rows for in-memory sort).
    // COALESCE(NULLIF(rcNo,'')::INTEGER, 0) safely converts '1'..'12' to integers.
    const qb = this.raceRepo
      .createQueryBuilder('r')
      .orderBy('r.rcDate', 'DESC')
      .addOrderBy('r.meet', 'ASC')
      .addOrderBy("COALESCE(NULLIF(r.rcNo, '')::INTEGER, 0)", 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (date) {
      const lower = String(date).toLowerCase();
      const dateNorm =
        lower === 'today'
          ? todayKstYyyymmdd()
          : lower === 'yesterday'
            ? yesterdayKstYyyymmdd()
            : date.replace(/-/g, '').slice(0, 8);
      qb.andWhere('r.rcDate = :date', { date: dateNorm });
    } else if (dateFrom && dateTo) {
      qb.andWhere('r.rcDate >= :from', {
        from: dateFrom.replace(/-/g, '').slice(0, 8),
      });
      qb.andWhere('r.rcDate <= :to', {
        to: dateTo.replace(/-/g, '').slice(0, 8),
      });
    }
    if (meet) {
      qb.andWhere('r.meet = :meet', { meet: toKraMeetName(meet) });
    }
    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      // Search race-level fields (rcName, meet, rcNo) as well as entries by horse/jockey name
      qb.andWhere(
        `(
          r.rcName ILIKE :term
          OR r.meet ILIKE :term
          OR r.rcNo ILIKE :term
          OR EXISTS (
            SELECT 1 FROM oddscast.race_entries re
            WHERE re."raceId" = r.id
              AND (re."hrName" ILIKE :term OR re."jkName" ILIKE :term)
          )
        )`,
        { term },
      );
    }

    const [races, total] = await qb.getManyAndCount();
    const raceIds = races.map((r) => r.id);
    const entriesByRace = await this._loadEntriesForRaces(raceIds);
    const raceIdsWithResults = await this._getRaceIdsWithResults(raceIds);
    const statusFixups: { id: number; status: RaceStatus }[] = [];
    const merged = races.map((r) => {
      const hasResults = raceIdsWithResults.has(r.id);
      let correctedStatus = r.status;
      // Only mark COMPLETED if results exist AND race time has actually passed
      if (
        hasResults &&
        r.status !== RaceStatus.COMPLETED &&
        this._isRacePast(r as unknown as RaceRow)
      ) {
        correctedStatus = RaceStatus.COMPLETED;
        statusFixups.push({ id: r.id, status: correctedStatus });
      } else if (!hasResults && r.status === RaceStatus.COMPLETED) {
        correctedStatus = RaceStatus.SCHEDULED;
        statusFixups.push({ id: r.id, status: correctedStatus });
      } else if (
        hasResults &&
        !this._isRacePast(r as unknown as RaceRow) &&
        r.status !== RaceStatus.SCHEDULED
      ) {
        // Results exist but race hasn't started yet — revert to SCHEDULED
        correctedStatus = RaceStatus.SCHEDULED;
        statusFixups.push({ id: r.id, status: correctedStatus });
      }
      return {
        ...r,
        status: correctedStatus,
        entries: entriesByRace.get(r.id) ?? [],
      };
    });

    // Persist status corrections to DB so they don't recur
    if (statusFixups.length > 0) {
      const now = new Date();
      await Promise.all(
        statusFixups.map(({ id, status }) =>
          this.raceRepo.update(id, { status, updatedAt: now }),
        ),
      );
    }

    return {
      races: serializeRaces(merged as RaceRow[]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async _loadEntriesForRaces(
    raceIds: number[],
  ): Promise<Map<number, EntryRow[]>> {
    if (raceIds.length === 0) return new Map();
    const entries = await this.entryRepo.find({
      where: { raceId: In(raceIds) },
      order: { raceId: 'ASC', id: 'ASC' },
    });
    const map = new Map<number, EntryRow[]>();
    for (const e of entries) {
      const id = e.raceId;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(e as unknown as EntryRow);
    }
    return map;
  }

  /** Race IDs that have at least one result row with actual finish data (ordInt or ordType). */
  private async _getRaceIdsWithResults(
    raceIds: number[],
  ): Promise<Set<number>> {
    if (raceIds.length === 0) return new Set();
    const rows = await this.resultRepo
      .createQueryBuilder('rr')
      .select('DISTINCT rr.raceId', 'raceId')
      .where('rr.raceId IN (:...ids)', { ids: raceIds })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .getRawMany<{ raceId: number }>();
    return new Set(rows.map((r) => r.raceId));
  }

  /**
   * Compute corrected status: COMPLETED only if results exist AND race is past.
   * Prevents showing results for races that haven't started yet.
   */
  private _correctStatus(race: RaceRow, hasResults: boolean): RaceStatus {
    const isPast = this._isRacePast(race);
    if (hasResults && isPast) return RaceStatus.COMPLETED;
    const s = race.status ?? RaceStatus.SCHEDULED;
    if (s === RaceStatus.COMPLETED && (!hasResults || !isPast))
      return RaceStatus.SCHEDULED;
    return s as RaceStatus;
  }

  /** True only when at least one result row has finish data (ordInt or ordType). */
  private _hasActualFinishData(results: unknown[] | undefined): boolean {
    if (!Array.isArray(results) || results.length === 0) return false;
    return results.some(
      (r) =>
        (r as { ordInt?: number | null; ordType?: string | null }).ordInt !=
          null ||
        (r as { ordInt?: number | null; ordType?: string | null }).ordType !=
          null,
    );
  }

  async findOne(id: number) {
    const cacheKey = `race:${id}`;
    const cached =
      await this.cache.get<Awaited<ReturnType<typeof this._findOneRaw>>>(
        cacheKey,
      );
    if (cached) {
      const hasEntries =
        ((cached as { entries?: unknown[] }).entries?.length ?? 0) > 0;
      if (!hasEntries) {
        const fresh = await this._findOneRaw(id);
        if (fresh && Array.isArray(fresh.entries) && fresh.entries.length > 0) {
          const hasResults = this._hasActualFinishData(fresh.results);
          const corrected = {
            ...fresh,
            status: this._correctStatus(
              fresh as unknown as RaceRow,
              hasResults,
            ),
          };
          const serialized = serializeRace(corrected);
          await this.cache.set(cacheKey, corrected, 60 * 5 * 1000);
          return serialized ?? corrected;
        }
      }
      const c = cached as { results?: unknown[]; status?: RaceStatus };
      const hasResults = this._hasActualFinishData(c.results);
      if (!hasResults && this._isRaceEnded(c as RaceRow)) {
        const fetched = await this._tryOnDemandResultFetch(
          (c as RaceRow).rcDate,
        );
        if (fetched) {
          const fresh = await this._findOneRaw(id);
          if (fresh) {
            const freshHasResults = this._hasActualFinishData(fresh.results);
            const corrected = {
              ...fresh,
              status: this._correctStatus(
                fresh as unknown as RaceRow,
                freshHasResults,
              ),
            };
            const serialized = serializeRace(corrected);
            await this.cache.set(cacheKey, corrected, 60 * 5 * 1000);
            return serialized ?? corrected;
          }
        }
      }
      const corrected = {
        ...cached,
        status: this._correctStatus(cached as unknown as RaceRow, hasResults),
      };
      return serializeRace(corrected) ?? corrected;
    }
    const race = await this._findOneRaw(id);
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');
    const hasResults = this._hasActualFinishData(race.results);

    // On-demand fetch: race ended but no results in DB
    if (!hasResults && this._isRaceEnded(race)) {
      const fetched = await this._tryOnDemandResultFetch(race.rcDate);
      if (fetched) {
        const fresh = await this._findOneRaw(id);
        if (fresh) {
          const freshHasResults = this._hasActualFinishData(fresh.results);
          const corrected = {
            ...fresh,
            status: this._correctStatus(
              fresh as unknown as RaceRow,
              freshHasResults,
            ),
          };
          const serialized = serializeRace(corrected);
          await this.cache.set(cacheKey, corrected, 60 * 5 * 1000);
          return serialized ?? corrected;
        }
      }
    }

    const corrected = {
      ...race,
      status: this._correctStatus(race as unknown as RaceRow, hasResults),
    };
    const serialized = serializeRace(corrected);
    await this.cache.set(cacheKey, corrected, 60 * 5 * 1000);
    return serialized ?? corrected;
  }

  private async _findOneRaw(
    id: number,
  ): Promise<(RaceRow & { entries: EntryRow[]; results?: unknown[] }) | null> {
    const race = await this.raceRepo.findOne({ where: { id } });
    if (!race) return null;
    const entries = await this.entryRepo.find({
      where: { raceId: id },
      order: { id: 'ASC' },
    });
    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .where('rr.raceId = :id', { id })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
    return {
      ...race,
      entries: entries as unknown as EntryRow[],
      results,
    };
  }

  async create(dto: CreateRaceDto) {
    const meet = toKraMeetForDb(dto.meet) ?? dto.meet;
    const now = new Date();
    const race = this.raceRepo.create({
      rcName: dto.rcName ?? null,
      meet,
      meetName: dto.meetName ?? null,
      rcDate: dto.rcDate,
      rcDay: dto.rcDay ?? null,
      rcNo: dto.rcNo,
      stTime: dto.stTime ?? null,
      rcDist: dto.rcDist ?? null,
      rank: dto.rank ?? null,
      rcCondition: dto.rcCondition ?? null,
      rcPrize: dto.rcPrize ?? null,
      weather: dto.weather ?? null,
      track: dto.track ?? null,
      status: (dto.status as RaceStatus) ?? RaceStatus.SCHEDULED,
      updatedAt: now,
    });
    const created = await this.raceRepo.save(race);
    return serializeRace({ ...created, entries: [] }) ?? created;
  }

  async update(id: number, dto: UpdateRaceDto) {
    const race = await this.raceRepo.findOne({ where: { id } });
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');

    const meet =
      dto.meet != null ? (toKraMeetForDb(dto.meet) ?? dto.meet) : undefined;
    if (dto.rcName !== undefined) race.rcName = dto.rcName;
    if (meet !== undefined) race.meet = meet;
    if (dto.meetName !== undefined) race.meetName = dto.meetName;
    if (dto.rcDate !== undefined) race.rcDate = dto.rcDate;
    if (dto.rcDay !== undefined) race.rcDay = dto.rcDay;
    if (dto.rcNo !== undefined) race.rcNo = dto.rcNo;
    if (dto.stTime !== undefined) race.stTime = dto.stTime;
    if (dto.rcDist !== undefined) race.rcDist = dto.rcDist;
    if (dto.rank !== undefined) race.rank = dto.rank;
    if (dto.rcCondition !== undefined) race.rcCondition = dto.rcCondition;
    if (dto.rcPrize !== undefined) race.rcPrize = dto.rcPrize;
    if (dto.weather !== undefined) race.weather = dto.weather;
    if (dto.track !== undefined) race.track = dto.track;
    if (dto.status !== undefined) race.status = dto.status as RaceStatus;

    await this.raceRepo.save(race);
    await this.cache.del(`race:${id}`);
    const entries = await this.entryRepo.find({
      where: { raceId: id },
      order: { id: 'ASC' },
    });
    return serializeRace({ ...race, entries }) ?? { ...race, entries };
  }

  async remove(id: number) {
    await this.raceRepo.delete(id);
    await this.cache.del(`race:${id}`);
    return { message: '경주가 삭제되었습니다' };
  }

  async getSchedule(filters: {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }) {
    const qb = this.raceRepo.createQueryBuilder('r').orderBy('r.rcDate', 'ASC');

    if (filters.dateFrom && filters.dateTo) {
      qb.andWhere('r.rcDate >= :from', {
        from: filters.dateFrom.replace(/-/g, '').slice(0, 8),
      });
      qb.andWhere('r.rcDate <= :to', {
        to: filters.dateTo.replace(/-/g, '').slice(0, 8),
      });
    }
    if (filters.meet) {
      qb.andWhere('r.meet = :meet', {
        meet: toKraMeetName(filters.meet),
      });
    }

    const allRaces = await qb.getMany();
    const raceIds = allRaces.map((r) => r.id);
    const entriesByRace = await this._loadEntriesForRaces(raceIds);
    const merged = allRaces.map((r) => ({
      ...r,
      entries: entriesByRace.get(r.id) ?? [],
    }));
    const sorted = sortRacesByNumericRcNo(merged, {
      getRcDate: (r) => (r as RaceRow).rcDate ?? '',
      getMeet: (r) => (r as RaceRow).meet ?? '',
      getRcNo: (r) => (r as RaceRow).rcNo ?? '',
      rcDateOrder: 'asc',
    });
    return serializeRaces(sorted as RaceRow[]);
  }

  async getScheduleDates(filters: {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }): Promise<
    { date: string; meetCounts: Record<string, number>; totalRaces: number }[]
  > {
    const qb = this.raceRepo
      .createQueryBuilder('r')
      .select('r.rcDate', 'rcDate')
      .addSelect('r.meet', 'meet')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.rcDate')
      .addGroupBy('r.meet')
      .orderBy('r.rcDate', 'ASC');

    if (filters.dateFrom && filters.dateTo) {
      qb.andWhere('r.rcDate >= :from', {
        from: filters.dateFrom.replace(/-/g, '').slice(0, 8),
      });
      qb.andWhere('r.rcDate <= :to', {
        to: filters.dateTo.replace(/-/g, '').slice(0, 8),
      });
    }
    if (filters.meet) {
      qb.andWhere('r.meet = :meet', {
        meet: toKraMeetName(filters.meet),
      });
    }

    const rows = await qb.getRawMany<{
      rcDate: string;
      meet: string;
      count: string;
    }>();
    const byDate = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const meetName =
        r.meet === '서울'
          ? '서울'
          : r.meet === '제주'
            ? '제주'
            : r.meet === '부산경남'
              ? '부산경남'
              : r.meet;
      if (!byDate.has(r.rcDate)) byDate.set(r.rcDate, {});
      const counts = byDate.get(r.rcDate)!;
      counts[meetName] = (counts[meetName] ?? 0) + parseInt(r.count, 10);
    }

    return Array.from(byDate.entries())
      .map(([date, meetCounts]) => ({
        date,
        meetCounts,
        totalRaces: Object.values(meetCounts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTodayRaces() {
    const today = todayKstYyyymmdd();
    return this.getRacesByDate(today);
  }

  async getRacesByDate(date: string) {
    const rcDate = date.replace(/-/g, '').slice(0, 8);
    const races = await this.raceRepo.find({
      where: { rcDate },
      order: { id: 'ASC' },
    });
    const raceIds = races.map((r) => r.id);
    const entriesByRace = await this._loadEntriesForRaces(raceIds);
    const raceIdsWithResults = await this._getRaceIdsWithResults(raceIds);
    const statusFixups2: { id: number; status: RaceStatus }[] = [];
    const merged = races.map((r) => {
      const hasResults = raceIdsWithResults.has(r.id);
      let correctedStatus = r.status;
      if (hasResults && r.status !== RaceStatus.COMPLETED) {
        correctedStatus = RaceStatus.COMPLETED;
        statusFixups2.push({ id: r.id, status: correctedStatus });
      } else if (!hasResults && r.status === RaceStatus.COMPLETED) {
        correctedStatus = RaceStatus.SCHEDULED;
        statusFixups2.push({ id: r.id, status: correctedStatus });
      }
      return {
        ...r,
        status: correctedStatus,
        entries: (entriesByRace.get(r.id) ?? []).filter(
          (e) => !(e as Record<string, unknown>).isScratched,
        ),
      };
    });

    // Persist status corrections to DB
    if (statusFixups2.length > 0) {
      const now = new Date();
      await Promise.all(
        statusFixups2.map(({ id, status }) =>
          this.raceRepo.update(id, { status, updatedAt: now }),
        ),
      );
    }
    const sorted = sortRacesByNumericRcNo(merged, {
      getRcDate: () => rcDate,
      getMeet: (r) => (r as RaceRow).meet ?? '',
      getRcNo: (r) => (r as RaceRow).rcNo ?? '',
      rcDateOrder: 'asc',
    });
    return serializeRaces(sorted as RaceRow[]);
  }

  async getRaceResult(raceId: number) {
    const race = await this.raceRepo.findOne({
      where: { id: raceId },
      select: ['status'],
    });
    if (!race) return [];
    // Return results only when race is COMPLETED (results synced from KRA). Do not use date/time.
    if (race.status !== 'COMPLETED') return [];

    // Only return rows with actual finish data (ordInt or ordType). Do not expose 출전마-only rows as results.
    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select([
        'rr.id',
        'rr.ord',
        'rr.ordType',
        'rr.chulNo',
        'rr.hrNo',
        'rr.hrName',
        'rr.jkNo',
        'rr.jkName',
        'rr.trName',
        'rr.wgBudam',
        'rr.wgHr',
        'rr.rcTime',
        'rr.diffUnit',
        'rr.winOdds',
        'rr.plcOdds',
      ])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
    return results;
  }

  async getDividends(raceId: number) {
    // Prefer confirmed dividends from race_dividends (all 7 pool types)
    const dividends = await this.dividendRepo.find({
      where: { raceId },
      order: { pool: 'ASC', chulNo: 'ASC', chulNo2: 'ASC', chulNo3: 'ASC' },
    });

    if (dividends.length > 0) {
      return dividends.map((d) => ({
        poolName: d.poolName,
        pool: d.pool,
        chulNo: d.chulNo,
        chulNo2: d.chulNo2 || undefined,
        chulNo3: d.chulNo3 || undefined,
        odds: d.odds,
      }));
    }

    // Fallback: derive 단승식 / 연승식 from per-horse race_results
    type ResultRow = {
      ord: string | null;
      ordInt: number | null;
      ordType: string | null;
      chulNo: string | null;
      hrNo: string | null;
      winOdds: number | null;
      plcOdds: number | null;
    };
    const results = (await this.resultRepo
      .createQueryBuilder('rr')
      .select([
        'rr.ord',
        'rr.ordInt',
        'rr.ordType',
        'rr.chulNo',
        'rr.hrNo',
        'rr.winOdds',
        'rr.plcOdds',
      ])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany()) as unknown as ResultRow[];
    const list: {
      poolName: string;
      pool?: string;
      chulNo?: string;
      chulNo2?: string;
      chulNo3?: string;
      odds?: number;
    }[] = [];
    const normal = results.filter((r) => {
      const type = r.ordType ?? '';
      const ordN = r.ordInt ?? (r.ord ? parseInt(String(r.ord), 10) : NaN);
      return type === 'NORMAL' || (!type && !Number.isNaN(ordN) && ordN < 90);
    });
    for (const r of normal) {
      const chulNo = r.chulNo ?? r.hrNo ?? '';
      if (chulNo && r.winOdds != null) {
        list.push({ poolName: '단승식', pool: 'WIN', chulNo, odds: r.winOdds });
      }
      if (chulNo && r.plcOdds != null) {
        list.push({ poolName: '연승식', pool: 'PLC', chulNo, odds: r.plcOdds });
      }
    }
    return list;
  }

  async createEntry(raceId: number, dto: CreateRaceEntryDto) {
    const entry = this.entryRepo.create({
      raceId,
      hrNo: dto.hrNo,
      hrName: dto.hrName ?? '',
      jkName: dto.jkName ?? '',
      trName: dto.trName ?? null,
      owNo: dto.owNo ?? null,
      owName: dto.owName ?? null,
      wgBudam: dto.wgBudam ?? null,
    });
    return this.entryRepo.save(entry);
  }

  async createBulkEntries(raceId: number, entries: CreateRaceEntryDto[]) {
    let count = 0;
    for (const e of entries) {
      const entry = this.entryRepo.create({
        raceId,
        hrNo: e.hrNo,
        hrName: e.hrName ?? '',
        jkName: e.jkName ?? '',
        trName: e.trName ?? null,
        owNo: e.owNo ?? null,
        owName: e.owName ?? null,
        wgBudam: e.wgBudam ?? null,
      });
      await this.entryRepo.save(entry);
      count++;
    }
    return { count };
  }

  async getAnalysis(raceId: number) {
    return this.predictionRepo.findOne({
      where: { raceId, status: PredictionStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatistics(filters: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }) {
    const baseQb = () => {
      const q = this.raceRepo.createQueryBuilder('r');
      if (filters.meet) {
        q.andWhere('r.meet = :meet', {
          meet: toKraMeetName(filters.meet),
        });
      }
      if (filters.date) {
        q.andWhere('r.rcDate = :date', {
          date: filters.date.replace(/-/g, '').slice(0, 8),
        });
      } else if (filters.year && filters.month) {
        const m = String(filters.month).padStart(2, '0');
        q.andWhere('r.rcDate >= :from', { from: `${filters.year}${m}01` });
        q.andWhere('r.rcDate <= :to', { to: `${filters.year}${m}31` });
      } else if (filters.year) {
        q.andWhere('r.rcDate >= :from', { from: `${filters.year}0101` });
        q.andWhere('r.rcDate <= :to', { to: `${filters.year}1231` });
      }
      return q;
    };

    const [total, byStatusRows] = await Promise.all([
      baseQb().getCount(),
      baseQb()
        .select('r.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('r.status')
        .getRawMany<{ status: string; count: string }>(),
    ]);

    const statusCounts: Record<string, number> = {
      SCHEDULED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const g of byStatusRows) {
      statusCounts[g.status] = parseInt(g.count, 10);
    }

    return {
      total,
      byStatus: statusCounts,
    };
  }
}
