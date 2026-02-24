import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface JockeyProfileDto {
  jkNo: string;
  jkName: string;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
  byMeet: { meet: string; count: number; winRate: number; placeRate: number }[];
}

export interface JockeyHistoryItemDto {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  hrName: string | null;
  rcTime: string | null;
}

@Injectable()
export class JockeysService {
  constructor(private prisma: PrismaService) {}

  async getProfile(jkNo: string): Promise<JockeyProfileDto | null> {
    const results = await this.prisma.raceResult.findMany({
      where: { jkNo },
      select: {
        jkName: true,
        ord: true,
        ordInt: true,
        ordType: true,
        race: { select: { meet: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (results.length === 0) return null;

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

    const meetMap = new Map<string, { wins: number; places: number; count: number }>();
    for (const r of normalResults) {
      const meet = r.race?.meet ?? 'unknown';
      const cur = meetMap.get(meet) ?? { wins: 0, places: 0, count: 0 };
      cur.count += 1;
      if ((r.ordInt ?? 0) === 1) cur.wins += 1;
      if ((r.ordInt ?? 0) >= 1 && (r.ordInt ?? 0) <= 3) cur.places += 1;
      meetMap.set(meet, cur);
    }
    const byMeet = Array.from(meetMap.entries()).map(([meet, v]) => ({
      meet,
      count: v.count,
      winRate: v.count > 0 ? Math.round((v.wins / v.count) * 10000) / 100 : 0,
      placeRate: v.count > 0 ? Math.round((v.places / v.count) * 10000) / 100 : 0,
    }));

    const jkName = results[0]?.jkName ?? jkNo;

    return {
      jkNo,
      jkName,
      totalRaces,
      winCount,
      placeCount,
      winRate,
      placeRate,
      recentForm,
      byMeet,
    };
  }

  async getHistory(
    jkNo: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: JockeyHistoryItemDto[]; total: number; totalPages: number }> {
    const where: Prisma.RaceResultWhereInput = { jkNo };
    const [items, total] = await Promise.all([
      this.prisma.raceResult.findMany({
        where,
        select: {
          raceId: true,
          ord: true,
          ordInt: true,
          hrName: true,
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

    const dtos: JockeyHistoryItemDto[] = items.map((r) => ({
      raceId: r.raceId,
      rcDate: r.race.rcDate,
      meet: r.race.meet,
      meetName: r.race.meetName ?? null,
      rcNo: r.race.rcNo,
      rcDist: r.race.rcDist ?? null,
      ord: r.ord,
      ordInt: r.ordInt,
      hrName: r.hrName ?? null,
      rcTime: r.rcTime ?? null,
    }));

    return {
      items: dtos,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
