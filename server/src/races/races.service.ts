import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
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
import {
  RACE_INCLUDE_ENTRIES,
  RACE_INCLUDE_ENTRIES_ACTIVE,
  RACE_INCLUDE_FULL,
} from '../common/prisma-includes';
import { toKraMeetForDb } from '@oddscast/shared';

@Injectable()
export class RacesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(filters: RaceFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const { q, date, dateFrom, dateTo, meet, status } = filters;
    const where: Prisma.RaceWhereInput = {};
    if (date) {
      where.rcDate = date.replace(/-/g, '').slice(0, 8);
    } else if (dateFrom && dateTo) {
      const from = dateFrom.replace(/-/g, '').slice(0, 8);
      const to = dateTo.replace(/-/g, '').slice(0, 8);
      where.rcDate = { gte: from, lte: to };
    }
    if (meet) where.meet = toKraMeetName(meet);
    if (status) where.status = status as Prisma.EnumRaceStatusFilter;
    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { rcName: { contains: term, mode: 'insensitive' } },
        { meet: { contains: term, mode: 'insensitive' } },
        { rcNo: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [races, total] = await Promise.all([
      this.prisma.race.findMany({
        where,
        include: RACE_INCLUDE_ENTRIES,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ rcDate: 'desc' }, { rcNo: 'asc' }],
      }),
      this.prisma.race.count({ where }),
    ]);

    return {
      races: serializeRaces(races),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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

  private async _findOneRaw(id: number) {
    return this.prisma.race.findUnique({
      where: { id },
      include: RACE_INCLUDE_FULL,
    });
  }

  async create(dto: CreateRaceDto) {
    const data = { ...dto, meet: toKraMeetForDb(dto.meet) ?? dto.meet };
    const created = await this.prisma.race.create({
      data,
      include: RACE_INCLUDE_ENTRIES,
    });
    return serializeRace(created) ?? created;
  }

  async update(id: number, dto: UpdateRaceDto) {
    const data =
      dto.meet != null
        ? { ...dto, meet: toKraMeetForDb(dto.meet) ?? dto.meet }
        : dto;
    const race = await this.prisma.race.update({
      where: { id },
      data,
      include: RACE_INCLUDE_ENTRIES,
    });
    await this.cache.del(`race:${id}`);
    return serializeRace(race) ?? race;
  }

  async remove(id: number) {
    await this.prisma.race.delete({ where: { id } });
    await this.cache.del(`race:${id}`);
    return { message: '경주가 삭제되었습니다' };
  }

  async getSchedule(filters: {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }) {
    const where: Prisma.RaceWhereInput = {};
    if (filters.dateFrom && filters.dateTo) {
      const from = filters.dateFrom.replace(/-/g, '').slice(0, 8);
      const to = filters.dateTo.replace(/-/g, '').slice(0, 8);
      where.rcDate = { gte: from, lte: to };
    }
    if (filters.meet) where.meet = toKraMeetName(filters.meet);

    const races = await this.prisma.race.findMany({
      where,
      include: RACE_INCLUDE_ENTRIES,
      orderBy: [{ rcDate: 'asc' }, { rcNo: 'asc' }],
    });
    return serializeRaces(races);
  }

  /**
   * 경마 시행일 목록 — 날짜별 경주 유무 및 경마장별 경주 수
   * KRA 동기화된 DB 기준 (금·토·일 시행일)
   */
  async getScheduleDates(filters: {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }): Promise<
    { date: string; meetCounts: Record<string, number>; totalRaces: number }[]
  > {
    const where: Prisma.RaceWhereInput = {};
    if (filters.dateFrom && filters.dateTo) {
      const from = filters.dateFrom.replace(/-/g, '').slice(0, 8);
      const to = filters.dateTo.replace(/-/g, '').slice(0, 8);
      where.rcDate = { gte: from, lte: to };
    }
    if (filters.meet) where.meet = toKraMeetName(filters.meet);

    const rows = await this.prisma.race.groupBy({
      by: ['rcDate', 'meet'],
      where,
      _count: { id: true },
      orderBy: { rcDate: 'asc' },
    });

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
      counts[meetName] = (counts[meetName] ?? 0) + r._count.id;
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

  /**
   * 날짜별 경기 목록 조회 (YYYYMMDD 형식)
   * 예: getRacesByDate('20250212') → 해당 날짜의 모든 경주
   */
  async getRacesByDate(date: string) {
    const rcDate = date.replace(/-/g, '').slice(0, 8); // YYYYMMDD 정규화
    const races = await this.prisma.race.findMany({
      where: { rcDate },
      include: RACE_INCLUDE_ENTRIES_ACTIVE,
      orderBy: [{ rcNo: 'asc' }],
    });
    return serializeRaces(races);
  }

  async getRaceResult(raceId: number) {
    const results = await this.prisma.raceResult.findMany({
      where: { raceId },
      select: {
        id: true,
        ord: true,
        ordType: true,
        chulNo: true,
        hrNo: true,
        hrName: true,
        jkNo: true,
        jkName: true,
        trName: true,
        wgBudam: true,
        wgHr: true,
        rcTime: true,
        diffUnit: true,
        winOdds: true,
        plcOdds: true,
      },
      orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
    });
    return results;
  }

  /**
   * Returns race dividends derived from results (winOdds = 단승식, plcOdds = 연승식 per horse).
   * Used for "승식별 배당률" display on race detail.
   */
  async getDividends(raceId: number) {
    const results = await this.prisma.raceResult.findMany({
      where: { raceId },
      select: {
        ord: true,
        ordInt: true,
        ordType: true,
        chulNo: true,
        hrNo: true,
        winOdds: true,
        plcOdds: true,
      },
      orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
    });
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
    return this.prisma.raceEntry.create({ data: { ...dto, raceId } });
  }

  async createBulkEntries(raceId: number, entries: CreateRaceEntryDto[]) {
    const created = await this.prisma.raceEntry.createMany({
      data: entries.map((e) => ({ ...e, raceId })),
    });
    return { count: created.count };
  }

  async getAnalysis(raceId: number) {
    const prediction = await this.prisma.prediction.findFirst({
      where: { raceId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    return prediction || null;
  }

  /**
   * 경주 통계 (meet/date/month/year 기준 집계)
   */
  async getStatistics(filters: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }) {
    const where: Prisma.RaceWhereInput = {};
    if (filters.meet) where.meet = toKraMeetName(filters.meet);
    if (filters.date) {
      where.rcDate = filters.date.replace(/-/g, '').slice(0, 8);
    } else if (filters.year && filters.month) {
      const m = String(filters.month).padStart(2, '0');
      const prefix = `${filters.year}${m}`;
      where.rcDate = { gte: `${prefix}01`, lte: `${prefix}31` };
    } else if (filters.year) {
      where.rcDate = {
        gte: `${filters.year}0101`,
        lte: `${filters.year}1231`,
      };
    }

    const [total, byStatus] = await Promise.all([
      this.prisma.race.count({ where }),
      this.prisma.race.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      SCHEDULED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const g of byStatus) {
      statusCounts[g.status] = g._count.id;
    }

    return {
      total,
      byStatus: statusCounts,
    };
  }
}
