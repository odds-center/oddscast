import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { Training } from '../database/entities/training.entity';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sortRacesByNumericRcNo } from '../common/utils/race-sort';
import { meetToCode, toKraMeetName } from '../kra/constants';
import { isEligibleForAccuracy } from '../kra/ord-parser';
import {
  parseGeminiResponseText,
  computeEntriesHash as computeEntriesHashUtil,
  computeWinProbabilities as computeWinProbabilitiesUtil,
  applyOddsBlend as applyOddsBlendUtil,
} from './prediction-utils';
import {
  CreatePredictionDto,
  UpdatePredictionStatusDto,
  PredictionFilterDto,
  AccuracyHistoryFilterDto,
} from './dto/prediction.dto';
import type {
  RaceForPython,
  RaceEntryForAnalysis,
  HorseAnalysisItem,
  GeminiPredictionJson,
  BetTypePredictions,
} from './prediction-internal.types';
import { todayKstYyyymmdd, kst } from '../common/utils/kst';

/** Thrown when a generatePrediction call finds a PROCESSING row for the same race+entriesHash. */
export class PredictionInProgressException extends Error {
  readonly predictionId: number;
  constructor(predictionId: number) {
    super('Prediction generation is already in progress');
    this.name = 'PredictionInProgressException';
    this.predictionId = predictionId;
  }
}

/** Last successful Gemini model — prioritized on next request to avoid 404 retries */
let lastWorkingGeminiModel: string | null = null;
let lastWorkingGeminiModelAt = 0;
const MODEL_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(TrainerResult)
    private readonly trainerResultRepo: Repository<TrainerResult>,
    @InjectRepository(JockeyResult)
    private readonly jockeyResultRepo: Repository<JockeyResult>,
    @InjectRepository(Training)
    private readonly trainingRepo: Repository<Training>,
    private readonly analysisService: AnalysisService,
    private readonly configService: GlobalConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Load race by id with entries for analysis. Optionally attach winOdds by hrNo from race_results (for score reflection). */
  private async loadRaceWithEntries(
    raceId: number,
  ): Promise<RaceForPython | null> {
    const race = await this.raceRepo.findOne({ where: { id: raceId } });
    if (!race) return null;
    const allEntries = await this.entryRepo.find({
      where: { raceId },
      order: { id: 'ASC' },
    });
    // Filter out scratched/withdrawn horses — they cannot race and must not be scored
    const entries = allEntries.filter(
      (e) => !((e as { isScratched?: boolean }).isScratched),
    );
    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.hrNo', 'rr.winOdds'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .getMany();
    const oddsByHrNo: Record<string, number> = {};
    for (const r of results) {
      if (r.hrNo && r.winOdds != null && r.winOdds > 0) {
        oddsByHrNo[String(r.hrNo)] = r.winOdds;
      }
    }
    return {
      ...race,
      entries,
      ...(Object.keys(oddsByHrNo).length > 0 ? { oddsByHrNo } : {}),
    } as unknown as RaceForPython;
  }

  async findAll(filters: PredictionFilterDto) {
    const { page = 1, limit = 20, status } = filters;
    const qb = this.predictionRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.race', 'r')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) {
      qb.andWhere('p.status = :status', { status });
    }
    const [items, total] = await qb.getManyAndCount();
    const predictions = items.map((p) => ({
      ...p,
      race: p.race
        ? {
            id: p.race.id,
            rcDate: p.race.rcDate,
            meet: p.race.meet,
            meetName: p.race.meetName,
            rcNo: p.race.rcNo,
            rcName: p.race.rcName,
            status: p.race.status,
            rcDist: p.race.rcDist,
            rank: p.race.rank,
            weather: p.race.weather,
            track: p.race.track,
            stTime: p.race.stTime,
            rcCondition: p.race.rcCondition,
            rcPrize: p.race.rcPrize,
            createdAt: p.race.createdAt,
            updatedAt: p.race.updatedAt,
          }
        : undefined,
    }));
    return { predictions, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const prediction = await this.predictionRepo.findOne({
      where: { id },
      relations: ['race'],
    });
    if (!prediction) throw new NotFoundException('예측을 찾을 수 없습니다');
    const entries = await this.entryRepo.find({
      where: { raceId: prediction.raceId },
      order: { id: 'ASC' },
    });
    const race = prediction.race
      ? { ...prediction.race, entries }
      : { entries };
    return { ...prediction, race };
  }

  async create(dto: CreatePredictionDto) {
    const now = new Date();
    const prediction = this.predictionRepo.create({
      raceId: dto.raceId,
      scores: dto.scores ?? null,
      analysis: dto.analysis ?? null,
      preview: dto.preview ?? null,
      updatedAt: now,
    });
    const row = await this.predictionRepo.save(prediction);
    const race = await this.raceRepo.findOne({ where: { id: row.raceId } });
    return { ...row, race: race ?? undefined };
  }

  async updateStatus(id: number, dto: UpdatePredictionStatusDto) {
    const prediction = await this.predictionRepo.findOne({ where: { id } });
    if (!prediction) return null;
    if (dto.status !== undefined)
      prediction.status = dto.status as PredictionStatus;
    if (dto.scores !== undefined) prediction.scores = dto.scores;
    if (dto.analysis !== undefined) prediction.analysis = dto.analysis;
    if (dto.accuracy !== undefined) prediction.accuracy = dto.accuracy;
    if (dto.previewApproved !== undefined)
      prediction.previewApproved = dto.previewApproved;
    await this.predictionRepo.save(prediction);
    return prediction;
  }

  async getDashboard() {
    const [total, completed, pending, avgRow] = await Promise.all([
      this.predictionRepo.count(),
      this.predictionRepo.count({
        where: { status: PredictionStatus.COMPLETED },
      }),
      this.predictionRepo.count({
        where: { status: PredictionStatus.PENDING },
      }),
      this.predictionRepo
        .createQueryBuilder('p')
        .select('AVG(p.accuracy)', 'avg')
        .where('p.status = :status', { status: PredictionStatus.COMPLETED })
        .andWhere('p.accuracy IS NOT NULL')
        .getRawOne<{ avg: string | null }>(),
    ]);
    const averageAccuracy = avgRow?.avg != null ? parseFloat(avgRow.avg) : 0;
    return { total, completed, pending, averageAccuracy };
  }

  async getAnalyticsDashboard() {
    const completed = await this.predictionRepo.find({
      where: { status: PredictionStatus.COMPLETED },
      select: ['id', 'accuracy', 'scores'],
    });
    const totalPredictions = completed.length;
    const correctPredictions = completed.filter(
      (p) => (p.accuracy ?? 0) > 0,
    ).length;
    const avgAccuracy =
      totalPredictions > 0
        ? completed.reduce((s, p) => s + (p.accuracy ?? 0), 0) /
          totalPredictions
        : 0;

    const emptyPos = { correct: 0, total: 0, accuracy: 0 };
    const byPosition = {
      first: { ...emptyPos },
      second: { ...emptyPos },
      third: { ...emptyPos },
    };
    completed.forEach((p) => {
      const acc = p.accuracy ?? 0;
      if (acc > 0) {
        byPosition.first.total++;
        byPosition.first.correct += acc >= 30 ? 1 : 0;
        byPosition.second.total++;
        byPosition.second.correct += acc >= 15 ? 1 : 0;
        byPosition.third.total++;
        byPosition.third.correct += acc >= 5 ? 1 : 0;
      }
    });
    ['first', 'second', 'third'].forEach((pos) => {
      const p = byPosition[pos as keyof typeof byPosition];
      p.accuracy = p.total > 0 ? (p.correct / p.total) * 100 : 0;
    });

    const recent7 = await this.getRecent7DaysAccuracy();

    return {
      overall: {
        totalPredictions,
        correctPredictions,
        accuracy: avgAccuracy,
        avgConfidence: avgAccuracy,
      },
      byPosition,
      recent7Days: recent7,
      byProvider: [
        {
          provider: 'gemini',
          accuracy: avgAccuracy,
          count: totalPredictions,
          avgCost: 0,
        },
      ],
    };
  }

  private async getRecent7DaysAccuracy(): Promise<
    Array<{ date: string; accuracy: number; count: number }>
  > {
    // Fetch all predictions within the 7-day window in a single query (not 7×full-scan)
    const rangeStart = kst().subtract(6, 'day').startOf('day').toDate();
    const rangeEnd = kst().endOf('day').toDate();
    const allPreds = await this.predictionRepo.find({
      where: {
        status: PredictionStatus.COMPLETED,
        createdAt: Between(rangeStart, rangeEnd),
      },
      select: ['accuracy', 'createdAt'],
      order: { createdAt: 'ASC' },
    });

    const results: Array<{ date: string; accuracy: number; count: number }> =
      [];
    for (let i = 6; i >= 0; i--) {
      const day = kst().subtract(i, 'day');
      const start = day.startOf('day').toDate();
      const end = day.endOf('day').toDate();
      const dayPredsFiltered = allPreds.filter(
        (p) => p.createdAt >= start && p.createdAt <= end && p.accuracy != null,
      );
      const count = dayPredsFiltered.length;
      const accuracy =
        count > 0
          ? dayPredsFiltered.reduce((s, p) => s + (p.accuracy ?? 0), 0) / count
          : 0;
      results.push({
        date: kst(day.toDate()).format('YYYY-MM-DD'),
        accuracy,
        count,
      });
    }
    return results;
  }

  async getCostStats() {
    return { totalCost: 0 };
  }

  async getAnalyticsFailures(opts: { startDate?: string; endDate?: string }) {
    const qb = this.predictionRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.raceId', 'p.accuracy'])
      .where("p.status = 'COMPLETED'")
      .andWhere('(p.accuracy = 0 OR p.accuracy IS NULL)')
      .take(50);
    if (opts.startDate && opts.endDate) {
      qb.andWhere('p.createdAt BETWEEN :start AND :end', {
        start: new Date(opts.startDate),
        end: new Date(opts.endDate),
      });
    }
    const failed = await qb.getMany();
    return {
      totalFailures: failed.length,
      byReason: [
        { reason: 'accuracy_zero', count: failed.length, percentage: 100 },
      ],
      avgMissDistance: 0,
      commonPatterns: [],
    };
  }

  async getAccuracyHistory(filters: AccuracyHistoryFilterDto) {
    const { limit = 30 } = filters;
    const rows = await this.predictionRepo.find({
      where: { status: PredictionStatus.COMPLETED },
      select: ['id', 'raceId', 'accuracy', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.filter((p) => p.accuracy != null);
  }

  /**
   * Generate a short post-race analysis summary (2-3 sentences) via Gemini after results are in.
   * Called from ResultsService after updatePredictionAccuracy. Failures are logged but not thrown.
   */
  async generatePostRaceSummary(raceId: number): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const pred = await this.predictionRepo.findOne({
      where: { raceId, status: PredictionStatus.COMPLETED },
      relations: ['race'],
      order: { createdAt: 'DESC' },
    });
    if (!pred?.race) return;
    const prediction = {
      ...pred,
      race: {
        meet: pred.race.meet,
        rcDate: pred.race.rcDate,
        rcNo: pred.race.rcNo,
      },
    };
    if (!prediction?.race) return;
    const scoresObj = prediction.scores as { horseScores?: unknown[] } | null;
    if (!scoresObj?.horseScores?.length) return;

    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.ord', 'rr.ordType', 'rr.hrName', 'rr.hrNo', 'rr.rcTime'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();
    const topResults = results
      .filter((r) => isEligibleForAccuracy(r.ordType))
      .slice(0, 3)
      .map(
        (r, i) =>
          `${i + 1}위: ${r.hrName ?? r.hrNo ?? '-'}${r.rcTime ? ` (${r.rcTime}초)` : ''}`,
      )
      .join(', ');

    const scores = prediction.scores as {
      horseScores?: Array<{ hrName?: string; hrNo?: string; score?: number }>;
    };
    const predictedTop = (scores.horseScores ?? [])
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3)
      .map((h, i) => `${i + 1}위: ${h.hrName ?? h.hrNo ?? '-'}`)
      .join(', ');

    const acc =
      (prediction as { accuracy?: number | null }).accuracy != null
        ? Math.round((prediction as { accuracy: number }).accuracy)
        : 0;
    const { meet, rcDate, rcNo } = prediction.race;

    const prompt = `다음 경주 결과와 AI 예측을 바탕으로 2~3문장의 경주 후 분석 요약을 한국어로 작성해 주세요. 감탄사나 과장 없이 사실 위주로.

경주: ${meet} ${rcDate} ${rcNo}경주
실제 결과(상위3): ${topResults || '-'}
AI 예측 순위: ${predictedTop || '-'}
예측 적중률: ${acc}%

요약:`;

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response?.text()?.trim();
      if (text) {
        await this.predictionRepo.update(pred.id, {
          postRaceSummary: text,
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      this.logger.warn(
        `Post-race summary failed for race ${raceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Public accuracy stats for /predictions/accuracy dashboard.
   * Returns overall stats, by-month trend, and by-meet breakdown.
   */
  async getAccuracyStats(): Promise<{
    overall: { totalCount: number; hitCount: number; averageAccuracy: number };
    byMonth: Array<{ month: string; count: number; averageAccuracy: number }>;
    byMeet: Array<{ meet: string; count: number; averageAccuracy: number }>;
  }> {
    const completedRows = await this.predictionRepo
      .createQueryBuilder('p')
      .innerJoin('p.race', 'r')
      .select('p.accuracy', 'accuracy')
      .addSelect('p.createdAt', 'createdAt')
      .addSelect('r.meet', 'meet')
      .where("p.status = 'COMPLETED'")
      .andWhere('p.accuracy IS NOT NULL')
      .getRawMany<{ accuracy: number | null; createdAt: Date; meet: string }>();
    const completed = completedRows.map((r) => ({
      accuracy: r.accuracy,
      createdAt: r.createdAt,
      race: { meet: r.meet },
    }));

    const totalCount = completed.length;
    const hitCount = completed.filter((p) => (p.accuracy ?? 0) > 0).length;
    const sumAcc = completed.reduce((s, p) => s + (p.accuracy ?? 0), 0);
    const averageAccuracy =
      totalCount > 0 ? Math.round((sumAcc / totalCount) * 100) / 100 : 0;

    const byMonthMap = new Map<string, { sum: number; count: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonthMap.set(key, { sum: 0, count: 0 });
    }
    for (const p of completed) {
      const d = p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonthMap.get(key);
      if (cur) {
        cur.count += 1;
        cur.sum += p.accuracy ?? 0;
      }
    }
    const byMonth = Array.from(byMonthMap.entries())
      .map(([month, { sum, count }]) => ({
        month,
        count,
        averageAccuracy: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const byMeetMap = new Map<string, { sum: number; count: number }>();
    for (const p of completed) {
      const meet = p.race?.meet ?? '기타';
      const cur = byMeetMap.get(meet) ?? { sum: 0, count: 0 };
      cur.count += 1;
      cur.sum += p.accuracy ?? 0;
      byMeetMap.set(meet, cur);
    }
    const byMeet = Array.from(byMeetMap.entries()).map(
      ([meet, { sum, count }]) => ({
        meet,
        count,
        averageAccuracy: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      }),
    );

    return {
      overall: { totalCount, hitCount, averageAccuracy },
      byMonth,
      byMeet,
    };
  }

  /**
   * 예측 미리보기 — 검수 완료(previewApproved)된 것만 반환.
   * 검수 미통과 시 데이터를 보내지 않음 (사행성 방지).
   * UI 표시용: scores.horseScores, analysis, preview 반환
   */
  async getPreview(raceId: number) {
    const p = await this.predictionRepo.findOne({
      where: {
        raceId,
        previewApproved: true,
        status: PredictionStatus.COMPLETED,
      },
      select: ['id', 'preview', 'analysis', 'scores', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return p ?? null;
  }

  async getByRace(raceId: number) {
    const prediction = await this.predictionRepo.findOne({
      where: { raceId, status: PredictionStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });
    if (!prediction) return null;
    const race = await this.raceRepo.findOne({ where: { id: raceId } });
    const entries = await this.entryRepo.find({
      where: { raceId },
      order: { id: 'ASC' },
    });
    return { ...prediction, race: race ? { ...race, entries } : { entries } };
  }

  /** 경주별 예측 기록 목록 (다시 예측 시 이전 기록 유지) */
  async getByRaceHistory(raceId: number) {
    const predictions = await this.predictionRepo.find({
      where: { raceId, status: PredictionStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });
    if (predictions.length === 0) return [];
    const race = await this.raceRepo.findOne({ where: { id: raceId } });
    const entries = await this.entryRepo.find({
      where: { raceId },
      order: { id: 'ASC' },
    });
    const raceWithEntries = race ? { ...race, entries } : { entries };
    return predictions.map((p) => ({ ...p, race: raceWithEntries }));
  }

  /**
   * Admin: all predictions list with pagination (limit up to 100).
   * Order: newest first (createdAt desc); optionally filter by status or raceId.
   */
  async findAllForAdmin(filters: {
    page?: number;
    limit?: number;
    status?: string;
    raceId?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const qb = this.predictionRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.race', 'r')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (filters.status)
      qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.raceId != null)
      qb.andWhere('p.raceId = :raceId', { raceId: filters.raceId });
    const [items, total] = await qb.getManyAndCount();
    const predictions = items.map((p) => ({
      ...p,
      race: p.race
        ? {
            id: p.race.id,
            rcDate: p.race.rcDate,
            rcNo: p.race.rcNo,
            meet: p.race.meet,
            meetName: p.race.meetName,
            rcName: p.race.rcName,
            status: p.race.status,
          }
        : undefined,
    }));
    return { predictions, total, page, totalPages: Math.ceil(total / limit) };
  }

  /** Admin: count of predictions created today (KST). */
  async getTodayCreatedCount(): Promise<{ count: number }> {
    const dayStart = kst().startOf('day').toDate();
    const dayEnd = kst().endOf('day').toDate();
    const count = await this.predictionRepo.count({
      where: {
        createdAt: Between(dayStart, dayEnd),
      },
    });
    return { count };
  }

  /**
   * Admin: generate predictions for races that have no COMPLETED prediction, in order (rcDate, meet, rcNo).
   * dateFrom/dateTo: YYYYMMDD. Defaults to last 30 days if omitted.
   */
  /** Delay between each race in batch to avoid Gemini 429 (free tier ~20/day). Default 35s. */
  private static readonly DELAY_BETWEEN_RACES_MS = 35_000;

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Extract retry delay (seconds) from Gemini 429 error. */
  private getRetryDelaySeconds(err: unknown): number {
    const details = (err as { errorDetails?: Array<{ retryDelay?: string }> })
      ?.errorDetails;
    if (Array.isArray(details)) {
      const retry = details.find((d) => d?.retryDelay != null);
      if (retry?.retryDelay) {
        const sec = parseFloat(retry.retryDelay.replace('s', ''));
        if (Number.isFinite(sec)) return Math.ceil(Math.max(sec, 30));
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    const match = msg.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(Math.max(parseFloat(match[1]), 30));
    return 60;
  }

  async generateBatch(options: {
    dateFrom?: string;
    dateTo?: string;
    delayBetweenRacesMs?: number;
  }): Promise<{
    requested: number;
    generated: number;
    failed: number;
    errors: string[];
  }> {
    return this.generateBatchWithProgress(options, () => {});
  }

  /**
   * Batch with progress callback. Includes past + future races (dateTo can be after today).
   * Delay between races to avoid 429; on 429 waits retryDelay then retries once.
   */
  async generateBatchWithProgress(
    options: {
      dateFrom?: string;
      dateTo?: string;
      delayBetweenRacesMs?: number;
    },
    onProgress: (event: {
      requested: number;
      current: number;
      generated: number;
      failed: number;
      lastRace?: string;
      retryAfter?: number;
    }) => void,
  ): Promise<{
    requested: number;
    generated: number;
    failed: number;
    errors: string[];
  }> {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const dateFrom = (options.dateFrom ?? defaultStart)
      .replace(/-/g, '')
      .slice(0, 8);
    const dateTo = (options.dateTo ?? defaultEnd).replace(/-/g, '').slice(0, 8);
    const delayMs =
      options.delayBetweenRacesMs ?? PredictionsService.DELAY_BETWEEN_RACES_MS;

    const completedRaceIds = await this.predictionRepo
      .find({
        where: { status: PredictionStatus.COMPLETED },
        select: ['raceId'],
      })
      .then((rows) => [...new Set(rows.map((r) => r.raceId))]);
    const rawRaces = await this.raceRepo.find({
      where: {
        rcDate: Between(dateFrom, dateTo),
        ...(completedRaceIds.length > 0
          ? { id: Not(In(completedRaceIds)) }
          : {}),
      },
      select: ['id', 'rcDate', 'rcNo', 'meet'],
      order: { rcDate: 'ASC' },
    });
    const races = sortRacesByNumericRcNo(rawRaces, {
      getRcDate: (r) => r.rcDate ?? '',
      getMeet: (r) => r.meet ?? '',
      getRcNo: (r) => r.rcNo ?? '',
      rcDateOrder: 'asc',
    });

    const errors: string[] = [];
    let generated = 0;
    let current = 0;

    for (const race of races) {
      current++;
      const raceLabel = `${race.meet} ${race.rcNo}R (${race.rcDate})`;
      onProgress({
        requested: races.length,
        current,
        generated,
        failed: errors.length,
        lastRace: raceLabel,
      });

      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt === 1) {
            const retrySec = this.getRetryDelaySeconds(lastErr);
            onProgress({
              requested: races.length,
              current,
              generated,
              failed: errors.length,
              lastRace: raceLabel,
              retryAfter: retrySec,
            });
            await this.delay(retrySec * 1000);
          }
          await this.generatePrediction(race.id);
          generated++;
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          const status = (err as { status?: number })?.status;
          if (status === 429 && attempt === 0) {
            continue;
          }
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${raceLabel}: ${msg}`);
          break;
        }
      }

      if (current < races.length) {
        await this.delay(delayMs);
      }
    }

    onProgress({
      requested: races.length,
      current: races.length,
      generated,
      failed: errors.length,
    });

    return {
      requested: races.length,
      generated,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Generate predictions for all races on a given date (for matrix batch generation).
   * Unlike generateBatch, this targets a specific date and overwrites existing predictions.
   * No long delay between races — used for admin on-demand matrix generation.
   */
  async generatePredictionsForDate(
    date: string,
    meet?: string,
  ): Promise<{ requested: number; generated: number; failed: number; errors: string[] }> {
    const rcDate = date.replace(/-/g, '').slice(0, 8);
    const kraMeetName = meet ? toKraMeetName(meet) : undefined;
    const races = await this.raceRepo.find({
      where: kraMeetName ? { rcDate, meet: kraMeetName } : { rcDate },
      select: ['id', 'rcDate', 'rcNo', 'meet'],
      order: { rcNo: 'ASC' },
    });

    const generated: number[] = [];
    const errors: string[] = [];

    for (const race of races) {
      const raceLabel = `${race.meet} ${rcDate} R${race.rcNo}`;
      try {
        await this.generatePrediction(race.id);
        generated.push(race.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${raceLabel}: ${msg}`);
      }
    }

    return {
      requested: races.length,
      generated: generated.length,
      failed: errors.length,
      errors,
    };
  }

  /**
   * 종합 예상 매트릭스 (용산종합지 스타일)
   * date: YYYYMMDD 또는 YYYY-MM-DD, meet: 서울|제주|부산경남
   */
  async getMatrix(date?: string, meet?: string) {
    const rcDate = date
      ? date.replace(/-/g, '').slice(0, 8)
      : todayKstYyyymmdd();
    const raceWhereOpts: { rcDate: string; meet?: string } = { rcDate };
    if (meet) raceWhereOpts.meet = toKraMeetName(meet);
    const rawRacesList = await this.raceRepo.find({
      where: raceWhereOpts,
      select: ['id', 'meet', 'meetName', 'rcNo', 'stTime', 'rcDist', 'rank'],
      order: { meet: 'ASC' },
    });
    const raceIds = rawRacesList.map((r) => r.id);
    const entriesMap = new Map<
      number,
      Array<{ hrNo: string; hrName: string; chulNo?: string }>
    >();
    if (raceIds.length > 0) {
      const entriesList = await this.entryRepo.find({
        where: { raceId: In(raceIds) },
        select: ['raceId', 'hrNo', 'hrName', 'chulNo'],
      });
      for (const e of entriesList) {
        if (!entriesMap.has(e.raceId)) entriesMap.set(e.raceId, []);
        entriesMap.get(e.raceId)!.push({ hrNo: e.hrNo, hrName: e.hrName, chulNo: (e as { chulNo?: string }).chulNo ?? undefined });
      }
    }
    const rawRaces = rawRacesList.map((r) => ({
      ...r,
      entries: entriesMap.get(r.id) ?? [],
    }));
    const races = sortRacesByNumericRcNo(rawRaces, {
      getRcDate: () => rcDate,
      getMeet: (r) => (r as { meet?: string }).meet ?? '',
      getRcNo: (r) => (r as { rcNo?: string }).rcNo ?? '',
      rcDateOrder: 'asc',
    });

    // Batch-load all COMPLETED predictions for these races (avoid N+1)
    type HorseScore = { hrNo?: string; hrName?: string; chulNo?: string; score?: number; winProb?: number };
    const predsByRaceId = new Map<number, { scores: unknown; analysis?: string }>();
    if (raceIds.length > 0) {
      const allPreds = await this.predictionRepo
        .createQueryBuilder('p')
        .select(['p.raceId', 'p.scores', 'p.analysis'])
        .where('p.raceId IN (:...raceIds)', { raceIds })
        .andWhere('p.status = :status', { status: PredictionStatus.COMPLETED })
        .orderBy('p.createdAt', 'DESC')
        .getMany();
      // Keep only the most recent prediction per race
      for (const p of allPreds) {
        if (!predsByRaceId.has(p.raceId)) {
          predsByRaceId.set(p.raceId, { scores: p.scores, analysis: p.analysis ?? undefined });
        }
      }
    }

    const rows: Array<{
      raceId: string;
      meet: string;
      meetName?: string;
      rcNo: string;
      stTime?: string;
      rcDist?: string;
      rank?: string;
      entryCount?: number;
      entries?: Array<{ hrNo: string; hrName: string; chulNo?: string }>;
      predictions: Record<string, string[] | string>;
      horseNames: Record<string, string>;
      aiConsensus: string;
      consensusLabel?: string;
      horseScores?: Array<{ hrNo?: string; hrName?: string; chulNo?: string; score?: number; winProb?: number }>;
      analysis?: string;
    }> = [];

    for (const race of races) {
      const pred = predsByRaceId.get((race as unknown as { id: number }).id);
      const scoresData = pred?.scores as { horseScores?: HorseScore[] } | null;
      const scores: HorseScore[] = scoresData?.horseScores ?? [];
      const top1 = scores[0]?.hrNo;
      const top2 = scores[1]?.hrNo;
      const consensus = top1 ?? '-';
      const consensusArr = top1 && top2 ? [top1, top2] : top1 ? [top1] : [];

      const horseNames: Record<string, string> = {};
      const entryList =
        (race as { entries?: Array<{ hrNo?: string; hrName?: string; chulNo?: string }> })
          .entries ?? [];
      for (const e of entryList) {
        if (e.hrNo && e.hrName) horseNames[e.hrNo] = e.hrName;
      }
      for (const s of scores) {
        if (s.hrNo && s.hrName && !horseNames[s.hrNo]) {
          horseNames[s.hrNo] = s.hrName;
        }
      }

      // Build chulNo lookup: scores may carry chulNo even when entry sheet is missing
      const chulNoByHrNo: Record<string, string> = {};
      for (const s of scores) {
        if (s.hrNo && s.chulNo) chulNoByHrNo[s.hrNo] = s.chulNo;
      }

      rows.push({
        raceId: String((race as unknown as { id: number }).id),
        meet: (race as { meet?: string }).meet ?? '',
        meetName: (race as { meetName?: string }).meetName ?? undefined,
        rcNo: (race as { rcNo?: string }).rcNo ?? '',
        stTime: (race as { stTime?: string }).stTime ?? undefined,
        rcDist: (race as { rcDist?: string }).rcDist ?? undefined,
        rank: (race as { rank?: string }).rank ?? undefined,
        entryCount: entryList.length > 0 ? entryList.length : undefined,
        entries: entryList.map((e) => ({
          hrNo: e.hrNo ?? '',
          hrName: e.hrName ?? '',
          chulNo: e.chulNo ?? (e.hrNo ? chulNoByHrNo[e.hrNo] : undefined),
        })),
        predictions: {
          ai_consensus: consensusArr.length > 0 ? consensusArr : consensus,
          expert_1: top1 && top2 ? [top1, top2] : top1 ? [top1] : [],
        },
        horseNames,
        aiConsensus: consensus,
        consensusLabel: top1 ? '축' : undefined,
        horseScores: scores.length > 0 ? scores : undefined,
        analysis: (pred as { analysis?: string } | null)?.analysis ?? undefined,
      });
    }

    return {
      raceMatrix: rows,
      experts: [{ id: 'ai_consensus', name: 'AI 종합' }],
    };
  }

  /**
   * 전문가 코멘트 피드 (AI 예측 preview/analysis 기반)
   */
  async getCommentary(date?: string, limit = 20, offset = 0, meet?: string) {
    const rcDate = date
      ? date.replace(/-/g, '').slice(0, 8)
      : todayKstYyyymmdd();
    const predsList = await this.predictionRepo.find({
      where: {
        previewApproved: true,
        status: PredictionStatus.COMPLETED,
        race: { rcDate, ...(meet ? { meet: toKraMeetName(meet) } : {}) },
      },
      relations: ['race'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    type CommentaryPred = {
      id: number;
      raceId: number;
      scores: unknown;
      preview: string | null;
      race: { id: number; meet: string; meetName?: string; rcNo: string };
    };
    const preds: CommentaryPred[] = predsList.map((p) => ({
      id: p.id,
      raceId: p.raceId,
      scores: p.scores,
      preview: p.preview != null ? p.preview : null,
      race: p.race
        ? {
            id: p.race.id,
            meet: p.race.meet,
            meetName: p.race.meetName ?? undefined,
            rcNo: p.race.rcNo,
          }
        : { id: 0, meet: '', rcNo: '' },
    }));

    const comments: Array<{
      id: string;
      expertId: string;
      expertName: string;
      raceId: string;
      meet: string;
      rcNo: string;
      hrNo: string;
      hrName: string;
      comment: string;
      keywords?: string[];
    }> = [];

    for (const p of preds) {
      const scores =
        (
          p.scores as {
            horseScores?: Array<{
              hrNo?: string;
              hrName?: string;
              reason?: string;
            }>;
          }
        )?.horseScores ?? [];
      const top = scores[0];
      if (!top || !p.race) continue;
      comments.push({
        id: `pred-${p.id}`,
        expertId: 'ai',
        expertName: 'AI 종합',
        raceId: String(p.raceId),
        meet: p.race.meet ?? '',
        rcNo: p.race.rcNo ?? '',
        hrNo: top.hrNo ?? '',
        hrName: top.hrName ?? '',
        comment:
          top.reason ?? (p.preview && String(p.preview).slice(0, 120)) ?? '',
        keywords: top.reason ? [top.reason.slice(0, 30)] : undefined,
      });
    }

    const total = await this.predictionRepo.count({
      where: {
        previewApproved: true,
        status: PredictionStatus.COMPLETED,
        race: { rcDate, ...(meet ? { meet: toKraMeetName(meet) } : {}) },
      },
    });
    return { comments, total };
  }

  /**
   * 적중 내역 배너 (높은 정확도 예측)
   */
  async getHitRecords(limit = 5) {
    const predsList = await this.predictionRepo.find({
      where: { status: PredictionStatus.COMPLETED },
      relations: ['race'],
      select: ['id', 'accuracy', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 20),
    });
    type HitPred = {
      id: number;
      accuracy: number | null;
      createdAt: Date;
      race: { rcDate?: string; meet?: string };
    };
    const preds: HitPred[] = predsList
      .filter((p) => p.accuracy != null && p.accuracy >= 33)
      .map((p) => ({
        id: p.id,
        accuracy: p.accuracy,
        createdAt: p.createdAt,
        race: p.race ? { rcDate: p.race.rcDate, meet: p.race.meet } : {},
      }));

    return preds.map((p) => {
      const d = p.race?.rcDate
        ? `${p.race.rcDate.slice(0, 4)}-${p.race.rcDate.slice(4, 6)}-${p.race.rcDate.slice(6, 8)}`
        : kst(p.createdAt).format('YYYY-MM-DD');
      const acc = Math.round((p.accuracy ?? 0) as number);
      return {
        id: `hit-${p.id}`,
        hitDate: d,
        description: `${acc}% 적중! ${d} ${p.race?.meet ?? ''} 경주`,
        details: p.race?.meet ? `${p.race.meet}` : undefined,
      };
    });
  }

  // --- Gemini Integration ---

  async generatePrediction(
    raceId: number,
    opts?: { skipCache?: boolean; realtime?: boolean },
  ) {
    // 1. Check Gemini Availability
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    // 2. Load model & params from Admin AI Config (GlobalConfig)
    const rawConfig = await this.configService.get('ai_config');
    const aiConfig = rawConfig
      ? (JSON.parse(rawConfig) as Record<string, unknown>)
      : {};
    const rawModel = (aiConfig.primaryModel as string) || 'gemini-2.5-flash';
    // 404/미지원 모델 → fallback 사용 (gemini-2.5-flash 우선)
    const deprecatedOrUnavailable = [
      'gemini-1.5-pro',
      'gemini-1.5-pro-002',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];
    const fallbackModels = [
      'gemini-2.5-flash', // 우선 (현재 사용 가능)
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-pro',
    ];
    let modelsToTry = deprecatedOrUnavailable.includes(rawModel)
      ? [...fallbackModels]
      : [rawModel, ...fallbackModels.filter((m) => m !== rawModel)];
    // Prioritize last working model if still within TTL
    if (
      lastWorkingGeminiModel &&
      Date.now() - lastWorkingGeminiModelAt < MODEL_CACHE_TTL_MS &&
      modelsToTry.includes(lastWorkingGeminiModel)
    ) {
      modelsToTry = [
        lastWorkingGeminiModel,
        ...modelsToTry.filter((m) => m !== lastWorkingGeminiModel),
      ];
    }
    const temperature = Math.min(
      1,
      Math.max(0, Number(aiConfig.temperature) || 0.7),
    );
    const maxTokens = Math.min(
      8192,
      Math.max(500, Number(aiConfig.maxTokens) || 4096),
    );

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Fetch Race Data (출전마·기수·훈련 내역)
    const race = await this.loadRaceWithEntries(raceId);
    if (!race) throw new NotFoundException('Race not found');

    // 2a. Cache check — skip Gemini if a COMPLETED prediction already exists
    //     for the same race with the same entry sheet (entriesHash).
    //     KRA entry data changes at well-defined points (entry sheet upload, jockey swap, etc.)
    //     so a hash of key fields is a reliable deduplication key.
    //     skipCache=true for individual real-time predictions (always regenerate).
    const entriesHash = this.computeEntriesHash(race.entries ?? []);
    if (!opts?.skipCache) {
      const cached = await this.predictionRepo.findOne({
        where: { raceId, entriesHash, status: PredictionStatus.COMPLETED },
        order: { createdAt: 'DESC' },
      });
      if (cached) {
        this.logger.log(
          `Cache hit for race ${raceId} (entriesHash=${entriesHash}) — reusing prediction ${cached.id}`,
        );
        return cached;
      }
    }

    // Concurrency lock: if another process is already generating for the same entry sheet, throw.
    const inProgress = await this.predictionRepo.findOne({
      where: { raceId, entriesHash, status: PredictionStatus.PROCESSING },
      order: { createdAt: 'DESC' },
    });
    if (inProgress) {
      const err = new PredictionInProgressException(inProgress.id);
      throw err;
    }

    // Acquire lock by creating a PROCESSING row before expensive work.
    const lockRow = await this.predictionRepo.save(
      this.predictionRepo.create({
        raceId,
        entriesHash,
        status: PredictionStatus.PROCESSING,
        scores: {},
        analysis: '',
        preview: '',
      }),
    );

    // Wrap entire prediction flow in try/finally to guarantee lock cleanup
    try {
    // 3a. 과거 구간별 성적 (선행마/추입마) — RaceEntry.sectionalStats 우선, 없으면 RaceResult
    const sectionalByHorse = await this.getSectionalAnalysisByHorse(
      race as RaceForPython,
    );

    // 3b. recentRanks 보강 — DB에 없으면 RaceResult에서 과거 착순 조회 (KRA_API_ANALYSIS_SPEC §4.2)
    const raceWithRecentRanks = await this.enrichEntriesWithRecentRanks(
      race as RaceForPython,
    );
    // 3b-2. 낙마 이력 보강 — 말/기수별 과거 낙마 횟수 (fall risk·연쇄 낙마 산출용)
    const raceWithFallHistory =
      await this.enrichEntriesWithFallHistory(raceWithRecentRanks);
    // 3b-3. 거리별 성적 보강 — 현재 경주 거리 구간의 승률/복승률
    const raceWithDist =
      await this.enrichEntriesWithDistanceStats(raceWithFallHistory);
    // 3b-5. 클래스 변경 감지 — 이전 경주 대비 등급 상/하향
    const raceWithClass =
      await this.enrichEntriesWithClassChange(raceWithDist);
    // 3c. 조교사 승률/복승률 보강 — TrainerResult (API19_1)
    const raceWithTrainer =
      await this.enrichEntriesWithTrainerResults(raceWithClass);
    // 3c-2. 기수 meet-level 승률/복승률 보강 — JockeyResult → Python jockey weight 직접 반영
    const raceWithJockey =
      await this.enrichEntriesWithJockeyResults(raceWithTrainer);
    // 3c-3. 조교 데이터 구조화 — trainings 테이블에서 최근 14일 메트릭 추출
    const raceWithTraining =
      await this.enrichEntriesWithTrainingMetrics(raceWithJockey);
    // 3c-4. 당일 복수 출전 피로도 감지 — 같은 날 이전 경주 출전 여부 확인
    const raceWithFatigue =
      await this.enrichEntriesWithSameDayFatigue(raceWithTraining);
    // 3d. 구간별 태그(선행마/추입마) merge — Python calculate_score 입력용
    const raceWithSectional = this.enrichEntriesWithSectionalTag(
      raceWithFatigue,
      sectionalByHorse,
    );

    // 3. Run Python Analysis (말 기준 점수 + 기수 통합 분석)
    const path = require('path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
    const { horseScores: horseScoreResult, cascadeFallRisk } =
      await this.runPythonScript(scriptPath, raceWithSectional);

    let jockeyAnalysis: {
      entriesWithScores?: Array<{
        hrName: string;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: {
        hrName: string;
        jkName: string;
        jockeyScore: number;
      } | null;
    } | null = null;
    try {
      jockeyAnalysis = await this.analysisService.analyzeJockey(raceId);
    } catch (e) {
      this.logger.warn(`Jockey analysis skipped: ${(e as Error).message}`);
    }

    // 4. Apply odds blend to horseScoreResult so saved winProb reflects market odds when available.
    //    Uses same 80% model / 20% odds-implied logic as constructPrompt, but applied to the
    //    Python output before saving — keeps DB winProb consistent with Gemini context.
    const oddsMap = (
      race as RaceForPython & { oddsByHrNo?: Record<string, number> }
    ).oddsByHrNo;
    const patchedHorseScoreResult = this.applyOddsBlendToHorseScores(
      horseScoreResult,
      jockeyAnalysis,
      oddsMap,
    );

    // 5. Construct Prompt (훈련 요약, 구간별 성적 태깅 포함)
    const prompt = this.constructPrompt(
      raceWithSectional,
      patchedHorseScoreResult,
      jockeyAnalysis,
      sectionalByHorse,
      cascadeFallRisk,
      opts?.realtime,
    );

    // 6. Call Gemini (404 시 fallback 모델로 재시도)
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };
    let lastError: Error | null = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 7. Parse and Save (예측 성공 시 관련 데이터 DB 저장)
        const predictionData = this.parseGeminiResponse(text);
        const geminiScores = predictionData?.scores ?? predictionData;

        const scoresToSave = this.buildScoresForSave(
          geminiScores,
          patchedHorseScoreResult,
          jockeyAnalysis,
          (race as { entries?: Array<{ hrNo?: string; chulNo?: string }> })
            .entries ?? [],
        );

        lastWorkingGeminiModel = modelName;
        lastWorkingGeminiModelAt = Date.now();

        // Update lock row to COMPLETED (same row, preserving id for referential integrity).
        await this.predictionRepo
          .createQueryBuilder()
          .update()
          .set({
            scores: () =>
              `'${JSON.stringify(scoresToSave)}'::jsonb`,
            analysis: predictionData?.analysis ?? '',
            preview: predictionData?.preview ?? '',
            status: PredictionStatus.COMPLETED,
            previewApproved: true,
          })
          .where('id = :id', { id: lockRow.id })
          .execute();
        const created = await this.predictionRepo.findOneOrFail({
          where: { id: lockRow.id },
        });

        // Smart Race Alert: high-confidence prediction → notify users with predictionEnabled
        const horseScores =
          (scoresToSave as { horseScores?: Array<{ winProb?: number }> })
            ?.horseScores ?? [];
        const maxWinProb = horseScores.length
          ? Math.max(0, ...horseScores.map((h) => h.winProb ?? 0))
          : 0;
        const confidencePercent = Math.round(maxWinProb);
        if (confidencePercent >= 70) {
          try {
            await this.notificationsService.notifyHighConfidencePrediction({
              raceId,
              predictionId: created.id,
              meet: (race as { meet?: string }).meet,
              rcNo: (race as { rcNo?: string }).rcNo,
              rcDate: (race as { rcDate?: string }).rcDate,
              confidencePercent,
            });
          } catch (alertErr) {
            this.logger.warn(
              `notifyHighConfidencePrediction failed: ${alertErr instanceof Error ? alertErr.message : alertErr}`,
            );
          }
        }

        return created;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const status = (err as { status?: number })?.status;
        const msg = String((err as Error).message);
        const is404 =
          status === 404 ||
          msg.includes('404') ||
          msg.toLowerCase().includes('not found');
        if (is404) {
          this.logger.warn(
            `Gemini model "${modelName}" not found (404), trying next...`,
          );
          continue;
        }
        this.logger.error(`Gemini generation failed (${modelName}): ${lastError}`);
        await this.predictionRepo.update(lockRow.id, {
          status: PredictionStatus.FAILED,
        });
        throw new Error(
          `Failed to generate prediction via Gemini: ${lastError.message}`,
        );
      }
    }
    await this.predictionRepo.update(lockRow.id, {
      status: PredictionStatus.FAILED,
    });
    throw new Error(
      `Failed to generate prediction: no usable model. Last error: ${lastError?.message ?? 'unknown'}`,
    );
    } catch (err) {
      // Ensure lock row is set to FAILED if still PROCESSING (prevents permanent lock)
      try {
        const current = await this.predictionRepo.findOne({
          where: { id: lockRow.id },
          select: ['id', 'status'],
        });
        if (current && current.status === PredictionStatus.PROCESSING) {
          await this.predictionRepo.update(lockRow.id, {
            status: PredictionStatus.FAILED,
          });
          this.logger.warn(
            `Lock row ${lockRow.id} cleaned up to FAILED after error`,
          );
        }
      } catch {
        // Ignore cleanup errors
      }
      throw err;
    }
  }

  /** entries로 최소 horseScore 배열 생성 — Python 실패 시 무조건 결과 산출 */
  private fallbackHorseScoresFromEntries(
    entries: Array<{ hrNo?: string; chulNo?: string }>,
  ): HorseAnalysisItem[] {
    return entries.slice(0, 14).map((e, i) => ({
      hrNo: e.hrNo ?? e.chulNo ?? String(i + 1),
      score: 50 + (14 - i) * 2,
    }));
  }

  private runPythonScript(
    scriptPath: string,
    raceData: RaceForPython,
  ): Promise<{ horseScores: HorseAnalysisItem[]; cascadeFallRisk?: number }> {
    const { spawn } = require('child_process');
    const entries = raceData.entries ?? [];

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [scriptPath]);
      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        let horseScores: HorseAnalysisItem[];
        let cascadeFallRisk: number | undefined;
        try {
          const parsed = JSON.parse(dataString || '[]');
          if (
            parsed &&
            typeof parsed === 'object' &&
            Array.isArray(parsed.scores)
          ) {
            horseScores = parsed.scores as HorseAnalysisItem[];
            cascadeFallRisk =
              typeof parsed.cascadeFallRisk === 'number'
                ? parsed.cascadeFallRisk
                : undefined;
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            horseScores = parsed as HorseAnalysisItem[];
          } else {
            horseScores = this.fallbackHorseScoresFromEntries(entries);
            if (code !== 0 || parsed?.error) {
              this.logger.warn(
                `Python analysis fallback (code=${code}): ${errorString || parsed?.error || 'no valid output'}`,
              );
            }
          }
        } catch {
          horseScores = this.fallbackHorseScoresFromEntries(entries);
          this.logger.warn(
            `Python parse fallback: ${dataString?.slice(0, 100) || errorString}`,
          );
        }
        resolve({ horseScores, cascadeFallRisk });
      });

      pythonProcess.stdin.write(
        JSON.stringify(raceData, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
      pythonProcess.stdin.end();
    });
  }

  private buildRaceContext(
    race: RaceForPython,
    cascadeFallRisk?: number,
  ): Record<string, unknown> {
    const ctx: Record<string, unknown> = {
      meet: race.meet,
      meetName: race.meetName,
      rcDate: race.rcDate,
      rcNo: race.rcNo,
      rcDist: race.rcDist,
      rank: race.rank,
      rcCondition: race.rcCondition,
      rcPrize: race.rcPrize,
      weather: race.weather ?? '미상',
      track: race.track ?? '미상',
    };
    if (cascadeFallRisk != null && cascadeFallRisk >= 10) {
      ctx.cascadeFallRisk = cascadeFallRisk;
    }
    return ctx;
  }

  private buildEntrySummary(
    entry: RaceEntryForAnalysis,
    trainingSummary?: string,
    sectionalTag?: string,
  ): Record<string, unknown> {
    const chaksunTStr =
      entry.chaksunT != null
        ? typeof entry.chaksunT === 'bigint'
          ? entry.chaksunT.toString()
          : String(entry.chaksunT)
        : undefined;

    const ratingHist = entry.ratingHistory as number[] | null | undefined;
    const ratingHistoryLimited =
      Array.isArray(ratingHist) && ratingHist.length > 0
        ? ratingHist.slice(0, 3)
        : undefined;

    const trainSummary =
      trainingSummary && trainingSummary.length > 80
        ? trainingSummary.slice(0, 77) + '...'
        : trainingSummary;

    const base: Record<string, unknown> = {
      hrNo: entry.hrNo,
      hrName: entry.hrName,
      jkNo: entry.jkNo ?? undefined,
      jkName: entry.jkName,
      trName: entry.trName,
      wgBudam: entry.wgBudam,
      rating: entry.rating,
      ratingHistory: ratingHistoryLimited,
      chulNo: entry.chulNo,
      rcCntT: entry.rcCntT,
      ord1CntT: entry.ord1CntT,
      recentRanks: entry.recentRanks,
      horseWeight: entry.horseWeight,
      isScratched: entry.isScratched,
      sex: entry.sex ?? undefined,
      age: entry.age ?? undefined,
      prd: entry.prd ?? undefined,
      chaksun1: entry.chaksun1 ?? undefined,
      chaksunT: chaksunTStr,
      trainerWinRate: entry.trainerWinRate ?? undefined,
      trainerQuRate: entry.trainerQuRate ?? undefined,
    };
    if (entry.equipment) base.equipment = entry.equipment;
    if (entry.bleedingInfo) base.bleedingInfo = entry.bleedingInfo;
    if (entry.fallHistoryHorse != null)
      base.fallHistoryHorse = entry.fallHistoryHorse;
    if (entry.fallHistoryJockey != null)
      base.fallHistoryJockey = entry.fallHistoryJockey;
    if (entry.daysSinceLastRace != null)
      base.daysSinceLastRace = entry.daysSinceLastRace;
    if (entry.distWinRate != null) base.distWinRate = entry.distWinRate;
    if (entry.distPlaceRate != null) base.distPlaceRate = entry.distPlaceRate;
    if (entry.distRaceCount != null) base.distRaceCount = entry.distRaceCount;
    if (entry.classChange) base.classChange = entry.classChange;
    if (entry.classChangeLevel != null)
      base.classChangeLevel = entry.classChangeLevel;
    if (entry.trainingMetrics) base.trainingMetrics = entry.trainingMetrics;
    if (trainSummary) base.trainingSummary = trainSummary;
    if (sectionalTag) base.sectionalTag = sectionalTag;
    return base;
  }

  /**
   * recentRanks 보강 — RaceResult에서 해당 말(hrNo)의 과거 착순을 조회해 entries에 채움.
   * KRA sync에서 recentRanks 미적재 시 예측 시점에 온디맨드 계산 (KRA_API_ANALYSIS_SPEC §4.2)
   */
  private async enrichEntriesWithRecentRanks(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    if (!hrNos.length) return race;

    const beforeRcDate = race.rcDate ?? '';
    if (!beforeRcDate) return race;

    const resultsRows = await this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .select('rr.hrNo', 'hrNo')
      .addSelect('rr.ord', 'ord')
      .addSelect('rr.ordInt', 'ordInt')
      .addSelect('r.rcDate', 'rcDate')
      .where('rr.hrNo IN (:...hrNos)', { hrNos })
      .andWhere('r.rcDate < :beforeRcDate', { beforeRcDate })
      .orderBy('r.rcDate', 'DESC')
      .limit(500)
      .getRawMany<{
        hrNo: string;
        ord: string | null;
        ordInt: number | null;
        rcDate: string;
      }>();
    const results = resultsRows.map((r) => ({
      ...r,
      race: { rcDate: r.rcDate },
    }));

    // rcDate 내림차순 정렬 후 hrNo별 최근 5경기 착순
    const sorted = [...results].sort((a, b) => {
      const da = a.race?.rcDate ?? '';
      const db = b.race?.rcDate ?? '';
      return db.localeCompare(da);
    });
    const byHorse = new Map<string, number[]>();
    for (const r of sorted) {
      const arr = byHorse.get(r.hrNo) ?? [];
      if (arr.length >= 5) continue;
      const ordNum =
        r.ordInt ??
        (r.ord != null && /^\d+$/.test(r.ord)
          ? parseInt(r.ord, 10)
          : undefined);
      if (ordNum != null && ordNum > 0) arr.push(ordNum);
      byHorse.set(r.hrNo, arr);
    }

    // Also derive rest period (daysSinceLastRace) from the most recent result per horse
    const raceDate = this.parseYyyymmddToDate(beforeRcDate);
    const lastRcDateByHorse = new Map<string, string>();
    for (const r of sorted) {
      if (!lastRcDateByHorse.has(r.hrNo)) {
        lastRcDateByHorse.set(r.hrNo, r.race.rcDate);
      }
    }

    const enrichedEntries = entries.map((e) => {
      const ranks = byHorse.get(e.hrNo);
      const enriched = { ...e, recentRanks: ranks ?? e.recentRanks };

      // Compute daysSinceLastRace from recentRanks data
      const lastDate = lastRcDateByHorse.get(e.hrNo);
      if (lastDate && raceDate) {
        const lastDateObj = this.parseYyyymmddToDate(lastDate);
        if (lastDateObj) {
          const diffMs = raceDate.getTime() - lastDateObj.getTime();
          const daysSinceLastRace = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (daysSinceLastRace >= 0) {
            enriched.daysSinceLastRace = daysSinceLastRace;
          }
        }
      }

      return enriched;
    });

    return { ...race, entries: enrichedEntries };
  }

  /**
   * 구간별 태그(선행마/추입마/중간마) merge — Python calculate_score에서 sectionalBonus 계산에 사용
   */
  private enrichEntriesWithSectionalTag(
    race: RaceForPython,
    sectionalByHorse: Record<string, { tag: string }>,
  ): RaceForPython {
    const entries = race.entries ?? [];
    if (!entries.length) return race;
    const enrichedEntries = entries.map((e) => ({
      ...e,
      sectionalTag: sectionalByHorse[e.hrNo]?.tag,
    }));
    return { ...race, entries: enrichedEntries };
  }

  /**
   * 낙마 이력 보강 — RaceResult에서 말(hrNo)·기수(jkNo)별 과거 낙마(ordType=FALL) 횟수 조회.
   * Python fall_risk_score·연쇄 낙마 산출용.
   */
  private async enrichEntriesWithFallHistory(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    const jkNos = [
      ...new Set(entries.map((e) => e.jkNo).filter(Boolean)),
    ] as string[];
    const beforeRcDate = race.rcDate ?? '';
    if (!beforeRcDate) return race;

    const fallResults = await this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .select('rr.hrNo', 'hrNo')
      .addSelect('rr.jkNo', 'jkNo')
      .where("rr.ordType = 'FALL'")
      .andWhere('r.rcDate < :beforeRcDate', { beforeRcDate })
      .andWhere('(rr.hrNo IN (:...hrNos) OR rr.jkNo IN (:...jkNos))', {
        hrNos,
        jkNos,
      })
      .limit(2000)
      .getRawMany<{ hrNo: string | null; jkNo: string | null }>();

    const byHorse = new Map<string, number>();
    const byJockey = new Map<string, number>();
    for (const r of fallResults) {
      if (r.hrNo) byHorse.set(r.hrNo, (byHorse.get(r.hrNo) ?? 0) + 1);
      if (r.jkNo) byJockey.set(r.jkNo, (byJockey.get(r.jkNo) ?? 0) + 1);
    }

    const enrichedEntries = entries.map((e) => {
      const jkNo = e.jkNo;
      return {
        ...e,
        fallHistoryHorse: byHorse.get(e.hrNo) ?? 0,
        fallHistoryJockey: jkNo ? (byJockey.get(jkNo) ?? 0) : 0,
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  /**
   * 조교사 승률/복승률 보강 — TrainerResult에서 해당 trNo(meet)의 통계를 조회해 entries에 채움
   * @see docs/specs/KRA_TRAINER_SPEC.md
   */
  private async enrichEntriesWithTrainerResults(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;

    const meetCode = meetToCode(race.meet ?? '');
    const trNos = [
      ...new Set(
        entries.map((e) => e.trNo).filter((v): v is string => Boolean(v)),
      ),
    ];
    if (!trNos.length) return race;

    const trainers = await this.trainerResultRepo.find({
      where: { meet: meetCode, trNo: In(trNos) },
      select: ['trNo', 'winRateTsum', 'quRateTsum'],
    });
    const byTrNo = new Map(
      trainers.map((t) => [
        t.trNo,
        { winRateTsum: t.winRateTsum, quRateTsum: t.quRateTsum },
      ]),
    );

    const enrichedEntries = entries.map((e) => {
      const trNo = e.trNo;
      if (!trNo) return e;
      const t = byTrNo.get(trNo);
      if (!t) return e;
      return {
        ...e,
        trainerWinRate: t.winRateTsum,
        trainerQuRate: t.quRateTsum,
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  /**
   * Enrich entries with jockey win/place rates from JockeyResult.
   * Step 1: meet-specific lookup (primary — most predictive).
   * Step 2: career-wide fallback for jockeys not found in the current meet
   *         (e.g. first appearance at this venue, new jockey).
   *         Aggregates ord1/ord2/ord3CntT across all meets and derives rates.
   *         Python _jockey_score() applies a 10% discount for fallback data.
   */
  private async enrichEntriesWithJockeyResults(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;

    const meetCode = meetToCode(race.meet ?? '');
    const jkNos = [
      ...new Set(
        entries.map((e) => e.jkNo).filter((v): v is string => Boolean(v)),
      ),
    ];
    if (!jkNos.length) return race;

    // Step 1: meet-specific
    const meetJockeys = await this.jockeyResultRepo.find({
      where: { meet: meetCode, jkNo: In(jkNos) },
      select: ['jkNo', 'rcCntT', 'winRateTsum', 'quRateTsum'],
    });
    const byJkNo = new Map(
      meetJockeys.map((j) => [
        j.jkNo,
        { winRateTsum: j.winRateTsum, quRateTsum: j.quRateTsum, rcCntT: j.rcCntT, fallback: false },
      ]),
    );

    // Step 2: career-wide fallback for jockeys missing from current meet
    const missingJkNos = jkNos.filter((jkNo) => !byJkNo.has(jkNo));
    if (missingJkNos.length > 0) {
      const careerRows = await this.jockeyResultRepo.find({
        where: { jkNo: In(missingJkNos) },
        select: ['jkNo', 'rcCntT', 'ord1CntT', 'ord2CntT', 'ord3CntT'],
      });

      const careerTotals = new Map<
        string,
        { rcCntT: number; ord1CntT: number; quCnt: number }
      >();
      for (const row of careerRows) {
        const prev = careerTotals.get(row.jkNo);
        if (prev) {
          prev.rcCntT += row.rcCntT;
          prev.ord1CntT += row.ord1CntT;
          prev.quCnt += row.ord1CntT + row.ord2CntT + row.ord3CntT;
        } else {
          careerTotals.set(row.jkNo, {
            rcCntT: row.rcCntT,
            ord1CntT: row.ord1CntT,
            quCnt: row.ord1CntT + row.ord2CntT + row.ord3CntT,
          });
        }
      }

      for (const [jkNo, stats] of careerTotals.entries()) {
        if (stats.rcCntT > 0) {
          byJkNo.set(jkNo, {
            winRateTsum: (stats.ord1CntT / stats.rcCntT) * 100,
            quRateTsum: (stats.quCnt / stats.rcCntT) * 100,
            rcCntT: stats.rcCntT,
            fallback: true,
          });
        }
      }
    }

    const enrichedEntries = entries.map((e) => {
      const jkNo = e.jkNo;
      if (!jkNo) return e;
      const j = byJkNo.get(jkNo);
      if (!j) return e;
      return {
        ...e,
        jockeyMeetWinRate: j.winRateTsum,
        jockeyMeetQuRate: j.quRateTsum,
        jockeyRcCntT: j.rcCntT,
        jockeyFallbackCareer: j.fallback,
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  private parseYyyymmddToDate(yyyymmdd: string): Date | null {
    if (!yyyymmdd || yyyymmdd.length < 8) return null;
    const y = parseInt(yyyymmdd.slice(0, 4), 10);
    const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
    const d = parseInt(yyyymmdd.slice(6, 8), 10);
    const dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  /**
   * Enrich entries with distance-specific performance stats.
   * Groups past results by distance bracket and computes win/place rates for the current race distance.
   */
  private async enrichEntriesWithDistanceStats(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;
    const rcDist = parseInt(race.rcDist ?? '0', 10);
    if (rcDist <= 0) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    if (!hrNos.length) return race;
    const beforeRcDate = race.rcDate ?? '';
    if (!beforeRcDate) return race;

    const bracket = this.getDistanceBracket(rcDist);

    const rows = await this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .select('rr.hrNo', 'hrNo')
      .addSelect('rr.ordInt', 'ordInt')
      .addSelect('r.rcDist', 'rcDist')
      .where('rr.hrNo IN (:...hrNos)', { hrNos })
      .andWhere('r.rcDate < :beforeRcDate', { beforeRcDate })
      .andWhere('rr.ordInt IS NOT NULL')
      .orderBy('r.rcDate', 'DESC')
      .limit(2000)
      .getRawMany<{ hrNo: string; ordInt: number; rcDist: string }>();

    const byHorse = new Map<
      string,
      { total: number; wins: number; places: number }
    >();
    for (const r of rows) {
      const dist = parseInt(r.rcDist ?? '0', 10);
      if (this.getDistanceBracket(dist) !== bracket) continue;
      const stats = byHorse.get(r.hrNo) ?? { total: 0, wins: 0, places: 0 };
      stats.total++;
      if (r.ordInt === 1) stats.wins++;
      if (r.ordInt <= 3) stats.places++;
      byHorse.set(r.hrNo, stats);
    }

    const enrichedEntries = entries.map((e) => {
      const stats = byHorse.get(e.hrNo);
      if (!stats || stats.total === 0) return e;
      return {
        ...e,
        distWinRate: Math.round((stats.wins / stats.total) * 10000) / 100,
        distPlaceRate: Math.round((stats.places / stats.total) * 10000) / 100,
        distRaceCount: stats.total,
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  /** Map distance to bracket: sprint/mile/middle/long */
  private getDistanceBracket(dist: number): string {
    if (dist <= 1300) return 'sprint';
    if (dist <= 1600) return 'mile';
    if (dist <= 1900) return 'middle';
    return 'long';
  }

  /**
   * Enrich entries with class change detection.
   * Compares the current race rank with the horse's most recent race rank.
   */
  private async enrichEntriesWithClassChange(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;
    const currentRank = race.rank ?? '';
    if (!currentRank) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    if (!hrNos.length) return race;
    const beforeRcDate = race.rcDate ?? '';
    if (!beforeRcDate) return race;

    const lastRaceRanks = await this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .select('rr.hrNo', 'hrNo')
      .addSelect('r.rank', 'rank')
      .addSelect('r.rcDate', 'rcDate')
      .where('rr.hrNo IN (:...hrNos)', { hrNos })
      .andWhere('r.rcDate < :beforeRcDate', { beforeRcDate })
      .andWhere('r.rank IS NOT NULL')
      .orderBy('r.rcDate', 'DESC')
      .limit(Math.max(500, hrNos.length * 10))
      .getRawMany<{ hrNo: string; rank: string; rcDate: string }>();

    // Get most recent rank per horse
    const byHorse = new Map<string, string>();
    for (const r of lastRaceRanks) {
      if (!byHorse.has(r.hrNo)) byHorse.set(r.hrNo, r.rank);
    }

    const currentLevel = this.rankToLevel(currentRank);
    const enrichedEntries = entries.map((e) => {
      const prevRank = byHorse.get(e.hrNo);
      if (!prevRank) return e;
      const prevLevel = this.rankToLevel(prevRank);
      if (currentLevel === 0 || prevLevel === 0) return e;
      const diff = currentLevel - prevLevel;
      const classChange = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
      return { ...e, classChange, classChangeLevel: diff };
    });

    return { ...race, entries: enrichedEntries };
  }

  /**
   * Convert Korean race rank to numeric level.
   * Higher number = higher class. 0 = unknown.
   */
  private rankToLevel(rank: string): number {
    const r = rank.trim();
    // Korean class hierarchy
    if (/국제|국1/i.test(r)) return 7;
    if (/국2/i.test(r)) return 6;
    if (/국3/i.test(r)) return 5;
    if (/국4/i.test(r)) return 4;
    if (/국5/i.test(r)) return 3;
    if (/국6/i.test(r)) return 2;
    if (/일반|비등급/i.test(r)) return 1;
    // Numeric grades (1급~6급) — 1급 is highest
    const numMatch = r.match(/(\d+)급/);
    if (numMatch) return Math.max(0, 8 - parseInt(numMatch[1]!, 10));
    return 0;
  }

  /**
   * Enrich entries with structured training metrics from the trainings table.
   * Queries recent 14 days of training sessions for each horse.
   */
  private async enrichEntriesWithTrainingMetrics(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    if (!hrNos.length) return race;
    const raceDate = race.rcDate ?? '';
    if (!raceDate) return race;

    const raceDateObj = this.parseYyyymmddToDate(raceDate);
    if (!raceDateObj) return race;
    const fourteenDaysAgo = new Date(raceDateObj.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgoStr = this.dateToYyyymmdd(fourteenDaysAgo);

    const trainings = await this.trainingRepo
      .createQueryBuilder('t')
      .select(['t.horseNo', 't.trDate', 't.intensity', 't.trContent'])
      .where('t.horseNo IN (:...hrNos)', { hrNos })
      .andWhere('t.trDate >= :from', { from: fourteenDaysAgoStr })
      .andWhere('t.trDate <= :to', { to: raceDate })
      .orderBy('t.trDate', 'DESC')
      .getMany();

    const byHorse = new Map<string, typeof trainings>();
    for (const t of trainings) {
      const arr = byHorse.get(t.horseNo) ?? [];
      arr.push(t);
      byHorse.set(t.horseNo, arr);
    }

    const enrichedEntries = entries.map((e) => {
      const sessions = byHorse.get(e.hrNo);
      if (!sessions?.length) return e;

      const sessionCount = sessions.length;
      const highIntensityCount = sessions.filter((s) =>
        /강|상|고/.test(String(s.intensity ?? s.trContent ?? '')),
      ).length;

      const lastTrainingDate = sessions[0]?.trDate;
      let daysSinceLastTraining: number | null = null;
      if (lastTrainingDate && raceDateObj) {
        const lastDate = this.parseYyyymmddToDate(lastTrainingDate);
        if (lastDate) {
          daysSinceLastTraining = Math.round(
            (raceDateObj.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
          );
        }
      }

      const avgSessionsPerWeek = Math.round((sessionCount / 2) * 100) / 100; // 14 days = 2 weeks

      return {
        ...e,
        trainingMetrics: {
          sessionCount,
          highIntensityCount,
          daysSinceLastTraining,
          avgSessionsPerWeek,
        },
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  /**
   * Detect same-day multi-race fatigue.
   * If a horse has already run in earlier races today, add fatigue fields.
   */
  private async enrichEntriesWithSameDayFatigue(
    race: RaceForPython,
  ): Promise<RaceForPython> {
    const entries = race.entries ?? [];
    if (!entries.length) return race;
    const rcDate = race.rcDate ?? '';
    const meet = race.meet ?? '';
    const currentRcNo = parseInt(race.rcNo ?? '0', 10);
    if (!rcDate || !meet || currentRcNo <= 1) return race;

    const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
    if (!hrNos.length) return race;

    // Find all earlier races on the same date + meet that these horses appeared in
    const earlierEntries = await this.entryRepo
      .createQueryBuilder('e')
      .innerJoin('e.race', 'r')
      .select(['e.hrNo', 'r.rcNo', 'r.stTime'])
      .where('r.rcDate = :rcDate', { rcDate })
      .andWhere('r.meet = :meet', { meet })
      .andWhere('CAST(r.rcNo AS integer) < :currentRcNo', { currentRcNo })
      .andWhere('e.hrNo IN (:...hrNos)', { hrNos })
      .orderBy('CAST(r.rcNo AS integer)', 'ASC')
      .getRawMany();

    if (!earlierEntries.length) return race;

    // Group by hrNo: count + latest stTime
    const byHorse = new Map<string, { count: number; lastStTime: string | null }>();
    for (const row of earlierEntries) {
      const hrNo = row.e_hrNo ?? row.hrNo;
      const stTime = row.r_stTime ?? row.stTime ?? null;
      const cur = byHorse.get(hrNo) ?? { count: 0, lastStTime: null };
      cur.count += 1;
      cur.lastStTime = stTime; // sorted ASC, last iteration = latest earlier race
      byHorse.set(hrNo, cur);
    }

    // Parse stTime "HH:mm" to minutes from midnight
    const parseTime = (t: string | null): number | null => {
      if (!t || !t.includes(':')) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const currentStMinutes = parseTime(race.stTime as string | null ?? null);

    const enrichedEntries = entries.map((e) => {
      const info = byHorse.get(e.hrNo);
      if (!info) return e;

      let hoursSinceLastSameDayRace: number | null = null;
      if (currentStMinutes != null) {
        const lastMinutes = parseTime(info.lastStTime);
        if (lastMinutes != null && currentStMinutes > lastMinutes) {
          hoursSinceLastSameDayRace = Math.round(
            ((currentStMinutes - lastMinutes) / 60) * 10,
          ) / 10;
        }
      }

      return {
        ...e,
        sameDayRacesBefore: info.count,
        hoursSinceLastSameDayRace,
      };
    });

    return { ...race, entries: enrichedEntries };
  }

  private dateToYyyymmdd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  private summarizeTraining(entry: RaceEntryForAnalysis): string | undefined {
    const trainings = entry.trainings;
    const trainingData = entry.trainingData;
    if (trainingData && typeof trainingData === 'object') {
      const arr = Array.isArray(trainingData) ? trainingData : [trainingData];
      if (arr.length) {
        return `최근 ${arr.length}회 훈련 (${JSON.stringify(arr.slice(0, 3))})`;
      }
    }
    if (trainings?.length) {
      const recent = trainings.slice(0, 5);
      const strong = recent.filter((t) =>
        /강|상|고/.test(String(t.intensity ?? t.trContent ?? '')),
      );
      const summary = strong.length
        ? `최근 ${recent.length}회 훈련 중 강도 높은 ${strong.length}회`
        : `최근 ${recent.length}회 훈련`;
      return summary;
    }
    return undefined;
  }

  /**
   * 구간별 성적(선행마/추입마) 조회. RaceEntry.sectionalStats(API37_1) 우선 사용, 없으면
   * RaceResult.sectionalTimes 기반 fallback.
   */
  private async getSectionalAnalysisByHorse(
    race: RaceForPython,
  ): Promise<Record<string, { tag: string; s1f?: number; g1f?: number }>> {
    const entries = race.entries ?? [];
    const hrNos = entries.map((e) => e.hrNo).filter(Boolean);
    if (!hrNos.length) return {};

    const out: Record<string, { tag: string; s1f?: number; g1f?: number }> = {};

    // 1. RaceEntry.sectionalStats (API37_1) 우선
    for (const e of entries) {
      const st = e.sectionalStats;
      if (!st || typeof st !== 'object') continue;
      const obj = st as Record<string, unknown>;
      const s1f =
        this.parseSectionalTime(
          obj.s1fAvg ?? obj['s1f_avg'] ?? obj.S1F ?? obj.seS1fAccTime,
        ) ?? null;
      const g1f =
        this.parseSectionalTime(
          obj.g1fAvg ?? obj['g1f_avg'] ?? obj.G1F ?? obj.seG1fAccTime,
        ) ?? null;
      if (s1f == null && g1f == null) continue;
      let tag = '미분류';
      if (s1f != null && g1f != null) {
        tag =
          s1f < 13.5
            ? '선행마(초반 빠름)'
            : g1f < 12.5
              ? '추입마(막판 스퍼트)'
              : '중간마';
      } else if (s1f != null && s1f < 13.5) {
        tag = '선행마';
      } else if (g1f != null && g1f < 12.5) {
        tag = '추입마';
      }
      out[e.hrNo] = { tag, s1f: s1f ?? undefined, g1f: g1f ?? undefined };
    }

    // 2. sectionalStats 없는 hrNo는 RaceResult fallback
    const covered = new Set(Object.keys(out));
    const hrNosWithout = hrNos.filter((h) => !covered.has(h));
    if (hrNosWithout.length === 0) return out;

    const rcDateLt = race.rcDate ?? '';
    const meetVal = race.meet ?? undefined;
    const rrQb = this.resultRepo
      .createQueryBuilder('rr')
      .innerJoin('rr.race', 'r')
      .select('rr.hrNo', 'hrNo')
      .addSelect('rr.sectionalTimes', 'sectionalTimes')
      .where('rr.hrNo IN (:...hrNosWithout)', { hrNosWithout })
      .andWhere('rr.sectionalTimes IS NOT NULL')
      .andWhere('r.rcDate < :rcDateLt', { rcDateLt })
      .orderBy('rr.createdAt', 'DESC')
      .limit(200);
    if (meetVal) rrQb.andWhere('r.meet = :meetVal', { meetVal });
    const results = await rrQb.getRawMany<{
      hrNo: string;
      sectionalTimes: unknown;
    }>();
    const byHorse: Record<
      string,
      { s1fSum: number; g1fSum: number; s1fN: number; g1fN: number }
    > = {};
    for (const r of results) {
      const st = r.sectionalTimes as Record<string, unknown> | null;
      if (!st || typeof st !== 'object') continue;
      const s1f = this.parseSectionalTime(st.s1f ?? st.S1F ?? st.seS1fAccTime);
      const g1f = this.parseSectionalTime(st.g1f ?? st.G1F ?? st.seG1fAccTime);
      if (s1f == null && g1f == null) continue;
      const key = r.hrNo;
      if (!byHorse[key])
        byHorse[key] = { s1fSum: 0, g1fSum: 0, s1fN: 0, g1fN: 0 };
      if (s1f != null) {
        byHorse[key].s1fSum += s1f;
        byHorse[key].s1fN += 1;
      }
      if (g1f != null) {
        byHorse[key].g1fSum += g1f;
        byHorse[key].g1fN += 1;
      }
    }
    for (const [hrNo, data] of Object.entries(byHorse)) {
      const n = data.s1fN + data.g1fN;
      if (n < 2) continue;
      const avgS1f = data.s1fN > 0 ? data.s1fSum / data.s1fN : null;
      const avgG1f = data.g1fN > 0 ? data.g1fSum / data.g1fN : null;
      let tag = '미분류';
      if (avgS1f != null && avgG1f != null) {
        tag =
          avgS1f < 13.5
            ? '선행마(초반 빠름)'
            : avgG1f < 12.5
              ? '추입마(막판 스퍼트)'
              : '중간마';
      } else if (avgS1f != null && avgS1f < 13.5) {
        tag = '선행마';
      } else if (avgG1f != null && avgG1f < 12.5) {
        tag = '추입마';
      }
      out[hrNo] = {
        tag,
        s1f: avgS1f ?? undefined,
        g1f: avgG1f ?? undefined,
      };
    }
    return out;
  }

  private parseSectionalTime(val: unknown): number | null {
    if (val == null) return null;
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /**
   * softmax 승률 확률(%) — Python horse score + jockey score 통합 후 적용
   */
  /**
   * Computes a short hash of the entry sheet used as a prediction cache key.
   * Hashes: hrNo, jkNo, chulNo, wgBudam, rating — sorted by hrNo.
   * If this hash matches an existing COMPLETED prediction, Gemini is skipped.
   */
  private computeEntriesHash(
    entries: Array<{
      hrNo?: string | null;
      jkNo?: string | null;
      chulNo?: string | number | null;
      wgBudam?: number | null;
      rating?: number | null;
    }>,
  ): string {
    return computeEntriesHashUtil(entries);
  }

  /**
   * Applies horse+jockey score combination and optional market-odds blending to the
   * Python horseScoreResult array, then recomputes softmax winProb.
   * This ensures the winProb stored in analysisData.horseScoreResult is consistent
   * with the wp values sent to Gemini in constructPrompt.
   *
   * Blend formula (when oddsByHrNo is available):
   *   adjustedScore = 0.8 × (hScore×wH + jScore×wJ) + 0.2 × oddsImplied×100
   * When no odds data, applies only the horse+jockey combination.
   * Returns a new array; does not mutate input.
   */
  private applyOddsBlendToHorseScores(
    horseScores: HorseAnalysisItem[],
    jockeyAnalysis: {
      entriesWithScores?: Array<{
        hrNo?: string;
        hrName: string;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
    } | null,
    oddsByHrNo?: Record<string, number>,
  ): HorseAnalysisItem[] {
    if (!horseScores.length) return horseScores;

    const wH = jockeyAnalysis?.weightRatio?.horse ?? 0.7;
    const wJ = jockeyAnalysis?.weightRatio?.jockey ?? 0.3;
    const jockeyMap = new Map<string, number>();
    for (const x of jockeyAnalysis?.entriesWithScores ?? []) {
      const key = x.hrNo ?? x.hrName;
      if (key) jockeyMap.set(key, x.jockeyScore);
    }

    // Combine horse + jockey scores
    const combinedScores = horseScores.map((hs) => {
      const hrNo = String(hs.hrNo ?? '');
      const jScore = jockeyMap.get(hrNo) ?? jockeyMap.get(hs.hrName ?? '') ?? 0;
      return Math.round((((hs.score ?? 50) * wH + jScore * wJ) * 100)) / 100;
    });

    // Blend with odds-implied probability when available
    const hasOdds = oddsByHrNo && Object.keys(oddsByHrNo).length > 0;
    const ODDS_WEIGHT = 0.2;
    let blendedScores = combinedScores;
    const oddsImpliedByIdx: number[] = horseScores.map(() => 0);

    if (hasOdds) {
      const invOdds = horseScores.map((hs) => {
        const w = oddsByHrNo![String(hs.hrNo ?? '')];
        return w != null && w > 0 ? 1 / w : 0;
      });
      const sumInv = invOdds.reduce((s, v) => s + v, 0);
      if (sumInv > 0) {
        blendedScores = combinedScores.map((cs, i) => {
          if (invOdds[i]! <= 0) return cs;
          const impliedPct = (invOdds[i]! / sumInv) * 100;
          oddsImpliedByIdx[i] = Math.round(impliedPct * 100) / 100;
          return Math.round(((1 - ODDS_WEIGHT) * cs + ODDS_WEIGHT * impliedPct) * 100) / 100;
        });
      }
    }

    const probs = this.computeWinProbabilities(blendedScores);

    return horseScores.map((hs, i) => {
      const patched: HorseAnalysisItem & { oddsImplied?: number } = {
        ...hs,
        winProb: probs[i] ?? hs.winProb,
      };
      if (hasOdds && oddsImpliedByIdx[i]! > 0) {
        patched.oddsImplied = oddsImpliedByIdx[i];
      }
      return patched;
    });
  }

  private computeWinProbabilities(scores: number[]): number[] {
    return computeWinProbabilitiesUtil(scores);
  }

  private constructPrompt(
    race: RaceForPython,
    horseAnalysis: HorseAnalysisItem[] | unknown,
    jockeyAnalysis: {
      entriesWithScores?: Array<{
        hrNo?: string;
        hrName: string;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: {
        hrName: string;
        jkName: string;
        jockeyScore: number;
      } | null;
    } | null,
    _sectionalByHorse: Record<
      string,
      { tag: string; s1f?: number; g1f?: number }
    > = {},
    cascadeFallRisk?: number,
    realtime?: boolean,
  ): string {
    const horseScores: HorseAnalysisItem[] = Array.isArray(horseAnalysis)
      ? horseAnalysis
      : [];
    const wH = jockeyAnalysis?.weightRatio?.horse ?? 0.7;
    const wJ = jockeyAnalysis?.weightRatio?.jockey ?? 0.3;
    const jockeyMap = new Map<string, number>();
    for (const x of jockeyAnalysis?.entriesWithScores || []) {
      const key = x.hrNo ?? x.hrName;
      if (key) jockeyMap.set(key, x.jockeyScore);
    }

    const entryMap = new Map<string, RaceEntryForAnalysis>();
    for (const e of race.entries || []) {
      entryMap.set(e.hrNo, e);
    }

    // finalScore(말+기수 통합) 산출 → optional blend with odds-implied probability → softmax 승률
    const compactEntries: Array<Record<string, unknown>> = [];
    const finalScores: number[] = [];
    const oddsByHrNo = (
      race as RaceForPython & { oddsByHrNo?: Record<string, number> }
    ).oddsByHrNo;
    const ODDS_WEIGHT = 0.2; // 20% weight to market odds when reflecting in score

    for (const hs of horseScores) {
      const hrNo = String(hs.hrNo);
      const jScore = jockeyMap.get(hrNo) ?? jockeyMap.get(hs.hrName ?? '') ?? 0;
      const hScore = hs.score ?? 50;
      const finalScore = Math.round((hScore * wH + jScore * wJ) * 100) / 100;
      finalScores.push(finalScore);
    }

    // Reflect odds in score when available (blend model score with market-implied probability; only for horses with odds)
    if (oddsByHrNo && Object.keys(oddsByHrNo).length > 0) {
      const implied: number[] = [];
      let sumInv = 0;
      for (const hs of horseScores) {
        const hrNo = String(hs.hrNo);
        const w = oddsByHrNo[hrNo];
        if (w != null && w > 0) {
          const inv = 1 / w;
          implied.push(inv);
          sumInv += inv;
        } else {
          implied.push(0);
        }
      }
      if (sumInv > 0) {
        for (let i = 0; i < finalScores.length; i++) {
          if (implied[i]! <= 0) continue;
          const impliedProbScaled = (implied[i]! / sumInv) * 100;
          finalScores[i] =
            Math.round(
              ((1 - ODDS_WEIGHT) * finalScores[i]! +
                ODDS_WEIGHT * impliedProbScaled) *
                100,
            ) / 100;
        }
      }
    }

    for (let i = 0; i < horseScores.length; i++) {
      const hs = horseScores[i]!;
      const hrNo = String(hs.hrNo);
      const entry = entryMap.get(hrNo);
      const jScore = jockeyMap.get(hrNo) ?? jockeyMap.get(hs.hrName ?? '') ?? 0;
      const finalScore = finalScores[i] ?? 50;
      const compact: Record<string, unknown> = {
        n: hs.chulNo ?? hrNo,
        h: hs.hrName ?? entry?.hrName ?? '',
        j: entry?.jkName ?? '',
        fs: finalScore,
        hs: hs.score ?? 50,
        js: Math.round(jScore * 100) / 100,
      };

      if (hs.sub) {
        compact.sub = [
          hs.sub.rat ?? 0,
          hs.sub.frm ?? 0,
          hs.sub.cnd ?? 0,
          hs.sub.exp ?? 0,
          hs.sub.trn ?? 0,
          hs.sub.suit ?? 0,
          hs.sub.jky ?? 0,
          hs.sub.rest ?? 0,
          hs.sub.dist ?? 0,
          hs.sub.cls ?? 0,
          hs.sub.trng ?? 0,
          hs.sub.sdf ?? 0,
        ];
      }
      if (entry?.rating != null) compact.r = entry.rating;
      if (entry?.horseWeight) compact.wg = entry.horseWeight;
      if (hs.recentRanks?.length) compact.rk = hs.recentRanks;
      if (hs.risk && hs.risk >= 15) compact.risk = hs.risk;
      if (hs.tags?.length) compact.t = hs.tags;

      compactEntries.push(compact);
    }

    const probs = this.computeWinProbabilities(finalScores);
    for (let i = 0; i < compactEntries.length; i++) {
      if (probs[i] != null) compactEntries[i].wp = probs[i];
    }

    const raceCtx: Record<string, unknown> = {
      meet: race.meetName ?? race.meet,
      date: race.rcDate,
      no: race.rcNo,
      dist: race.rcDist,
      rank: race.rank,
      weather: race.weather ?? '미상',
      track: race.track ?? '미상',
    };
    if (cascadeFallRisk != null && cascadeFallRisk >= 10) {
      raceCtx.cascade = cascadeFallRisk;
    }

    const topJ = jockeyAnalysis?.topPickByJockey;
    const weightH = Math.round(wH * 100);
    const weightJ = Math.round(wJ * 100);

    const realtimeSection = realtime
      ? `
## 실시간 분석 (개별예측)
이 분석은 경주 직전 최신 KRA 데이터를 반영한 실시간 개별예측입니다.
- wg 필드는 당일 마체중(kg, 증감 포함). 체중 급변(-10kg이상 감소 또는 +8kg이상 증가)은 컨디션 이상 신호.
- 날씨·주로상태는 당일 실시간 기상 반영. 우천시 습주로 경험마 우선 평가.
- 배당률이 있으면 시장 평가와 모델 평가의 괴리를 분석해 저평가마(가치마) 발굴.
- 종합예측보다 더 깊고 구체적인 분석을 제공할 것. analysis는 8~12문장으로 상세하게.
`
      : '';

    return `한국경마 AI 예측분석가. Python 통계분석(정규화 0~100) + 주관적 전문가 시각으로 승부예측. 데이터 없으면 "미확인".
가중치: 말${weightH}/기수${weightJ}${topJ ? ` | 기수1위:${topJ.hrName}(${topJ.jkName})` : ''}

## 경주
${JSON.stringify(raceCtx)}

## 출전마 (fs=통합점수,wp=승률%,hs=말점수,js=기수점수,sub=[레이팅,폼,컨디션,경험,조교사,적합도,기수,휴식,거리,등급,조교,당일피로],r=레이팅,rk=최근착순,risk=낙마리스크,t=태그,wg=마체중)
${JSON.stringify(compactEntries)}
${realtimeSection}
## 분석 방침
- 숫자 데이터만으로 판단하지 말고, 경마 전문가로서 주관적·정성적 분석을 반드시 포함할 것.
- 고려 요소: 기수-마필 궁합, 경주 페이스 전개(선행마 많으면 추입마 유리 등), 주로 바이어스(내측/외측 유불리), 날씨·기온 변화가 특정 마필에 미치는 영향, 마필 기질·성격(신경질적 여부, 좌회전/우회전 선호).
- 당일 다경주 출전마(sdf 태그)는 체중감소·피로 누적으로 후반경주 성적 저하 가능성을 반영.
- 클래스 승급마는 상위 경쟁력 부족 가능성, 강등마는 상대적 우위 가능성을 주관적으로 평가.
- 승식 예측 시 단순 점수 순위가 아닌, 레이스 흐름·변수·이변 가능성을 고려한 조합 추천.

## 규칙
- reason/strengths/weaknesses: sub 12요소+risk 수치 근거 + 주관적 판단 포함. 같은 표현 금지.
- risk30+→weaknesses에 낙마위험 언급. cascade(경주정보)20+→analysis에 연쇄낙마 가능성.
- strengths: 강점 1~2개(데이터+주관). weaknesses: 약점/리스크 1개.
- analysis: 날씨·주로·거리·페이스전개·각질·기수전략·이변가능성 등 전문가 시각 ${realtime ? '8~12' : '6~10'}문장. 숫자 나열 금지, 서사적 분석.
- preview: 핵심 승부 포인트 2~3문장(단승식 1등예상마만, 다른승식 금지).
- 7승식 모두 출력. hrNo=n값.

## 출력(JSON만)
{"scores":{"horseScores":[{"hrNo":"","hrName":"","score":0,"reason":"","strengths":[""],"weaknesses":[""],"confidence":""}]},"betTypePredictions":{"SINGLE":{"hrNo":"","reason":""},"PLACE":{"hrNo":"","reason":""},"QUINELLA":{"hrNos":["",""],"reason":""},"EXACTA":{"first":"","second":"","reason":""},"QUINELLA_PLACE":{"hrNos":["",""],"reason":""},"TRIFECTA":{"hrNos":["","",""],"reason":""},"TRIPLE":{"first":"","second":"","third":"","reason":""}},"analysis":"","preview":""}`;
  }

  private parseGeminiResponse(text: string): GeminiPredictionJson {
    return parseGeminiResponseText(text) as GeminiPredictionJson;
  }

  /**
   * horseScores에서 승식별 기본 조합 유도 (2마리/3마리 승식은 3개 조합).
   * 정렬은 score 기준만 사용. 점수 반영(배당 등)은 상단 finalScore/blend 로직에서 처리.
   */
  private deriveBetTypePredictionsFromHorseScores(
    horseScores: Array<{
      hrNo?: string;
      chulNo?: string;
      score?: number;
      winProb?: number;
    }>,
  ): BetTypePredictions {
    const id = (h: { hrNo?: string; chulNo?: string }) =>
      (h?.hrNo ?? h?.chulNo ?? '').toString().trim();
    const sorted = [...horseScores]
      .filter((h) => id(h))
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
    const ids = sorted.map((h) => id(h!)).filter(Boolean);
    const [a, b, c, d] = ids;
    if (!a) return {};

    const pairCombos =
      b && c
        ? [
            { hrNos: [a, b] as [string, string] },
            { hrNos: [a, c] as [string, string] },
            b && c
              ? { hrNos: [b, c] as [string, string] }
              : { hrNos: [a, b] as [string, string] },
          ].slice(0, 3)
        : b
          ? [{ hrNos: [a, b] as [string, string] }]
          : [];

    const exactaCombos =
      b && c
        ? [
            { first: a, second: b },
            { first: a, second: c },
            { first: b, second: a },
          ]
        : b
          ? [{ first: a, second: b }]
          : [];

    const tripleCombos =
      a && b && c && d
        ? [
            { hrNos: [a, b, c] as [string, string, string] },
            { hrNos: [a, b, d] as [string, string, string] },
            { hrNos: [a, c, d] as [string, string, string] },
          ]
        : a && b && c
          ? [{ hrNos: [a, b, c] as [string, string, string] }]
          : [];

    const tripleExactCombos =
      a && b && c && d
        ? [
            { first: a, second: b, third: c },
            { first: a, second: b, third: d },
            { first: a, second: c, third: b },
          ]
        : a && b && c
          ? [{ first: a, second: b, third: c }]
          : [];

    return {
      SINGLE: { hrNo: a, reason: '1등 예상' },
      PLACE: { hrNo: a, reason: '1~3등 안정' },
      QUINELLA:
        pairCombos.length > 0
          ? { combinations: pairCombos, reason: '1·2등 조합' }
          : undefined,
      EXACTA:
        exactaCombos.length > 0
          ? { combinations: exactaCombos, reason: '1→2등 순서' }
          : undefined,
      QUINELLA_PLACE:
        pairCombos.length > 0
          ? {
              combinations: pairCombos.map((p) => ({ ...p })),
              reason: '3등 이내 2마리',
            }
          : undefined,
      TRIFECTA:
        tripleCombos.length > 0
          ? { combinations: tripleCombos, reason: '1·2·3등 조합' }
          : undefined,
      TRIPLE:
        tripleExactCombos.length > 0
          ? { combinations: tripleExactCombos, reason: '1→2→3등 순서' }
          : undefined,
    };
  }

  /**
   * Gemini betTypePredictions + horseScores 기반 보강 → 7개 승식 모두 포함
   */
  private mergeBetTypePredictions(
    fromGemini: BetTypePredictions | undefined,
    fromHorseScores: BetTypePredictions,
  ): BetTypePredictions {
    return {
      SINGLE: fromGemini?.SINGLE ?? fromHorseScores.SINGLE,
      PLACE: fromGemini?.PLACE ?? fromHorseScores.PLACE,
      QUINELLA: fromGemini?.QUINELLA ?? fromHorseScores.QUINELLA,
      EXACTA: fromGemini?.EXACTA ?? fromHorseScores.EXACTA,
      QUINELLA_PLACE:
        fromGemini?.QUINELLA_PLACE ?? fromHorseScores.QUINELLA_PLACE,
      TRIFECTA: fromGemini?.TRIFECTA ?? fromHorseScores.TRIFECTA,
      TRIPLE: fromGemini?.TRIPLE ?? fromHorseScores.TRIPLE,
    };
  }

  /**
   * chulNo(출전번호) 또는 hrNo → hrNo 정규화 (내부 식별용)
   * 정확도 계산·일관된 표시를 위해 entries 기반 매핑
   */
  private resolveToHrNo(
    value: string | undefined,
    entries: Array<{ hrNo?: string; chulNo?: string }>,
  ): string | undefined {
    if (!value || typeof value !== 'string') return value;
    const v = String(value).trim();
    const e = entries.find(
      (x) =>
        String(x.hrNo || '').trim() === v ||
        String(x.chulNo || '').trim() === v,
    );
    return e?.hrNo ? String(e.hrNo).trim() : v;
  }

  /**
   * betTypePredictions 내 모든 마식별자를 hrNo로 정규화
   */
  private normalizeBetTypePredictionsToHrNo(
    pred: BetTypePredictions,
    entries: Array<{ hrNo?: string; chulNo?: string }>,
  ): BetTypePredictions {
    const r = (v: string | undefined) => this.resolveToHrNo(v, entries);
    const out: BetTypePredictions = {};
    if (pred.SINGLE?.hrNo)
      out.SINGLE = {
        hrNo: r(pred.SINGLE.hrNo) ?? pred.SINGLE.hrNo,
        reason: pred.SINGLE.reason,
      };
    if (pred.PLACE?.hrNo)
      out.PLACE = {
        hrNo: r(pred.PLACE.hrNo) ?? pred.PLACE.hrNo,
        reason: pred.PLACE.reason,
      };
    const normPair = (p: { hrNos: [string, string] }) => ({
      hrNos: [r(p.hrNos[0]) ?? p.hrNos[0], r(p.hrNos[1]) ?? p.hrNos[1]] as [
        string,
        string,
      ],
    });
    const normExacta = (p: { first: string; second: string }) => ({
      first: r(p.first) ?? p.first,
      second: r(p.second) ?? p.second,
    });
    const normTriple = (p: { hrNos: [string, string, string] }) => ({
      hrNos: [
        r(p.hrNos[0]) ?? p.hrNos[0],
        r(p.hrNos[1]) ?? p.hrNos[1],
        r(p.hrNos[2]) ?? p.hrNos[2],
      ] as [string, string, string],
    });
    const normTripleExact = (p: {
      first: string;
      second: string;
      third: string;
    }) => ({
      first: r(p.first) ?? p.first,
      second: r(p.second) ?? p.second,
      third: r(p.third) ?? p.third,
    });

    const q = pred.QUINELLA;
    if (q && 'combinations' in q && q.combinations.length) {
      out.QUINELLA = {
        combinations: q.combinations.map(normPair).slice(0, 3),
        reason: q.reason,
      };
    } else if (q && 'hrNos' in q) {
      out.QUINELLA = { combinations: [normPair(q)], reason: q.reason };
    }

    const ex = pred.EXACTA;
    if (ex && 'combinations' in ex && ex.combinations.length) {
      out.EXACTA = {
        combinations: ex.combinations.map(normExacta).slice(0, 3),
        reason: ex.reason,
      };
    } else if (ex && 'first' in ex && 'second' in ex) {
      out.EXACTA = { combinations: [normExacta(ex)], reason: ex.reason };
    }

    const qp = pred.QUINELLA_PLACE;
    if (qp && 'combinations' in qp && qp.combinations.length) {
      out.QUINELLA_PLACE = {
        combinations: qp.combinations.map(normPair).slice(0, 3),
        reason: qp.reason,
      };
    } else if (qp && 'hrNos' in qp) {
      out.QUINELLA_PLACE = { combinations: [normPair(qp)], reason: qp.reason };
    }

    const tr = pred.TRIFECTA;
    if (tr && 'combinations' in tr && tr.combinations.length) {
      out.TRIFECTA = {
        combinations: tr.combinations.map(normTriple).slice(0, 3),
        reason: tr.reason,
      };
    } else if (tr && 'hrNos' in tr) {
      out.TRIFECTA = { combinations: [normTriple(tr)], reason: tr.reason };
    }

    const tp = pred.TRIPLE;
    if (tp && 'combinations' in tp && tp.combinations.length) {
      out.TRIPLE = {
        combinations: tp.combinations.map(normTripleExact).slice(0, 3),
        reason: tp.reason,
      };
    } else if (tp && 'first' in tp && 'second' in tp && 'third' in tp) {
      out.TRIPLE = { combinations: [normTripleExact(tp)], reason: tp.reason };
    }
    return out;
  }

  /**
   * 예측 성공 시 DB에 저장할 scores 구조 생성
   * - horseScores: Gemini 결과 (chulNo→hrNo 정규화)
   * - betTypePredictions: 7개 승식 보강 + hrNo 정규화
   * - analysisData: Python·기수 분석 원본
   */
  private buildScoresForSave(
    geminiScores:
      | GeminiPredictionJson
      | {
          horseScores?: Array<{
            hrNo?: string;
            hrName?: string;
            score?: number;
            reason?: string;
          }>;
        }
      | undefined,
    horseScoreResult: unknown,
    jockeyAnalysis: {
      entriesWithScores?: Array<unknown>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: unknown;
    } | null,
    entries: Array<{ hrNo?: string; chulNo?: string }> = [],
  ): Record<string, unknown> {
    const base =
      geminiScores &&
      typeof geminiScores === 'object' &&
      !('error' in geminiScores)
        ? { ...geminiScores }
        : {};
    const gemi = base as GeminiPredictionJson & {
      horseScores?: Array<{
        hrNo?: string;
        hrName?: string;
        score?: number;
        reason?: string;
      }>;
    };
    const hsRaw = gemi.horseScores ?? gemi.scores?.horseScores ?? [];
    const safeHorseResult =
      Array.isArray(horseScoreResult) &&
      !horseScoreResult.some((x) => x && typeof x === 'object' && 'error' in x)
        ? horseScoreResult
        : [];

    // Python 결과를 절대 우선 (무조건 배열 반환하도록 보장됨)
    const hsSource =
      Array.isArray(safeHorseResult) && safeHorseResult.length > 0
        ? (safeHorseResult as Array<{
            hrNo?: string;
            chulNo?: string;
            score?: number;
          }>)
        : hsRaw;
    let derived = this.deriveBetTypePredictionsFromHorseScores(hsSource);

    // 7개 승식 무조건 채움 — 부족하면 entries로 보강
    const hasTrifecta =
      derived.TRIFECTA &&
      ('hrNos' in derived.TRIFECTA || 'combinations' in derived.TRIFECTA);
    const needFallback = !hasTrifecta || entries.length >= 3;
    if (needFallback && entries.length >= 3) {
      const fallbackHs = entries.slice(0, 6).map((e) => ({
        hrNo: e.hrNo ?? e.chulNo ?? '',
        chulNo: e.chulNo,
        score: 50,
      }));
      const fallback = this.deriveBetTypePredictionsFromHorseScores(fallbackHs);
      derived = {
        SINGLE: derived.SINGLE ?? fallback.SINGLE,
        PLACE: derived.PLACE ?? fallback.PLACE,
        QUINELLA: derived.QUINELLA ?? fallback.QUINELLA,
        EXACTA: derived.EXACTA ?? fallback.EXACTA,
        QUINELLA_PLACE: derived.QUINELLA_PLACE ?? fallback.QUINELLA_PLACE,
        TRIFECTA: derived.TRIFECTA ?? fallback.TRIFECTA,
        TRIPLE: derived.TRIPLE ?? fallback.TRIPLE,
      };
    }

    const mergedBetType = this.mergeBetTypePredictions(
      gemi.betTypePredictions,
      derived,
    );

    const normalizedBet = this.normalizeBetTypePredictionsToHrNo(
      mergedBetType,
      entries,
    );
    const hs = entries.length
      ? hsRaw.map((h) => {
          const rawId = (h.hrNo ?? (h as { chulNo?: string }).chulNo)
            ?.toString()
            .trim();
          const resolved = rawId
            ? (this.resolveToHrNo(rawId, entries) ?? rawId)
            : undefined;
          return { ...h, hrNo: resolved ?? h.hrNo };
        })
      : hsRaw;

    return {
      ...base,
      horseScores: hs,
      betTypePredictions: normalizedBet,
      analysisData: {
        horseScoreResult: safeHorseResult,
        jockeyAnalysis: jockeyAnalysis
          ? {
              entriesWithScores: jockeyAnalysis.entriesWithScores || [],
              weightRatio: jockeyAnalysis.weightRatio || {
                horse: 0.7,
                jockey: 0.3,
              },
              topPickByJockey: jockeyAnalysis.topPickByJockey ?? null,
            }
          : null,
      },
    };
  }
}
