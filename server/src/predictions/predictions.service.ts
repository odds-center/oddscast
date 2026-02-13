import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { Prisma } from '@prisma/client';
import {
  CreatePredictionDto,
  UpdatePredictionStatusDto,
  PredictionFilterDto,
  AccuracyHistoryFilterDto,
} from './dto/prediction.dto';

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

  async findOne(id: string) {
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

  async updateStatus(id: string, dto: UpdatePredictionStatusDto) {
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
    const correctPredictions = completed.filter((p) => (p.accuracy ?? 0) > 0).length;
    const avgAccuracy = totalPredictions > 0
      ? completed.reduce((s, p) => s + (p.accuracy ?? 0), 0) / totalPredictions
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
      byProvider: [{ provider: 'gemini', accuracy: avgAccuracy, count: totalPredictions, avgCost: 0 }],
    };
  }

  private async getRecent7DaysAccuracy(): Promise<Array<{ date: string; accuracy: number; count: number }>> {
    const results: Array<{ date: string; accuracy: number; count: number }> = [];
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
        count > 0 ? dayPreds.reduce((s, p) => s + (p.accuracy ?? 0), 0) / count : 0;
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
      byReason: [{ reason: 'accuracy_zero', count: failed.length, percentage: 100 }],
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
  async getPreview(raceId: string) {
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

  async getByRace(raceId: string) {
    return this.prisma.prediction.findFirst({
      where: { raceId, status: 'COMPLETED' },
      include: { race: { include: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Gemini Integration ---

  async generatePrediction(raceId: string) {
    // 1. Check Gemini Availability
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    // 2. Load model & params from Admin AI Config (GlobalConfig)
    const rawConfig = await this.configService.get('ai_config');
    const aiConfig = rawConfig ? (JSON.parse(rawConfig) as Record<string, unknown>) : {};
    const modelName =
      (aiConfig.primaryModel as string) || 'gemini-1.5-pro';
    const temperature = Math.min(1, Math.max(0, Number(aiConfig.temperature) || 0.7));
    const maxTokens = Math.min(8192, Math.max(100, Number(aiConfig.maxTokens) || 1000));

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    });

    // 2. Fetch Race Data (entries + trainings for prompt)
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      include: {
        entries: { include: { trainings: { orderBy: { date: 'desc' }, take: 10 } } },
      },
    });
    if (!race) throw new NotFoundException('Race not found');

    // 3a. 과거 구간별 성적 (선행마/추입마) 조회 — 같은 hrNo의 RaceResult.sectionalTimes 활용
    const sectionalByHorse = await this.getSectionalAnalysisByHorse(
      (race.entries || []).map((e) => e.hrNo),
      race.meet,
      race.rcDate,
    );

    // 3. Run Python Analysis (말 기준 점수 + 기수 통합 분석)
    const path = require('path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
    const horseScoreResult = await this.runPythonScript(scriptPath, race);

    let jockeyAnalysis: {
      entriesWithScores?: Array<{
        hrName: string;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: { hrName: string; jkName: string; jockeyScore: number } | null;
    } | null = null;
    try {
      jockeyAnalysis = await this.analysisService.analyzeJockey(raceId);
    } catch (e) {
      console.warn('Jockey analysis skipped:', (e as Error).message);
    }

    // 4. Construct Prompt (훈련 요약, 구간별 성적 태깅 포함)
    const prompt = this.constructPrompt(
      race,
      horseScoreResult,
      jockeyAnalysis,
      sectionalByHorse,
    );

    // 5. Call Gemini (temperature, maxTokens from ai_config)
    try {
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
      );

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
    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw new Error('Failed to generate prediction via Gemini');
    }
  }

  private runPythonScript(scriptPath: string, raceData: any): Promise<any> {
    const { spawn } = require('child_process');
    return new Promise((resolve, reject) => {
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
        if (code !== 0) {
          reject(
            new Error(`Python script failed with code ${code}: ${errorString}`),
          );
        } else {
          try {
            resolve(JSON.parse(dataString));
          } catch {
            reject(new Error(`Failed to parse Python output: ${dataString}`));
          }
        }
      });

      // Write data to stdin
      pythonProcess.stdin.write(JSON.stringify(raceData));
      pythonProcess.stdin.end();
    });
  }

  private buildRaceContext(race: any): Record<string, unknown> {
    return {
      meet: race.meet,
      meetName: race.meetName,
      rcDate: race.rcDate,
      rcNo: race.rcNo,
      rcDist: race.rcDist,
      rcGrade: race.rcGrade,
      rcCondition: race.rcCondition,
      rcPrize: race.rcPrize,
      weather: race.weather ?? '미상',
      trackState: race.trackState ?? '미상',
    };
  }

  private buildEntrySummary(
    entry: any,
    trainingSummary?: string,
    sectionalTag?: string,
  ): Record<string, unknown> {
    const base: Record<string, unknown> = {
      hrNo: entry.hrNo,
      hrName: entry.hrName,
      jkName: entry.jkName,
      trName: entry.trName,
      weight: entry.weight,
      rating: entry.rating,
      chulNo: entry.chulNo,
      totalRuns: entry.totalRuns,
      totalWins: entry.totalWins,
      recentRanks: entry.recentRanks,
      horseWeight: entry.horseWeight,
      equipment: entry.equipment,
      bleedingInfo: entry.bleedingInfo,
      isScratched: entry.isScratched,
    };
    if (trainingSummary) base.trainingSummary = trainingSummary;
    if (sectionalTag) base.sectionalTag = sectionalTag;
    return base;
  }

  private summarizeTraining(entry: any): string | undefined {
    const trainings = entry.trainings as Array<{ date?: string; intensity?: string; time?: string }> | undefined;
    const trainingData = entry.trainingData;
    if (trainingData && typeof trainingData === 'object') {
      const arr = Array.isArray(trainingData) ? trainingData : [trainingData];
      if (arr.length) {
        return `최근 ${arr.length}회 훈련 (${JSON.stringify(arr.slice(0, 3))})`;
      }
    }
    if (trainings?.length) {
      const recent = trainings.slice(0, 5);
      const strong = recent.filter((t) => /강|상|고/.test(String(t.intensity || '')));
      const summary = strong.length
        ? `최근 ${recent.length}회 훈련 중 강도 높은 ${strong.length}회`
        : `최근 ${recent.length}회 훈련`;
      return summary;
    }
    return undefined;
  }

  /**
   * 과거 경주 결과(RaceResult)에서 같은 말(hrNo)의 구간별 기록(sectionalTimes) 조회 후
   * 선행마(S1F 빠름) / 추입마(G1F 빠름) 태깅. KRA_API_ANALYSIS_SPEC 4.3 확장.
   */
  private async getSectionalAnalysisByHorse(
    hrNos: string[],
    meet: string,
    beforeRcDate: string,
  ): Promise<Record<string, { tag: string; s1f?: number; g1f?: number }>> {
    if (!hrNos.length) return {};
    const results = await this.prisma.raceResult.findMany({
      where: {
        hrNo: { in: hrNos },
        sectionalTimes: { not: Prisma.JsonNull },
        race: { rcDate: { lt: beforeRcDate } },
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
      if (!byHorse[key]) byHorse[key] = { s1fSum: 0, g1fSum: 0, s1fN: 0, g1fN: 0 };
      if (s1f != null) {
        byHorse[key].s1fSum += s1f;
        byHorse[key].s1fN += 1;
      }
      if (g1f != null) {
        byHorse[key].g1fSum += g1f;
        byHorse[key].g1fN += 1;
      }
    }
    const out: Record<string, { tag: string; s1f?: number; g1f?: number }> = {};
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
    race: any,
    horseAnalysis: any,
    jockeyAnalysis: {
      entriesWithScores?: Array<{
        hrNo?: string;
        hrName: string;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: { hrName: string; jkName: string; jockeyScore: number } | null;
    } | null,
    sectionalByHorse: Record<string, { tag: string; s1f?: number; g1f?: number }> = {},
  ): string {
    const raceContext = this.buildRaceContext(race);
    const entries = (race.entries || []).map((e: any) =>
      this.buildEntrySummary(
        e,
        this.summarizeTraining(e),
        sectionalByHorse[e.hrNo]?.tag,
      ),
    );
    const horseScores = Array.isArray(horseAnalysis) ? horseAnalysis : [];
    const jockeyMap = new Map<string, { jockeyScore: number; combinedScore: number }>();
    for (const x of jockeyAnalysis?.entriesWithScores || []) {
      const key = x.hrNo ?? x.hrName;
      if (key) jockeyMap.set(key, { jockeyScore: x.jockeyScore, combinedScore: x.combinedScore });
    }

    const mergedEntries = entries.map((e: any) => {
      const hs = horseScores.find((h: any) => String(h.hrNo) === String(e.hrNo));
      const js = jockeyMap.get(String(e.hrNo)) ?? jockeyMap.get(String(e.hrName));
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

    return `당신은 한국 경마 승부 예측 전문가입니다. **반드시 제시된 통계와 데이터만**을 근거로 분석하세요. 추측·감정은 배제하고, 데이터가 없는 항목은 "미확인" 등으로 명시하세요.

## 원칙 (마칠기삼)
- 말의 능력(레이팅·최근성적·기록)이 기본. 기수(승률·복승률·경험)는 보조.
- 본 경주 가중치: 말 ${weightH}% / 기수 ${weightJ}%
${topJ ? `- 기수 점수 1위: ${topJ.hrName} (${topJ.jkName}, 기수점수 ${topJ.jockeyScore})` : ''}

## 1. 경주 정보
\`\`\`json
${JSON.stringify(raceContext)}
\`\`\`

## 2. 출전마 통계 (정제된 데이터)
- trainingSummary: 최근 훈련 요약 (있을 경우)
- sectionalTag: 과거 구간 기록 기반 각질 (선행마/추입마/중간마, 있을 경우)
\`\`\`json
${JSON.stringify(mergedEntries, null, 2)}
\`\`\`

## 3. 말 기준 분석 결과 (Python)
- ratingScore: 레이팅 정규화 점수
- momentumScore: 기세 지수 (최근 3경기 착순)
- experienceBonus: 경험·승률 보너스
\`\`\`json
${JSON.stringify(horseScores)}
\`\`\`

## 4. 기수 통합 점수 (있을 경우)
\`\`\`json
${JSON.stringify(jockeyAnalysis?.entriesWithScores || [])}
\`\`\`

## 5. 출력 형식 (엄격히 준수)

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 넣지 마세요.

\`\`\`json
{
  "scores": {
    "horseScores": [
      {
        "hrNo": "마번",
        "hrName": "마명",
        "score": 85,
        "reason": "데이터 기반 한 줄 이유 (레이팅·최근순위·기수 등 구체적 언급)",
        "strengths": ["강점1", "강점2"],
        "weaknesses": ["약점 또는 리스크"],
        "confidence": "high|medium|low"
      }
    ]
  },
  "analysis": "종합 분석 (3~5문장). 날씨·주로·거리 영향, 우승 후보 2~3마 및 이유, 주의할 변수(출전취소·장구변경 등)를 포함.",
  "preview": "무료 사용자용 2문장 요약. 예: '1번 ○○ 우선, 2번·3번 복승 추천. 주로 상태와 기수 배합 참고.'"
}
\`\`\`

**주의**: 모든 horseScores의 hrNo는 출전마 목록의 hrNo와 정확히 일치해야 합니다. score는 0~100, confidence는 데이터 확실성에 따라 선택하세요.`;
  }

  private parseGeminiResponse(text: string): any {
    let cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    try {
      return JSON.parse(cleanText);
    } catch {
      throw new Error(`Gemini 응답 JSON 파싱 실패: ${cleanText.slice(0, 200)}...`);
    }
  }

  /**
   * 예측 성공 시 DB에 저장할 scores 구조 생성
   * - horseScores: Gemini 결과 (API/UI 호환)
   * - analysisData: Python·기수 분석 원본 (정확도 계산·분석용)
   */
  private buildScoresForSave(
    geminiScores: { horseScores?: Array<{ hrName?: string; score?: number; reason?: string }> } | undefined,
    horseScoreResult: unknown,
    jockeyAnalysis: {
      entriesWithScores?: Array<unknown>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: unknown;
    } | null,
  ): Record<string, unknown> {
    const base = (geminiScores && typeof geminiScores === 'object' && !('error' in geminiScores)) ? { ...geminiScores } : {};
    const safeHorseResult = Array.isArray(horseScoreResult) && !horseScoreResult.some((x) => x && typeof x === 'object' && 'error' in x)
      ? horseScoreResult
      : [];

    return {
      ...base,
      horseScores: base.horseScores || [],
      analysisData: {
        horseScoreResult: safeHorseResult,
        jockeyAnalysis: jockeyAnalysis
          ? {
              entriesWithScores: jockeyAnalysis.entriesWithScores || [],
              weightRatio: jockeyAnalysis.weightRatio || { horse: 0.7, jockey: 0.3 },
              topPickByJockey: jockeyAnalysis.topPickByJockey ?? null,
            }
          : null,
      },
    };
  }
}
