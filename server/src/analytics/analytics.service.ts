import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionStatus } from '../database/db-enums';

const ANALYTICS_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface TrackConditionStat {
  track: string;
  totalRaces: number;
  winnerCount: number;
  winRate: number;
}

export interface PostPositionStat {
  chulNo: string;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface JockeyTrainerComboStat {
  jkNo: string;
  jkName: string;
  trName: string;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface PredictionAccuracyByMeet {
  meet: string;
  avgAccuracy: number;
  totalPredictions: number;
}

export interface DistanceWinRate {
  distanceRange: string;
  totalStarts: number;
  wins: number;
  winRate: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Track condition impact: win rates grouped by track surface condition.
   * Uses race_results track column (carried from KRA result payload).
   */
  async getTrackConditionStats(meet?: string): Promise<TrackConditionStat[]> {
    const cacheKey = `analytics:trackCondition:${meet ?? 'all'}`;
    const cached = await this.cache.get<TrackConditionStat[]>(cacheKey);
    if (cached) return cached;

    const qb = this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin(Race, 'r', 'r.id = rr.raceId')
      .select('rr.track', 'track')
      .addSelect('COUNT(DISTINCT rr.raceId)', 'totalRaces')
      .addSelect(`COUNT(CASE WHEN rr."ordInt" = 1 THEN 1 END)`, 'winnerCount')
      .where('rr.track IS NOT NULL')
      .groupBy('rr.track')
      .orderBy('"totalRaces"', 'DESC');

    if (meet) {
      qb.andWhere('r.meet = :meet', { meet });
    }

    const rows = await qb.getRawMany<{
      track: string;
      totalRaces: string;
      winnerCount: string;
    }>();

    const result = rows.map((row) => {
      const totalRaces = parseInt(row.totalRaces, 10);
      const winnerCount = parseInt(row.winnerCount, 10);
      return {
        track: row.track,
        totalRaces,
        winnerCount,
        winRate:
          totalRaces > 0
            ? Math.round((winnerCount / totalRaces) * 10000) / 100
            : 0,
      };
    });

    await this.cache.set(cacheKey, result, ANALYTICS_TTL_MS);
    return result;
  }

  /**
   * Post position (gate/chulNo) advantage: win rate per starting gate number.
   * Joins race_entries to race_results on raceId+hrNo to match starts with outcomes.
   */
  async getPostPositionStats(meet?: string): Promise<PostPositionStat[]> {
    const cacheKey = `analytics:postPosition:${meet ?? 'all'}`;
    const cached = await this.cache.get<PostPositionStat[]>(cacheKey);
    if (cached) return cached;

    const qb = this.entryRepo
      .createQueryBuilder('re')
      .innerJoin(Race, 'r', 'r.id = re.raceId')
      .leftJoin(
        RaceResult,
        'rr',
        'rr.raceId = re.raceId AND rr."hrNo" = re."hrNo"',
      )
      .select('re."chulNo"', 'chulNo')
      .addSelect('COUNT(re.id)', 'totalStarts')
      .addSelect(`COUNT(CASE WHEN rr."ordInt" = 1 THEN 1 END)`, 'wins')
      .where('re."chulNo" IS NOT NULL')
      .andWhere('re."isScratched" = false')
      .groupBy('re."chulNo"')
      .orderBy('CAST(re."chulNo" AS INTEGER)', 'ASC');

    if (meet) {
      qb.andWhere('r.meet = :meet', { meet });
    }

    const rows = await qb.getRawMany<{
      chulNo: string;
      totalStarts: string;
      wins: string;
    }>();

    const result = rows.map((row) => {
      const totalStarts = parseInt(row.totalStarts, 10);
      const wins = parseInt(row.wins, 10);
      return {
        chulNo: row.chulNo,
        totalStarts,
        wins,
        winRate:
          totalStarts > 0 ? Math.round((wins / totalStarts) * 10000) / 100 : 0,
      };
    });

    await this.cache.set(cacheKey, result, ANALYTICS_TTL_MS);
    return result;
  }

  /**
   * Jockey-trainer combination success rates.
   * Groups by jkNo + trName, counts wins (ordInt=1), top 20 by win rate (min 5 starts).
   */
  async getJockeyTrainerComboStats(
    meet?: string,
  ): Promise<JockeyTrainerComboStat[]> {
    const cacheKey = `analytics:jockeyTrainerCombo:${meet ?? 'all'}`;
    const cached = await this.cache.get<JockeyTrainerComboStat[]>(cacheKey);
    if (cached) return cached;

    const qb = this.entryRepo
      .createQueryBuilder('re')
      .innerJoin(Race, 'r', 'r.id = re.raceId')
      .leftJoin(
        RaceResult,
        'rr',
        'rr.raceId = re.raceId AND rr."hrNo" = re."hrNo"',
      )
      .select('re."jkNo"', 'jkNo')
      .addSelect('re."jkName"', 'jkName')
      .addSelect('re."trName"', 'trName')
      .addSelect('COUNT(re.id)', 'totalStarts')
      .addSelect(`COUNT(CASE WHEN rr."ordInt" = 1 THEN 1 END)`, 'wins')
      .where('re."jkNo" IS NOT NULL')
      .andWhere('re."trName" IS NOT NULL')
      .andWhere('re."isScratched" = false')
      .groupBy('re."jkNo"')
      .addGroupBy('re."jkName"')
      .addGroupBy('re."trName"')
      .having('COUNT(re.id) >= 5')
      .orderBy(
        `ROUND(COUNT(CASE WHEN rr."ordInt" = 1 THEN 1 END)::numeric / NULLIF(COUNT(re.id), 0) * 100, 2)`,
        'DESC',
      )
      .limit(20);

    if (meet) {
      qb.andWhere('r.meet = :meet', { meet });
    }

    const rows = await qb.getRawMany<{
      jkNo: string;
      jkName: string;
      trName: string;
      totalStarts: string;
      wins: string;
    }>();

    const result = rows.map((row) => {
      const totalStarts = parseInt(row.totalStarts, 10);
      const wins = parseInt(row.wins, 10);
      return {
        jkNo: row.jkNo,
        jkName: row.jkName,
        trName: row.trName,
        totalStarts,
        wins,
        winRate:
          totalStarts > 0 ? Math.round((wins / totalStarts) * 10000) / 100 : 0,
      };
    });

    await this.cache.set(cacheKey, result, ANALYTICS_TTL_MS);
    return result;
  }

  /**
   * AI prediction accuracy grouped by race meet.
   * Only includes COMPLETED predictions with a non-null accuracy value.
   */
  async getPredictionAccuracyByMeet(): Promise<PredictionAccuracyByMeet[]> {
    const cacheKey = `analytics:predictionAccuracy:all`;
    const cached = await this.cache.get<PredictionAccuracyByMeet[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.predictionRepo
      .createQueryBuilder('pred')
      .innerJoin(Race, 'r', 'r.id = pred.raceId')
      .select('r.meet', 'meet')
      .addSelect('ROUND(AVG(pred.accuracy)::numeric, 2)', 'avgAccuracy')
      .addSelect('COUNT(pred.id)', 'totalPredictions')
      .where('pred.status = :status', { status: PredictionStatus.COMPLETED })
      .andWhere('pred.accuracy IS NOT NULL')
      .groupBy('r.meet')
      .orderBy('"avgAccuracy"', 'DESC')
      .getRawMany<{
        meet: string;
        avgAccuracy: string;
        totalPredictions: string;
      }>();

    const result = rows.map((row) => ({
      meet: row.meet,
      avgAccuracy: parseFloat(row.avgAccuracy),
      totalPredictions: parseInt(row.totalPredictions, 10),
    }));

    await this.cache.set(cacheKey, result, ANALYTICS_TTL_MS);
    return result;
  }

  /**
   * Distance specialty: win rate by distance range bucket.
   * Ranges: <1200m, 1200-1400m, 1400-1600m, 1600m+
   * rcDist is stored as text (e.g. "1200") in the races table.
   */
  async getDistanceWinRates(meet?: string): Promise<DistanceWinRate[]> {
    const cacheKey = `analytics:distanceWinRates:${meet ?? 'all'}`;
    const cached = await this.cache.get<DistanceWinRate[]>(cacheKey);
    if (cached) return cached;

    const qb = this.entryRepo
      .createQueryBuilder('re')
      .innerJoin(Race, 'r', 'r.id = re.raceId')
      .leftJoin(
        RaceResult,
        'rr',
        'rr.raceId = re.raceId AND rr."hrNo" = re."hrNo"',
      )
      .select(
        `CASE
          WHEN CAST(r."rcDist" AS INTEGER) < 1200 THEN '1000-1199'
          WHEN CAST(r."rcDist" AS INTEGER) < 1400 THEN '1200-1399'
          WHEN CAST(r."rcDist" AS INTEGER) < 1600 THEN '1400-1599'
          ELSE '1600+'
        END`,
        'distanceRange',
      )
      .addSelect('COUNT(re.id)', 'totalStarts')
      .addSelect(`COUNT(CASE WHEN rr."ordInt" = 1 THEN 1 END)`, 'wins')
      .where('r."rcDist" IS NOT NULL')
      .andWhere(`r."rcDist" ~ '^[0-9]+$'`)
      .andWhere('re."isScratched" = false')
      .groupBy(
        `CASE
          WHEN CAST(r."rcDist" AS INTEGER) < 1200 THEN '1000-1199'
          WHEN CAST(r."rcDist" AS INTEGER) < 1400 THEN '1200-1399'
          WHEN CAST(r."rcDist" AS INTEGER) < 1600 THEN '1400-1599'
          ELSE '1600+'
        END`,
      )
      .orderBy('"distanceRange"', 'ASC');

    if (meet) {
      qb.andWhere('r.meet = :meet', { meet });
    }

    const rows = await qb.getRawMany<{
      distanceRange: string;
      totalStarts: string;
      wins: string;
    }>();

    const result = rows.map((row) => {
      const totalStarts = parseInt(row.totalStarts, 10);
      const wins = parseInt(row.wins, 10);
      return {
        distanceRange: row.distanceRange,
        totalStarts,
        wins,
        winRate:
          totalStarts > 0 ? Math.round((wins / totalStarts) * 10000) / 100 : 0,
      };
    });

    await this.cache.set(cacheKey, result, ANALYTICS_TTL_MS);
    return result;
  }
}
