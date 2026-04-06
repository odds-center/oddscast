import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PredictionStatus, RaceStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionsService } from '../predictions/predictions.service';
import { CommunityPredictionsService } from '../community-predictions/community-predictions.service';
import { toKraMeetName } from '../kra/constants';
import { isEligibleForAccuracy } from '../kra/ord-parser';
import { serializeRaceResults } from '../common/serializers/kra.serializer';
import {
  CreateResultDto,
  UpdateResultDto,
  BulkCreateResultDto,
  BulkUpdateResultDto,
  ResultFilterDto,
  ResultStatisticsFilterDto,
  ResultSearchDto,
} from './dto/result.dto';

type ResultWithRace = Record<string, unknown> & {
  id: number;
  raceId: number;
  ord: string | null;
  chulNo: string | null;
  hrNo: string;
  hrName: string;
  jkName: string | null;
  rcTime: string | null;
  diffUnit: string | null;
  meet?: string;
  meetName?: string | null;
  rcNo?: string;
  rcDate?: string;
  rcDist?: string | null;
  race?: {
    meet: string;
    meetName: string | null;
    rcNo: string;
    rcDate: string;
    rcDist: string | null;
  };
};

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    private readonly predictionsService: PredictionsService,
    private readonly communityPredictionsService: CommunityPredictionsService,
  ) {}

  async findAll(filters: ResultFilterDto) {
    const groupByRace =
      filters.groupByRace === true ||
      String(filters.groupByRace).toLowerCase() === 'true';
    if (groupByRace) {
      return this.findAllGroupedByRace(filters);
    }

    const { page = 1, limit = 20, date, meet } = filters;
    const qb = this.resultRepo
      .createQueryBuilder('rr')
      .innerJoinAndSelect('rr.race', 'r')
      .orderBy('r.rcDate', 'DESC')
      .addOrderBy('rr.ordInt', 'ASC', 'NULLS LAST')
      .addOrderBy('rr.ord', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (date) {
      qb.andWhere('r.rcDate = :date', {
        date: String(date).replace(/-/g, '').slice(0, 8),
      });
    }
    if (meet) {
      qb.andWhere('r.meet = :meet', { meet: toKraMeetName(meet) });
    }

    const [items, total] = await qb.getManyAndCount();
    const results = items.map((rr) => ({
      id: rr.id,
      raceId: rr.raceId,
      ord: rr.ord,
      chulNo: rr.chulNo,
      hrNo: rr.hrNo,
      hrName: rr.hrName,
      jkName: rr.jkName,
      rcTime: rr.rcTime,
      diffUnit: rr.diffUnit,
      meet: rr.race?.meet,
      meetName: rr.race?.meetName,
      rcNo: rr.race?.rcNo,
      rcDate: rr.race?.rcDate,
      rcDist: rr.race?.rcDist,
      race: rr.race
        ? {
            meet: rr.race.meet,
            meetName: rr.race.meetName,
            rcNo: rr.race.rcNo,
            rcDate: rr.race.rcDate,
            rcDist: rr.race.rcDist,
          }
        : undefined,
    }));
    return {
      results: serializeRaceResults(results as ResultWithRace[]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllGroupedByRace(filters: ResultFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const { date, meet } = filters;

    const qb = this.raceRepo.createQueryBuilder('r');
    const hasResultSubQuery = qb
      .subQuery()
      .select('1')
      .from(RaceResult, 'rr2')
      .where('rr2.raceId = r.id')
      .andWhere(
        new Brackets((b) => {
          b.where('rr2.ordInt IS NOT NULL').orWhere('rr2.ordType IS NOT NULL');
        }),
      )
      .getQuery();
    qb.where(`EXISTS ${hasResultSubQuery}`);

    if (date) {
      qb.andWhere('r.rcDate = :date', {
        date: String(date).replace(/-/g, '').slice(0, 8),
      });
    }
    if (meet) {
      qb.andWhere('r.meet = :meet', { meet: toKraMeetName(meet) });
    }

    // DB-level numeric rcNo ordering — avoids fetching 5000 rows for in-memory sort
    const [races, total] = await qb
      .orderBy('r.rcDate', 'DESC')
      .addOrderBy('r.meet', 'ASC')
      .addOrderBy("COALESCE(NULLIF(r.rcNo, '')::INTEGER, 0)", 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const raceIds = races.map((r) => r.id);

    let results: RaceResult[] = [];
    if (raceIds.length > 0) {
      results = await this.resultRepo
        .createQueryBuilder('rr')
        .where('rr.raceId IN (:...raceIds)', { raceIds })
        .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
        .orderBy('rr.ordInt', 'ASC', 'NULLS LAST')
        .addOrderBy('rr.ord', 'ASC')
        .getMany();
    }

    const resultsByRaceId = new Map<number, RaceResult[]>();
    for (const r of results) {
      if (!resultsByRaceId.has(r.raceId)) resultsByRaceId.set(r.raceId, []);
      resultsByRaceId.get(r.raceId)!.push(r);
    }

    const raceGroups = races.map((race) => ({
      race: {
        id: String(race.id),
        meet: race.meet,
        meetName: race.meetName,
        rcDate: race.rcDate,
        rcNo: race.rcNo,
        rcDist: race.rcDist,
      },
      results: serializeRaceResults(
        (resultsByRaceId.get(race.id) ?? []).map((res) => ({
          ...res,
          race: {
            meet: race.meet,
            meetName: race.meetName,
            rcDate: race.rcDate,
            rcNo: race.rcNo,
            rcDist: race.rcDist,
          },
        })) as ResultWithRace[],
      ),
    }));

    return {
      raceGroups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const rr = await this.resultRepo.findOne({
      where: { id },
      relations: ['race'],
    });
    if (!rr) throw new NotFoundException('결과를 찾을 수 없습니다');
    const result: ResultWithRace = {
      ...rr,
      race: rr.race
        ? {
            meet: rr.race.meet,
            meetName: rr.race.meetName,
            rcNo: rr.race.rcNo,
            rcDate: rr.race.rcDate,
            rcDist: rr.race.rcDist,
          }
        : undefined,
    };
    return serializeRaceResults([result])[0] ?? result;
  }

  async create(dto: CreateResultDto) {
    const now = new Date();
    const result = this.resultRepo.create({
      raceId: dto.raceId,
      ord: dto.ord ?? null,
      ordType: dto.ordType ?? null,
      hrNo: dto.hrNo,
      hrName: dto.hrName,
      jkName: dto.jkName ?? null,
      trName: dto.trName ?? null,
      owName: dto.owName ?? null,
      rcTime: dto.rcTime ?? null,
      chaksun1: dto.chaksun1 ?? null,
      updatedAt: now,
    });
    const saved = await this.resultRepo.save(result);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateResultDto) {
    const result = await this.resultRepo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('결과를 찾을 수 없습니다');
    if (dto.ord !== undefined) result.ord = dto.ord;
    if (dto.ordType !== undefined) result.ordType = dto.ordType;
    if (dto.rcTime !== undefined) result.rcTime = dto.rcTime;
    if (dto.chaksun1 !== undefined) result.chaksun1 = dto.chaksun1;
    await this.resultRepo.save(result);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.resultRepo.delete(id);
    return { message: '결과가 삭제되었습니다' };
  }

  async bulkCreate(dto: BulkCreateResultDto) {
    const now = new Date();
    const entities = dto.results.map((row) =>
      this.resultRepo.create({
        raceId: row.raceId,
        ord: row.ord ?? null,
        ordType: row.ordType ?? null,
        hrNo: row.hrNo,
        hrName: row.hrName,
        jkName: row.jkName ?? null,
        trName: row.trName ?? null,
        owName: row.owName ?? null,
        rcTime: row.rcTime ?? null,
        chaksun1: row.chaksun1 ?? null,
        updatedAt: now,
      }),
    );
    await this.resultRepo.save(entities, { chunk: 100 });
    const count = entities.length;

    // Collect all unique raceIds and mark each as COMPLETED
    const raceIds = [
      ...new Set(dto.results.map((r) => r.raceId).filter(Boolean)),
    ];
    for (const raceId of raceIds) {
      await this.raceRepo.update(raceId, {
        status: RaceStatus.COMPLETED,
        updatedAt: new Date(),
      });
      await this.updatePredictionAccuracy(raceId);
      this.predictionsService.generatePostRaceSummary(raceId).catch(() => {});
      this.predictionsService.generateRaceCommentary(raceId, 'post-race').catch((err: unknown) => {
        this.logger.warn(
          `Failed to generate post-race commentary for race ${raceId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      this.communityPredictionsService.scoreRacePredictions(raceId).catch((err: unknown) => {
        this.logger.warn(
          `Failed to score community predictions for race ${raceId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }
    return { count };
  }

  async onResultsSyncedForRace(raceId: number): Promise<void> {
    await this.updatePredictionAccuracy(raceId);
    this.predictionsService.generatePostRaceSummary(raceId).catch(() => {});
    this.predictionsService.generateRaceCommentary(raceId, 'post-race').catch((err: unknown) => {
      this.logger.warn(
        `Failed to generate post-race commentary for race ${raceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  /** Update prediction accuracy only, without triggering Gemini post-race summary. */
  async updateAccuracyOnly(raceId: number): Promise<void> {
    await this.updatePredictionAccuracy(raceId);
  }

  private async updatePredictionAccuracy(raceId: number) {
    const prediction = await this.predictionRepo.findOne({
      where: { raceId, status: PredictionStatus.COMPLETED },
      select: ['id', 'scores'],
      order: { createdAt: 'DESC' },
    });
    if (!prediction?.scores) return;

    const scores = prediction.scores as {
      horseScores?: Array<{ hrName?: string; hrNo?: string; score?: number }>;
    };
    const horseScores = scores.horseScores;
    if (!horseScores?.length) return;

    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.hrNo', 'rr.hrName', 'rr.ordType', 'rr.ordInt', 'rr.ord'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC', 'NULLS LAST')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
    if (!results.length) return;

    const predictedOrder = [...horseScores]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((h) => String(h.hrNo ?? h.hrName ?? '').trim());
    const actualTop = results
      .filter((r) => isEligibleForAccuracy(r.ordType))
      .slice(0, 3)
      .map((r) => String(r.hrNo ?? r.hrName ?? '').trim());

    const topN = Math.min(3, predictedOrder.length, actualTop.length);
    let matchCount = 0;
    for (let i = 0; i < topN; i++) {
      if (actualTop.includes(predictedOrder[i]!)) matchCount++;
    }
    const accuracy = topN > 0 ? (matchCount / topN) * 100 : 0;

    // Evaluation logger: structured output for tracking prediction accuracy over time.
    // Format: [EVAL] Race {raceId}: predicted {top3}, actual {top3}, match={n}/{topN}
    // Used to measure Gemini prediction quality without requiring a separate monitoring system.
    const predictedTop3 = predictedOrder.slice(0, 3).join(',');
    const actualTop3 = actualTop.join(',');
    this.logger.log(
      `[EVAL] Race ${raceId}: predicted [${predictedTop3}], actual [${actualTop3}], match=${matchCount}/${topN}, accuracy=${Math.round(accuracy)}%`,
    );

    await this.predictionRepo.update(prediction.id, {
      accuracy,
      updatedAt: new Date(),
    });
  }

  async getByRace(raceId: number) {
    return this.resultRepo
      .createQueryBuilder('rr')
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC', 'NULLS LAST')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
  }

  async getStatistics(filters: ResultStatisticsFilterDto) {
    const qb = this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)');
    if (filters.dateFrom && filters.dateTo) {
      qb.andWhere('r.rcDate >= :from', { from: filters.dateFrom });
      qb.andWhere('r.rcDate <= :to', { to: filters.dateTo });
    }
    if (filters.meet) {
      qb.andWhere('r.meet = :meet', { meet: toKraMeetName(filters.meet) });
    }
    const totalResults = await qb.getCount();
    return { totalResults, filters };
  }

  async exportResults(format: string, _filters: ResultStatisticsFilterDto) {
    const items = await this.resultRepo
      .createQueryBuilder('rr')
      .innerJoinAndSelect('rr.race', 'r')
      .where('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.createdAt', 'DESC')
      .take(100)
      .getMany();
    const results = items.map((rr) => ({
      ...rr,
      race: rr.race
        ? {
            meet: rr.race.meet,
            meetName: rr.race.meetName,
            rcNo: rr.race.rcNo,
            rcDate: rr.race.rcDate,
            rcDist: rr.race.rcDist,
          }
        : undefined,
    }));
    return { format, count: results.length, data: results };
  }

  async search(filters: ResultSearchDto) {
    const { q, date, meet, page = 1, limit = 20 } = filters;
    const qb = this.resultRepo
      .createQueryBuilder('rr')
      .innerJoinAndSelect('rr.race', 'r')
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (date) {
      qb.andWhere('r.rcDate = :date', { date });
    }
    if (meet) {
      qb.andWhere('r.meet = :meet', { meet: toKraMeetName(meet) });
    }
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(rr.hrName ILIKE :term OR rr.hrNo ILIKE :term OR rr.jkName ILIKE :term)',
        { term },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const results = items.map((rr) => ({
      id: rr.id,
      raceId: rr.raceId,
      ord: rr.ord,
      chulNo: rr.chulNo,
      hrNo: rr.hrNo,
      hrName: rr.hrName,
      jkName: rr.jkName,
      meet: rr.race?.meet,
      meetName: rr.race?.meetName,
      rcNo: rr.race?.rcNo,
      rcDate: rr.race?.rcDate,
      race: rr.race
        ? {
            meet: rr.race.meet,
            meetName: rr.race.meetName,
            rcNo: rr.race.rcNo,
            rcDate: rr.race.rcDate,
          }
        : undefined,
    }));
    return {
      results: serializeRaceResults(results as ResultWithRace[]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async validateByRaceId(raceId: number) {
    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.id', 'rr.hrNo', 'rr.hrName'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC', 'NULLS LAST')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
    const errors: string[] = [];
    const hrNos = new Set<string>();
    for (const r of results) {
      if (!r.hrNo || !r.hrName) {
        errors.push(`결과 id=${r.id}: hrNo, hrName 필수`);
      }
      if (hrNos.has(r.hrNo)) {
        errors.push(`중복 출전번호/말: ${r.hrNo}`);
      }
      hrNos.add(r.hrNo);
    }
    return {
      valid: errors.length === 0,
      raceId,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async bulkUpdate(dto: BulkUpdateResultDto) {
    let updated = 0;
    for (const item of dto.updates) {
      const result = await this.resultRepo.findOne({ where: { id: item.id } });
      if (!result) continue;
      let changed = false;
      if (item.ord !== undefined) {
        result.ord = item.ord;
        changed = true;
      }
      if (item.ordType !== undefined) {
        result.ordType = item.ordType;
        changed = true;
      }
      if (item.rcTime !== undefined) {
        result.rcTime = item.rcTime;
        changed = true;
      }
      if (item.chaksun1 !== undefined) {
        result.chaksun1 = item.chaksun1;
        changed = true;
      }
      if (changed) {
        await this.resultRepo.save(result);
        updated++;
      }
    }
    return { updated };
  }
}
