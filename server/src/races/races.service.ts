import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import dayjs from 'dayjs';
import { PredictionStatus, RaceStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
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
  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry) private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult) private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(Prediction) private readonly predictionRepo: Repository<Prediction>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * True if race start (rcDate + stTime) is before now. stTime format: "14:00" or "1400".
   * If no stTime, uses date only (past when rcDate < today).
   */
  private isPastRaceDateTime(
    rcDate: string | null | undefined,
    stTime: string | null | undefined,
  ): boolean {
    if (!rcDate || typeof rcDate !== 'string') return false;
    const norm = rcDate.replace(/-/g, '').slice(0, 8);
    if (norm.length < 8) return false;
    const now = dayjs();
    if (stTime && typeof stTime === 'string') {
      const timeStr = stTime.trim().replace(':', '');
      const hour =
        timeStr.length >= 2
          ? parseInt(timeStr.slice(0, 2), 10)
          : parseInt(timeStr, 10);
      const minute =
        timeStr.length >= 4 ? parseInt(timeStr.slice(2, 4), 10) : 0;
      if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
        const raceStart = dayjs(norm, 'YYYYMMDD')
          .hour(hour)
          .minute(minute)
          .second(0)
          .millisecond(0);
        return raceStart.isBefore(now);
      }
    }
    return norm < now.format('YYYYMMDD');
  }

  async findAll(filters: RaceFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const { q, date, dateFrom, dateTo, meet, status } = filters;
    const maxFetch = 5000;

    const qb = this.raceRepo
      .createQueryBuilder('r')
      .orderBy('r.rcDate', 'DESC')
      .take(maxFetch);

    if (date) {
      qb.andWhere('r.rcDate = :date', {
        date: date.replace(/-/g, '').slice(0, 8),
      });
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
      qb.andWhere(
        '(r.rcName ILIKE :term OR r.meet ILIKE :term OR r.rcNo ILIKE :term)',
        { term },
      );
    }

    const [allRaces, total] = await qb.getManyAndCount();
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
      rcDateOrder: 'desc',
    });
    const start = (page - 1) * limit;
    const races = sorted.slice(start, start + limit);

    return {
      races: serializeRaces(races as RaceRow[]),
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
          const serialized = serializeRace(fresh);
          await this.cache.set(cacheKey, fresh, 60 * 5 * 1000);
          return serialized ?? fresh;
        }
      }
      return serializeRace(cached) ?? cached;
    }
    const race = await this._findOneRaw(id);
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');
    const serialized = serializeRace(race);
    await this.cache.set(cacheKey, race, 60 * 5 * 1000);
    return serialized ?? race;
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
    const results = await this.resultRepo.find({
      where: { raceId: id },
      order: { ordInt: 'ASC', ord: 'ASC' },
    });
    return {
      ...race,
      entries: entries as unknown as EntryRow[],
      results,
    };
  }

  async create(dto: CreateRaceDto) {
    const meet = toKraMeetForDb(dto.meet) ?? dto.meet;
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
    return (
      serializeRace({ ...race, entries }) ?? { ...race, entries }
    );
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
    const qb = this.raceRepo
      .createQueryBuilder('r')
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

    const rows = await qb.getRawMany<{ rcDate: string; meet: string; count: string }>();
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
    const today = dayjs().format('YYYYMMDD');
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
    const merged = races.map((r) => ({
      ...r,
      entries: (entriesByRace.get(r.id) ?? []).filter(
        (e) => !(e as Record<string, unknown>).isScratched,
      ),
    }));
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
      select: ['status', 'rcDate', 'stTime'],
    });
    if (!race) return [];
    const isPast = this.isPastRaceDateTime(race.rcDate, race.stTime);
    if (race.status !== 'COMPLETED' && !isPast) return [];

    const results = await this.resultRepo.find({
      where: { raceId },
      select: ['id', 'ord', 'ordType', 'chulNo', 'hrNo', 'hrName', 'jkNo', 'jkName', 'trName', 'wgBudam', 'wgHr', 'rcTime', 'diffUnit', 'winOdds', 'plcOdds'],
      order: { ordInt: 'ASC', ord: 'ASC' },
    });
    return results;
  }

  async getDividends(raceId: number) {
    type ResultRow = {
      ord: string | null;
      ordInt: number | null;
      ordType: string | null;
      chulNo: string | null;
      hrNo: string | null;
      winOdds: number | null;
      plcOdds: number | null;
    };
    const results = await this.resultRepo.find({
      where: { raceId },
      select: ['ord', 'ordInt', 'ordType', 'chulNo', 'hrNo', 'winOdds', 'plcOdds'],
      order: { ordInt: 'ASC', ord: 'ASC' },
    }) as unknown as ResultRow[];
    const list: {
      poolName: string;
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
        list.push({ poolName: '단승식', chulNo, odds: r.winOdds });
      }
      if (chulNo && r.plcOdds != null) {
        list.push({ poolName: '연승식', chulNo, odds: r.plcOdds });
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
