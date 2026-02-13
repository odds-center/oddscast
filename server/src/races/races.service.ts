import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateRaceDto,
  UpdateRaceDto,
  RaceFilterDto,
  CreateRaceEntryDto,
} from './dto/race.dto';

@Injectable()
export class RacesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(filters: RaceFilterDto) {
    const { page = 1, limit = 20, date, meet, status } = filters;
    const where: Prisma.RaceWhereInput = {};
    if (date) where.rcDate = date;
    if (meet) where.meet = meet;
    if (status) where.status = status as Prisma.EnumRaceStatusFilter;

    const [races, total] = await Promise.all([
      this.prisma.race.findMany({
        where,
        include: { entries: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ rcDate: 'desc' }, { rcNo: 'asc' }],
      }),
      this.prisma.race.count({ where }),
    ]);

    return { races, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const cacheKey = `race:${id}`;
    const cached = await this.cache.get<Awaited<ReturnType<typeof this._findOneRaw>>>(cacheKey);
    if (cached) return cached;
    const race = await this._findOneRaw(id);
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');
    await this.cache.set(cacheKey, race, 60 * 5 * 1000); // 5분
    return race;
  }

  private async _findOneRaw(id: string) {
    return this.prisma.race.findUnique({
      where: { id },
      include: { entries: true, results: true, predictions: true },
    });
  }

  async create(dto: CreateRaceDto) {
    return this.prisma.race.create({ data: dto, include: { entries: true } });
  }

  async update(id: string, dto: UpdateRaceDto) {
    const race = await this.prisma.race.update({
      where: { id },
      data: dto,
      include: { entries: true },
    });
    await this.cache.del(`race:${id}`);
    return race;
  }

  async remove(id: string) {
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
      where.rcDate = { gte: filters.dateFrom, lte: filters.dateTo };
    }
    if (filters.meet) where.meet = filters.meet;

    return this.prisma.race.findMany({
      where,
      include: { entries: true },
      orderBy: [{ rcDate: 'asc' }, { rcNo: 'asc' }],
    });
  }

  async getTodayRaces() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.getRacesByDate(today);
  }

  /**
   * 날짜별 경기 목록 조회 (YYYYMMDD 형식)
   * 예: getRacesByDate('20250212') → 해당 날짜의 모든 경주
   */
  async getRacesByDate(date: string) {
    const rcDate = date.replace(/-/g, '').slice(0, 8); // YYYYMMDD 정규화
    return this.prisma.race.findMany({
      where: { rcDate },
      include: { entries: { where: { isScratched: false } } },
      orderBy: [{ rcNo: 'asc' }],
    });
  }

  async getRaceResult(raceId: string) {
    const results = await this.prisma.raceResult.findMany({
      where: { raceId },
      orderBy: { rcRank: 'asc' },
    });
    if (!results.length) throw new NotFoundException('결과를 찾을 수 없습니다');
    return results;
  }

  async createEntry(raceId: string, dto: CreateRaceEntryDto) {
    return this.prisma.raceEntry.create({ data: { ...dto, raceId } });
  }

  async createBulkEntries(raceId: string, entries: CreateRaceEntryDto[]) {
    const created = await this.prisma.raceEntry.createMany({
      data: entries.map((e) => ({ ...e, raceId })),
    });
    return { count: created.count };
  }

  async getAnalysis(raceId: string) {
    const prediction = await this.prisma.prediction.findFirst({
      where: { raceId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    return prediction || null;
  }
}
