import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface HorseProfileDto {
  hrNo: string;
  hrName: string;
  sex: string | null;
  age: string | null;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
}

export interface HorseHistoryItemDto {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  chulNo: string | null;
  jkName: string | null;
  rcTime: string | null;
}

@Injectable()
export class HorsesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Horse profile aggregated from RaceResult (and latest RaceEntry for name/age/sex).
   * Win = 1st, Place = top 3 (ordInt 1,2,3 with NORMAL type).
   */
  async getProfile(hrNo: string): Promise<HorseProfileDto | null> {
    const results = await this.prisma.raceResult.findMany({
      where: { hrNo },
      select: {
        hrName: true,
        sex: true,
        age: true,
        ord: true,
        ordInt: true,
        ordType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (results.length === 0) {
      const entry = await this.prisma.raceEntry.findFirst({
        where: { hrNo },
        select: { hrName: true, sex: true, age: true },
      });
      if (!entry) return null;
      return {
        hrNo,
        hrName: entry.hrName,
        sex: entry.sex ?? null,
        age: entry.age != null ? String(entry.age) : null,
        totalRaces: 0,
        winCount: 0,
        placeCount: 0,
        winRate: 0,
        placeRate: 0,
        recentForm: [],
      };
    }

    const latest = results[0];
    const normalResults = results.filter((r) => {
      const t = r.ordType ?? '';
      const ordN = r.ordInt ?? (r.ord ? parseInt(String(r.ord), 10) : NaN);
      return t === 'NORMAL' || (!t && !Number.isNaN(ordN) && ordN < 90);
    });
    const totalRaces = normalResults.length;
    const winCount = normalResults.filter((r) => (r.ordInt ?? 0) === 1).length;
    const placeCount = normalResults.filter((r) => {
      const n = r.ordInt ?? 0;
      return n >= 1 && n <= 3;
    }).length;
    const winRate = totalRaces > 0 ? Math.round((winCount / totalRaces) * 10000) / 100 : 0;
    const placeRate = totalRaces > 0 ? Math.round((placeCount / totalRaces) * 10000) / 100 : 0;
    const recentForm = normalResults
      .slice(0, 10)
      .map((r) => r.ordInt ?? 0)
      .reverse();

    return {
      hrNo,
      hrName: latest.hrName,
      sex: latest.sex ?? null,
      age: latest.age ?? null,
      totalRaces,
      winCount,
      placeCount,
      winRate,
      placeRate,
      recentForm,
    };
  }

  /**
   * Paginated race history for this horse (from RaceResult + Race).
   */
  async getHistory(
    hrNo: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: HorseHistoryItemDto[];
    total: number;
    totalPages: number;
  }> {
    const where: Prisma.RaceResultWhereInput = { hrNo };
    const [items, total] = await Promise.all([
      this.prisma.raceResult.findMany({
        where,
        select: {
          raceId: true,
          ord: true,
          ordInt: true,
          chulNo: true,
          jkName: true,
          rcTime: true,
          race: {
            select: {
              rcDate: true,
              meet: true,
              meetName: true,
              rcNo: true,
              rcDist: true,
            },
          },
        },
        orderBy: { race: { rcDate: 'desc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.raceResult.count({ where }),
    ]);

    const dtos: HorseHistoryItemDto[] = items.map((r) => ({
      raceId: r.raceId,
      rcDate: r.race.rcDate,
      meet: r.race.meet,
      meetName: r.race.meetName ?? null,
      rcNo: r.race.rcNo,
      rcDist: r.race.rcDist ?? null,
      ord: r.ord,
      ordInt: r.ordInt,
      chulNo: r.chulNo,
      jkName: r.jkName ?? null,
      rcTime: r.rcTime ?? null,
    }));

    return {
      items: dtos,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
