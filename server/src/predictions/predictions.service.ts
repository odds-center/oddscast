import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sortRacesByNumericRcNo } from '../common/utils/race-sort';
import { meetToCode, toKraMeetName } from '../kra/constants';
import { isEligibleForAccuracy } from '../kra/ord-parser';
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

/** 세션 중 마지막으로 성공한 Gemini 모델 — 다음 요청에서 우선 시도 (404 낭비 방지) */
let lastWorkingGeminiModel: string | null = null;

@Injectable()
export class PredictionsService {
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
    const entries = await this.entryRepo.find({
      where: { raceId },
      order: { id: 'ASC' },
    });
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
    const results: Array<{ date: string; accuracy: number; count: number }> =
      [];
    for (let i = 6; i >= 0; i--) {
      const day = kst().subtract(i, 'day');
      const start = day.startOf('day').toDate();
      const end = day.endOf('day').toDate();
      const d = day.toDate();
      const dayPreds = await this.predictionRepo.find({
        where: { status: PredictionStatus.COMPLETED },
        select: ['accuracy', 'createdAt'],
        order: { createdAt: 'ASC' },
      });
      const dayPredsFiltered = dayPreds.filter(
        (p) => p.createdAt >= start && p.createdAt <= end && p.accuracy != null,
      );
      const count = dayPredsFiltered.length;
      const accuracy =
        count > 0
          ? dayPredsFiltered.reduce((s, p) => s + (p.accuracy ?? 0), 0) / count
          : 0;
      results.push({
        date: kst(d).format('YYYY-MM-DD'),
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
      console.warn(
        `[PredictionsService] Post-race summary failed for race ${raceId}:`,
        err instanceof Error ? err.message : String(err),
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
    const kstDateStr = new Date()
      .toLocaleString('en-CA', { timeZone: 'Asia/Seoul' })
      .slice(0, 10);
    const dayStart = new Date(`${kstDateStr}T00:00:00+09:00`);
    const dayEnd = new Date(`${kstDateStr}T23:59:59.999+09:00`);
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
      Array<{ hrNo: string; hrName: string }>
    >();
    if (raceIds.length > 0) {
      const entriesList = await this.entryRepo.find({
        where: { raceId: In(raceIds) },
        select: ['raceId', 'hrNo', 'hrName'],
      });
      for (const e of entriesList) {
        if (!entriesMap.has(e.raceId)) entriesMap.set(e.raceId, []);
        entriesMap.get(e.raceId)!.push({ hrNo: e.hrNo, hrName: e.hrName });
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

    const rows: Array<{
      raceId: string;
      meet: string;
      meetName?: string;
      rcNo: string;
      stTime?: string;
      rcDist?: string;
      rank?: string;
      entryCount?: number;
      entries?: Array<{ hrNo: string; hrName: string }>;
      predictions: Record<string, string[] | string>;
      horseNames: Record<string, string>;
      aiConsensus: string;
      consensusLabel?: string;
    }> = [];

    for (const race of races) {
      const pred = await this.predictionRepo.findOne({
        where: {
          raceId: (race as unknown as { id: number }).id,
          previewApproved: true,
          status: PredictionStatus.COMPLETED,
        },
        select: ['scores'],
        order: { createdAt: 'DESC' },
      });
      const scores =
        (
          pred?.scores as {
            horseScores?: Array<{ hrNo?: string; hrName?: string }>;
          } | null
        )?.horseScores ?? [];
      const top1 = scores[0]?.hrNo;
      const top2 = scores[1]?.hrNo;
      const consensus = top1 ?? '-';
      const consensusArr = top1 && top2 ? [top1, top2] : top1 ? [top1] : [];

      const horseNames: Record<string, string> = {};
      const entryList =
        (race as { entries?: Array<{ hrNo?: string; hrName?: string }> })
          .entries ?? [];
      for (const e of entryList) {
        if (e.hrNo && e.hrName) horseNames[e.hrNo] = e.hrName;
      }
      for (const s of scores) {
        if (
          s.hrNo &&
          (s as { hrName?: string }).hrName &&
          !horseNames[s.hrNo]
        ) {
          horseNames[s.hrNo] = (s as { hrName?: string }).hrName!;
        }
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
        })),
        predictions: {
          ai_consensus: consensusArr.length > 0 ? consensusArr : consensus,
          expert_1: top1 && top2 ? [top1, top2] : top1 ? [top1] : [],
        },
        horseNames,
        aiConsensus: consensus,
        consensusLabel: top1 ? '축' : undefined,
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

  async generatePrediction(raceId: number) {
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
    // 이전 성공 모델이 있으면 맨 앞에 배치 (404 스킵)
    if (
      lastWorkingGeminiModel &&
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
    // 3c. 조교사 승률/복승률 보강 — TrainerResult (API19_1)
    const raceWithTrainer =
      await this.enrichEntriesWithTrainerResults(raceWithFallHistory);
    // 3d. 구간별 태그(선행마/추입마) merge — Python calculate_score 입력용
    const raceWithSectional = this.enrichEntriesWithSectionalTag(
      raceWithTrainer,
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
      console.warn('Jockey analysis skipped:', (e as Error).message);
    }

    // 4. Construct Prompt (훈련 요약, 구간별 성적 태깅 포함)
    const prompt = this.constructPrompt(
      raceWithTrainer,
      horseScoreResult,
      jockeyAnalysis,
      sectionalByHorse,
      cascadeFallRisk,
    );

    // 5. Call Gemini (404 시 fallback 모델로 재시도)
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

        // 6. Parse and Save (예측 성공 시 관련 데이터 DB 저장)
        const predictionData = this.parseGeminiResponse(text);
        const geminiScores = predictionData?.scores ?? predictionData;

        const scoresToSave = this.buildScoresForSave(
          geminiScores,
          horseScoreResult,
          jockeyAnalysis,
          (race as { entries?: Array<{ hrNo?: string; chulNo?: string }> })
            .entries ?? [],
        );

        lastWorkingGeminiModel = modelName;

        // 새 예측 생성 (이전 예측 기록 유지 — update/delete 없음)
        const created = await this.predictionRepo.save(
          this.predictionRepo.create({
            raceId,
            scores: scoresToSave as Record<string, unknown>,
            analysis: predictionData?.analysis ?? '',
            preview: predictionData?.preview ?? '',
            status: PredictionStatus.COMPLETED,
            previewApproved: true,
          }),
        );

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
            console.warn(
              '[SmartAlert] notifyHighConfidencePrediction failed:',
              alertErr instanceof Error ? alertErr.message : alertErr,
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
          console.warn(
            `Gemini model "${modelName}" not found (404), trying next...`,
          );
          continue;
        }
        console.error(`Gemini generation failed (${modelName}):`, lastError);
        throw new Error(
          `Failed to generate prediction via Gemini: ${lastError.message}`,
        );
      }
    }
    throw new Error(
      `Failed to generate prediction: no usable model. Last error: ${lastError?.message ?? 'unknown'}`,
    );
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
              console.warn(
                `Python analysis fallback (code=${code}): ${errorString || parsed?.error || 'no valid output'}`,
              );
            }
          }
        } catch {
          horseScores = this.fallbackHorseScoresFromEntries(entries);
          console.warn(
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

    const enrichedEntries = entries.map((e) => {
      const ranks = byHorse.get(e.hrNo);
      if (!ranks?.length && e.recentRanks) return e;
      return { ...e, recentRanks: ranks ?? e.recentRanks };
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
  private computeWinProbabilities(scores: number[]): number[] {
    if (!scores.length) return [];
    const T = 15;
    const maxS = Math.max(...scores);
    const exps = scores.map((s) => Math.exp((s - maxS) / T));
    const total = exps.reduce((a, b) => a + b, 0);
    if (total === 0)
      return scores.map(() => Math.round((100 / scores.length) * 10) / 10);
    return exps.map((e) => Math.round((e / total) * 1000) / 10);
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
        ];
      }
      if (entry?.rating != null) compact.r = entry.rating;
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

    return `한국경마 AI 예측분석가. Python 통계분석(정규화 0~100) 기반 승부예측. 데이터 없으면 "미확인".
가중치: 말${weightH}/기수${weightJ}${topJ ? ` | 기수1위:${topJ.hrName}(${topJ.jkName})` : ''}

## 경주
${JSON.stringify(raceCtx)}

## 출전마 (fs=통합점수,wp=승률%,hs=말점수,js=기수점수,sub=[레이팅,폼,컨디션,경험,조교사,적합도],r=레이팅,rk=최근착순,risk=낙마리스크,t=태그)
${JSON.stringify(compactEntries)}

## 규칙
- reason/strengths/weaknesses: sub 6요소+js(기수)+risk 수치 근거. 같은 표현 금지.
- risk30+→weaknesses에 낙마위험 언급. cascade(경주정보)20+→analysis에 연쇄낙마 가능성.
- strengths: 강점 1~2개. weaknesses: 약점/리스크 1개.
- analysis: 날씨·주로·거리·후보·각질·변수 5~8문장. preview: 2~3문장(단승식 1등예상마만, 다른승식 금지).
- 7승식 모두 출력. hrNo=n값.

## 출력(JSON만)
{"scores":{"horseScores":[{"hrNo":"","hrName":"","score":0,"reason":"","strengths":[""],"weaknesses":[""],"confidence":""}]},"betTypePredictions":{"SINGLE":{"hrNo":"","reason":""},"PLACE":{"hrNo":"","reason":""},"QUINELLA":{"hrNos":["",""],"reason":""},"EXACTA":{"first":"","second":"","reason":""},"QUINELLA_PLACE":{"hrNos":["",""],"reason":""},"TRIFECTA":{"hrNos":["","",""],"reason":""},"TRIPLE":{"first":"","second":"","third":"","reason":""}},"analysis":"","preview":""}`;
  }

  private parseGeminiResponse(text: string): GeminiPredictionJson {
    let cleanText = text
      // Gemini 2.5 thinking 블록 제거
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    try {
      return JSON.parse(cleanText) as GeminiPredictionJson;
    } catch {
      try {
        // trailing comma 수정
        const fixed = cleanText.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(fixed) as GeminiPredictionJson;
      } catch {
        try {
          const { jsonrepair } = require('jsonrepair');
          const repaired = jsonrepair(cleanText) as string;
          return JSON.parse(repaired) as GeminiPredictionJson;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          throw new Error(
            `Gemini 응답 JSON 파싱 실패: ${msg}. 응답 앞 300자: ${cleanText.slice(0, 300)}...`,
          );
        }
      }
    }
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
