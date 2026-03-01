import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RaceResult } from '../database/entities/race-result.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { Race } from '../database/entities/race.entity';

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
  constructor(
    @InjectRepository(RaceResult) private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(RaceEntry) private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
  ) {}

  /**
   * Horse profile aggregated from RaceResult (and latest RaceEntry for name/age/sex).
   * Win = 1st, Place = top 3 (ordInt 1,2,3 with NORMAL type).
   */
  async getProfile(hrNo: string): Promise<HorseProfileDto | null> {
    const results = await this.resultRepo.find({
      where: { hrNo },
      order: { createdAt: 'DESC' },
      take: 100,
      select: ['hrName', 'sex', 'age', 'ord', 'ordInt', 'ordType'],
    });

    if (results.length === 0) {
      const entry = await this.entryRepo.findOne({
        where: { hrNo },
        select: ['hrName', 'sex', 'age'],
      });
      if (!entry) return null;
      return {
        hrNo,
        hrName: entry.hrName ?? '',
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

    const latest = results[0]!;
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

    return {
      hrNo,
      hrName: latest.hrName,
      sex: latest.sex ?? null,
      age: latest.age != null ? String(latest.age) : null,
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
    const [withRace, total] = await this.resultRepo.findAndCount({
      where: { hrNo },
      relations: ['race'],
      order: { race: { rcDate: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: HorseHistoryItemDto[] = withRace.map((rr) => ({
      raceId: rr.raceId,
      rcDate: rr.race?.rcDate ?? '',
      meet: rr.race?.meet ?? '',
      meetName: rr.race?.meetName ?? null,
      rcNo: rr.race?.rcNo ?? '',
      rcDist: rr.race?.rcDist ?? null,
      ord: rr.ord,
      ordInt: rr.ordInt,
      chulNo: rr.chulNo,
      jkName: rr.jkName ?? null,
      rcTime: rr.rcTime ?? null,
    }));

    return {
      items,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
