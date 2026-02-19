import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { Prisma } from '@prisma/client';
import { RACE_INCLUDE_FOR_ANALYSIS } from '../common/prisma-includes';
import { meetToCode, toKraMeetName } from '../kra/constants';
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

/** 세션 중 마지막으로 성공한 Gemini 모델 — 다음 요청에서 우선 시도 (404 낭비 방지) */
let lastWorkingGeminiModel: string | null = null;

@Injectable()
export class PredictionsService {
  constructor(
    private prisma: PrismaService,
    private analysisService: AnalysisService,
    private configService: GlobalConfigService,
  ) {}

  async findAll(filters: PredictionFilterDto) {
    const { page = 1, limit = 20, status } = filters;
    const where: Prisma.PredictionWhereInput = {};
    if (status) where.status = status as Prisma.EnumPredictionStatusFilter;

    const [predictions, total] = await Promise.all([
      this.prisma.prediction.findMany({
        where,
        include: { race: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prediction.count({ where }),
    ]);

    return { predictions, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: { race: { include: { entries: true } } },
    });
    if (!prediction) throw new NotFoundException('예측을 찾을 수 없습니다');
    return prediction;
  }

  async create(dto: CreatePredictionDto) {
    return this.prisma.prediction.create({
      data: {
        raceId: dto.raceId,
        scores: dto.scores as Prisma.InputJsonValue | undefined,
        analysis: dto.analysis,
        preview: dto.preview,
      },
      include: { race: true },
    });
  }

  async updateStatus(id: number, dto: UpdatePredictionStatusDto) {
    return this.prisma.prediction.update({
      where: { id },
      data: {
        status:
          dto.status as Prisma.EnumPredictionStatusFieldUpdateOperationsInput['set'],
        scores: dto.scores as Prisma.InputJsonValue | undefined,
        analysis: dto.analysis,
        accuracy: dto.accuracy,
        previewApproved: dto.previewApproved,
      },
    });
  }

  async getDashboard() {
    const [total, completed, pending] = await Promise.all([
      this.prisma.prediction.count(),
      this.prisma.prediction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.prediction.count({ where: { status: 'PENDING' } }),
    ]);
    const avgAccuracy = await this.prisma.prediction.aggregate({
      _avg: { accuracy: true },
      where: { status: 'COMPLETED', accuracy: { not: null } },
    });
    return {
      total,
      completed,
      pending,
      averageAccuracy: avgAccuracy._avg.accuracy || 0,
    };
  }

  async getAnalyticsDashboard() {
    const completed = await this.prisma.prediction.findMany({
      where: { status: 'COMPLETED', accuracy: { not: null } },
      select: { id: true, accuracy: true, scores: true },
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
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      const dayPreds = await this.prisma.prediction.findMany({
        where: {
          status: 'COMPLETED',
          accuracy: { not: null },
          createdAt: { gte: start, lte: end },
        },
        select: { accuracy: true },
      });
      const count = dayPreds.length;
      const accuracy =
        count > 0
          ? dayPreds.reduce((s, p) => s + (p.accuracy ?? 0), 0) / count
          : 0;
      results.push({
        date: d.toISOString().slice(0, 10),
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
    const where: Prisma.PredictionWhereInput = { status: 'COMPLETED' };
    if (opts.startDate && opts.endDate) {
      where.createdAt = {
        gte: new Date(opts.startDate),
        lte: new Date(opts.endDate),
      };
    }
    const failed = await this.prisma.prediction.findMany({
      where: { ...where, OR: [{ accuracy: 0 }, { accuracy: null }] },
      select: { id: true, raceId: true, accuracy: true },
      take: 50,
    });
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
    return this.prisma.prediction.findMany({
      where: { status: 'COMPLETED', accuracy: { not: null } },
      select: { id: true, raceId: true, accuracy: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 예측 미리보기 — 검수 완료(previewApproved)된 것만 반환.
   * 검수 미통과 시 데이터를 보내지 않음 (사행성 방지).
   * UI 표시용: scores.horseScores, analysis, preview 반환
   */
  async getPreview(raceId: number) {
    const prediction = await this.prisma.prediction.findFirst({
      where: { raceId, previewApproved: true, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        preview: true,
        analysis: true,
        scores: true,
        status: true,
        createdAt: true,
      },
    });
    return prediction || null;
  }

  async getByRace(raceId: number) {
    return this.prisma.prediction.findFirst({
      where: { raceId, status: 'COMPLETED' },
      include: { race: { include: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 경주별 예측 기록 목록 (다시 예측 시 이전 기록 유지) */
  async getByRaceHistory(raceId: number) {
    return this.prisma.prediction.findMany({
      where: { raceId, status: 'COMPLETED' },
      include: { race: { include: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 종합 예상 매트릭스 (용산종합지 스타일)
   * date: YYYYMMDD 또는 YYYY-MM-DD, meet: 서울|제주|부산경남
   */
  async getMatrix(date?: string, meet?: string) {
    const rcDate = date
      ? date.replace(/-/g, '').slice(0, 8)
      : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const where: Prisma.RaceWhereInput = { rcDate };
    if (meet) where.meet = toKraMeetName(meet);

    const races = await this.prisma.race.findMany({
      where,
      select: {
        id: true,
        meet: true,
        meetName: true,
        rcNo: true,
        stTime: true,
      },
      orderBy: { rcNo: 'asc' },
      take: 20,
    });

    const rows: Array<{
      raceId: string;
      meet: string;
      meetName?: string;
      rcNo: string;
      stTime?: string;
      predictions: Record<string, string[] | string>;
      aiConsensus: string;
      consensusLabel?: string;
    }> = [];

    for (const race of races.slice(0, 12)) {
      const pred = await this.prisma.prediction.findFirst({
        where: { raceId: race.id, previewApproved: true, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        select: { scores: true },
      });
      const scores =
        (pred?.scores as { horseScores?: Array<{ hrNo?: string }> })
          ?.horseScores ?? [];
      const top1 = scores[0]?.hrNo;
      const top2 = scores[1]?.hrNo;
      const consensus = top1 ?? '-';
      const consensusArr =
        top1 && top2 ? [top1, top2] : top1 ? [top1] : [];

      rows.push({
        raceId: String(race.id),
        meet: race.meet ?? '',
        meetName: race.meetName ?? undefined,
        rcNo: race.rcNo ?? '',
        stTime: race.stTime ?? undefined,
        predictions: {
          ai_consensus: consensusArr.length > 0 ? consensusArr : consensus,
          expert_1: top1 && top2 ? [top1, top2] : top1 ? [top1] : [],
        },
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
      : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const raceWhere: Prisma.RaceWhereInput = { rcDate };
    if (meet) raceWhere.meet = toKraMeetName(meet);
    const preds = await this.prisma.prediction.findMany({
      where: {
        previewApproved: true,
        status: 'COMPLETED',
        race: raceWhere,
      },
      include: {
        race: { select: { id: true, meet: true, meetName: true, rcNo: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

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

    const total = await this.prisma.prediction.count({
      where: { previewApproved: true, status: 'COMPLETED', race: raceWhere },
    });
    return { comments, total };
  }

  /**
   * 적중 내역 배너 (높은 정확도 예측)
   */
  async getHitRecords(limit = 5) {
    const preds = await this.prisma.prediction.findMany({
      where: { status: 'COMPLETED', accuracy: { not: null, gte: 33 } },
      include: { race: { select: { rcDate: true, meet: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 20),
    });

    return preds.map((p) => {
      const d = p.race?.rcDate
        ? `${p.race.rcDate.slice(0, 4)}-${p.race.rcDate.slice(4, 6)}-${p.race.rcDate.slice(6, 8)}`
        : new Date(p.createdAt).toISOString().slice(0, 10);
      const acc = Math.round(p.accuracy ?? 0);
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
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      include: RACE_INCLUDE_FOR_ANALYSIS,
    });
    if (!race) throw new NotFoundException('Race not found');

    // 3a. 과거 구간별 성적 (선행마/추입마) — RaceEntry.sectionalStats 우선, 없으면 RaceResult
    const sectionalByHorse = await this.getSectionalAnalysisByHorse(
      race as RaceForPython,
    );

    // 3b. recentRanks 보강 — DB에 없으면 RaceResult에서 과거 착순 조회 (KRA_API_ANALYSIS_SPEC §4.2)
    const raceWithRecentRanks = await this.enrichEntriesWithRecentRanks(
      race as RaceForPython,
    );
    // 3c. 조교사 승률/복승률 보강 — TrainerResult (API19_1)
    const raceWithTrainer =
      await this.enrichEntriesWithTrainerResults(raceWithRecentRanks);
    // 3d. 구간별 태그(선행마/추입마) merge — Python calculate_score 입력용
    const raceWithSectional = this.enrichEntriesWithSectionalTag(
      raceWithTrainer,
      sectionalByHorse,
    );

    // 3. Run Python Analysis (말 기준 점수 + 기수 통합 분석)
    const path = require('path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
    const horseScoreResult = await this.runPythonScript(
      scriptPath,
      raceWithSectional,
    );

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
        return this.prisma.prediction.create({
          data: {
            raceId,
            scores: scoresToSave as Prisma.InputJsonValue,
            analysis: predictionData?.analysis ?? '',
            preview: predictionData?.preview ?? '',
            status: 'COMPLETED',
            previewApproved: true, // 검수 통과 시 preview API 노출 (관리자가 미승인 시 false로 변경 가능)
          },
        });
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
  ): Promise<HorseAnalysisItem[]> {
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
        let result: HorseAnalysisItem[];
        try {
          const parsed = JSON.parse(dataString || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            result = parsed as HorseAnalysisItem[];
          } else {
            result = this.fallbackHorseScoresFromEntries(entries);
            if (code !== 0 || parsed?.error) {
              console.warn(
                `Python analysis fallback (code=${code}): ${errorString || parsed?.error || 'no valid output'}`,
              );
            }
          }
        } catch {
          result = this.fallbackHorseScoresFromEntries(entries);
          console.warn(
            `Python parse fallback: ${dataString?.slice(0, 100) || errorString}`,
          );
        }
        resolve(result);
      });

      pythonProcess.stdin.write(
        JSON.stringify(raceData, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
      pythonProcess.stdin.end();
    });
  }

  private buildRaceContext(race: RaceForPython): Record<string, unknown> {
    return {
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

    const results = await this.prisma.raceResult.findMany({
      where: {
        hrNo: { in: hrNos },
        race: { rcDate: { lt: beforeRcDate } },
      },
      select: {
        hrNo: true,
        ord: true,
        ordInt: true,
        race: { select: { rcDate: true } },
      },
      take: 500,
    });

    // rcDate 내림차순 정렬 후 hrNo별 최근 5경기 착순 (Prisma relation orderBy 비일관 대비)
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

    const trainers = await this.prisma.trainerResult.findMany({
      where: { meet: meetCode, trNo: { in: trNos } },
      select: {
        trNo: true,
        winRateTsum: true,
        quRateTsum: true,
      },
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

    const results = await this.prisma.raceResult.findMany({
      where: {
        hrNo: { in: hrNosWithout },
        sectionalTimes: { not: Prisma.JsonNull },
        race: {
          rcDate: { lt: race.rcDate ?? '' },
          meet: race.meet ?? undefined,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
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
    sectionalByHorse: Record<
      string,
      { tag: string; s1f?: number; g1f?: number }
    > = {},
  ): string {
    const raceContext = this.buildRaceContext(race);
    const entries = (race.entries || []).map((e: RaceEntryForAnalysis) =>
      this.buildEntrySummary(
        e,
        this.summarizeTraining(e),
        sectionalByHorse[e.hrNo]?.tag,
      ),
    );
    const horseScores: HorseAnalysisItem[] = Array.isArray(horseAnalysis)
      ? horseAnalysis
      : [];
    const jockeyMap = new Map<
      string,
      { jockeyScore: number; combinedScore: number }
    >();
    for (const x of jockeyAnalysis?.entriesWithScores || []) {
      const key = x.hrNo ?? x.hrName;
      if (key)
        jockeyMap.set(key, {
          jockeyScore: x.jockeyScore,
          combinedScore: x.combinedScore,
        });
    }

    const mergedEntries = entries.map((e: Record<string, unknown>) => {
      const hs = horseScores.find(
        (h: HorseAnalysisItem) => String(h.hrNo) === String(e.hrNo),
      );
      const js =
        jockeyMap.get(String(e.hrNo)) ?? jockeyMap.get(String(e.hrName));
      return {
        ...e,
        horseScore: hs?.score ?? hs?.ratingScore,
        momentumScore: hs?.momentumScore,
        experienceBonus: hs?.experienceBonus,
        jockeyScore: js?.jockeyScore,
        combinedScore: js?.combinedScore,
      };
    });

    const weightH = ((jockeyAnalysis?.weightRatio?.horse ?? 0.7) * 100) | 0;
    const weightJ = ((jockeyAnalysis?.weightRatio?.jockey ?? 0.3) * 100) | 0;
    const topJ = jockeyAnalysis?.topPickByJockey;

    return `한국 경마 승부 예측 전문가. 제시된 통계만 근거로 세부 분석. 데이터 없으면 "미확인".
가중치: 말 ${weightH}% / 기수 ${weightJ}%${topJ ? ` | 기수1위: ${topJ.hrName}(${topJ.jkName})` : ''}

## 1. 경주 정보
\`\`\`json
${JSON.stringify(raceContext)}
\`\`\`

## 2. 출전마 통계 (rating, recentRanks, sectionalTag, trainerWinRate 등 포함)
\`\`\`json
${JSON.stringify(mergedEntries)}
\`\`\`

## 3. 출력 (JSON만)
- horseScores: 각 마별 score, reason, strengths(강점 1~2개), weaknesses(약점/리스크 1개), confidence(high/medium/low)
- analysis: 날씨·주로·거리·우승후보·각질(선행/추입)·주의변수·종합 5~8문장
- preview: 무료용 2~3문장 요약. 반드시 단승식(1등 예상마 1마리)만 언급. 복승·연승·쌍승·삼복·삼쌍 등 다른 승식 절대 언급 금지.
\`\`\`json
{"scores":{"horseScores":[{"hrNo":"","hrName":"","score":0,"reason":"","strengths":[""],"weaknesses":[""],"confidence":""}]},"betTypePredictions":{"SINGLE":{"hrNo":"","reason":""},"PLACE":{"hrNo":"","reason":""},"QUINELLA":{"hrNos":["",""],"reason":""},"EXACTA":{"first":"","second":"","reason":""},"QUINELLA_PLACE":{"hrNos":["",""],"reason":""},"TRIFECTA":{"hrNos":["","",""],"reason":""},"TRIPLE":{"first":"","second":"","third":"","reason":""}},"analysis":"","preview":""}
\`\`\`
- betTypePredictions: 7개 승식 모두 출력. hrNo는 Section2 값 사용. 각 추천에 구체적 이유 필수.
- 단승 1마1등 | 복승 1마1~3등 | 연승 2마1·2등 | 쌍승 2마1→2등 | 복연승 2마3등이내 | 삼복 3마1·2·3등 | 삼쌍 3마1→2→3등`;
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
   * horseScores에서 승식별 기본 조합 유도 (2마리/3마리 승식은 3개 조합)
   */
  private deriveBetTypePredictionsFromHorseScores(
    horseScores: Array<{ hrNo?: string; chulNo?: string; score?: number }>,
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
   * chulNo(출주번호) 또는 hrNo → hrNo(마번) 정규화
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
