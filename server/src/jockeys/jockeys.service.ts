import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RaceResult } from '../database/entities/race-result.entity';

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
  constructor(
    @InjectRepository(RaceResult) private readonly resultRepo: Repository<RaceResult>,
  ) {}

  async getProfile(jkNo: string): Promise<JockeyProfileDto | null> {
    const results = await this.resultRepo.find({
      where: { jkNo },
      relations: ['race'],
      order: { createdAt: 'DESC' },
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
    const winRate =
      totalRaces > 0 ? Math.round((winCount / totalRaces) * 10000) / 100 : 0;
    const placeRate =
      totalRaces > 0 ? Math.round((placeCount / totalRaces) * 10000) / 100 : 0;
    const recentForm = normalResults
      .slice(0, 10)
      .map((r) => r.ordInt ?? 0)
      .reverse();

    const meetMap = new Map<
      string,
      { wins: number; places: number; count: number }
    >();
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
      placeRate:
        v.count > 0 ? Math.round((v.places / v.count) * 10000) / 100 : 0,
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
  ): Promise<{
    items: JockeyHistoryItemDto[];
    total: number;
    totalPages: number;
  }> {
    const [withRace, total] = await this.resultRepo.findAndCount({
      where: { jkNo },
      relations: ['race'],
      order: { race: { rcDate: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: JockeyHistoryItemDto[] = withRace.map((rr) => ({
      raceId: rr.raceId,
      rcDate: rr.race?.rcDate ?? '',
      meet: rr.race?.meet ?? '',
      meetName: rr.race?.meetName ?? null,
      rcNo: rr.race?.rcNo ?? '',
      rcDist: rr.race?.rcDist ?? null,
      ord: rr.ord,
      ordInt: rr.ordInt,
      hrName: rr.hrName ?? null,
      rcTime: rr.rcTime ?? null,
    }));

    return {
      items,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
