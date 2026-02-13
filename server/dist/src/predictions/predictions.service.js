"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const analysis_service_1 = require("../analysis/analysis.service");
const config_service_1 = require("../config/config.service");
const client_1 = require("@prisma/client");
const prisma_includes_1 = require("../common/prisma-includes");
let PredictionsService = class PredictionsService {
    constructor(prisma, analysisService, configService) {
        this.prisma = prisma;
        this.analysisService = analysisService;
        this.configService = configService;
    }
    async findAll(filters) {
        const { page = 1, limit = 20, status } = filters;
        const where = {};
        if (status)
            where.status = status;
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
    async findOne(id) {
        const prediction = await this.prisma.prediction.findUnique({
            where: { id },
            include: { race: { include: { entries: true } } },
        });
        if (!prediction)
            throw new common_1.NotFoundException('예측을 찾을 수 없습니다');
        return prediction;
    }
    async create(dto) {
        return this.prisma.prediction.create({
            data: {
                raceId: dto.raceId,
                scores: dto.scores,
                analysis: dto.analysis,
                preview: dto.preview,
            },
            include: { race: true },
        });
    }
    async updateStatus(id, dto) {
        return this.prisma.prediction.update({
            where: { id },
            data: {
                status: dto.status,
                scores: dto.scores,
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
            const p = byPosition[pos];
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
    async getRecent7DaysAccuracy() {
        const results = [];
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
            const accuracy = count > 0 ? dayPreds.reduce((s, p) => s + (p.accuracy ?? 0), 0) / count : 0;
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
    async getAnalyticsFailures(opts) {
        const where = { status: 'COMPLETED' };
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
    async getAccuracyHistory(filters) {
        const { limit = 30 } = filters;
        return this.prisma.prediction.findMany({
            where: { status: 'COMPLETED', accuracy: { not: null } },
            select: { id: true, raceId: true, accuracy: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getPreview(raceId) {
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
    async getByRace(raceId) {
        return this.prisma.prediction.findFirst({
            where: { raceId, status: 'COMPLETED' },
            include: { race: { include: { entries: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async generatePrediction(raceId) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        const rawConfig = await this.configService.get('ai_config');
        const aiConfig = rawConfig ? JSON.parse(rawConfig) : {};
        const modelName = aiConfig.primaryModel || 'gemini-1.5-pro';
        const temperature = Math.min(1, Math.max(0, Number(aiConfig.temperature) || 0.7));
        const maxTokens = Math.min(8192, Math.max(100, Number(aiConfig.maxTokens) || 1000));
        const { GoogleGenerativeAI } = await Promise.resolve().then(() => __importStar(require('@google/generative-ai')));
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature, maxOutputTokens: maxTokens },
        });
        const race = await this.prisma.race.findUnique({
            where: { id: raceId },
            include: prisma_includes_1.RACE_INCLUDE_FOR_ANALYSIS,
        });
        if (!race)
            throw new common_1.NotFoundException('Race not found');
        const sectionalByHorse = await this.getSectionalAnalysisByHorse((race.entries || []).map((e) => e.hrNo), race.meet, race.rcDate);
        const path = require('path');
        const scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
        const horseScoreResult = await this.runPythonScript(scriptPath, race);
        let jockeyAnalysis = null;
        try {
            jockeyAnalysis = await this.analysisService.analyzeJockey(raceId);
        }
        catch (e) {
            console.warn('Jockey analysis skipped:', e.message);
        }
        const prompt = this.constructPrompt(race, horseScoreResult, jockeyAnalysis, sectionalByHorse);
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const predictionData = this.parseGeminiResponse(text);
            const geminiScores = predictionData?.scores ?? predictionData;
            const scoresToSave = this.buildScoresForSave(geminiScores, horseScoreResult, jockeyAnalysis);
            return this.prisma.prediction.create({
                data: {
                    raceId,
                    scores: scoresToSave,
                    analysis: predictionData?.analysis ?? '',
                    preview: predictionData?.preview ?? '',
                    status: 'COMPLETED',
                    previewApproved: true,
                },
            });
        }
        catch (error) {
            console.error('Gemini generation failed:', error);
            throw new Error('Failed to generate prediction via Gemini');
        }
    }
    runPythonScript(scriptPath, raceData) {
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
                    reject(new Error(`Python script failed with code ${code}: ${errorString}`));
                }
                else {
                    try {
                        resolve(JSON.parse(dataString));
                    }
                    catch {
                        reject(new Error(`Failed to parse Python output: ${dataString}`));
                    }
                }
            });
            pythonProcess.stdin.write(JSON.stringify(raceData));
            pythonProcess.stdin.end();
        });
    }
    buildRaceContext(race) {
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
    buildEntrySummary(entry, trainingSummary, sectionalTag) {
        const base = {
            hrNo: entry.hrNo,
            hrName: entry.hrName,
            jkName: entry.jkName,
            trName: entry.trName,
            wgBudam: entry.wgBudam,
            rating: entry.rating,
            chulNo: entry.chulNo,
            rcCntT: entry.rcCntT,
            ord1CntT: entry.ord1CntT,
            recentRanks: entry.recentRanks,
            horseWeight: entry.horseWeight,
            equipment: entry.equipment,
            bleedingInfo: entry.bleedingInfo,
            isScratched: entry.isScratched,
        };
        if (trainingSummary)
            base.trainingSummary = trainingSummary;
        if (sectionalTag)
            base.sectionalTag = sectionalTag;
        return base;
    }
    summarizeTraining(entry) {
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
            const strong = recent.filter((t) => /강|상|고/.test(String(t.intensity ?? t.trContent ?? '')));
            const summary = strong.length
                ? `최근 ${recent.length}회 훈련 중 강도 높은 ${strong.length}회`
                : `최근 ${recent.length}회 훈련`;
            return summary;
        }
        return undefined;
    }
    async getSectionalAnalysisByHorse(hrNos, meet, beforeRcDate) {
        if (!hrNos.length)
            return {};
        const results = await this.prisma.raceResult.findMany({
            where: {
                hrNo: { in: hrNos },
                sectionalTimes: { not: client_1.Prisma.JsonNull },
                race: { rcDate: { lt: beforeRcDate } },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        const byHorse = {};
        for (const r of results) {
            const st = r.sectionalTimes;
            if (!st || typeof st !== 'object')
                continue;
            const s1f = this.parseSectionalTime(st.s1f ?? st.S1F ?? st.seS1fAccTime);
            const g1f = this.parseSectionalTime(st.g1f ?? st.G1F ?? st.seG1fAccTime);
            if (s1f == null && g1f == null)
                continue;
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
        const out = {};
        for (const [hrNo, data] of Object.entries(byHorse)) {
            const n = data.s1fN + data.g1fN;
            if (n < 2)
                continue;
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
            }
            else if (avgS1f != null && avgS1f < 13.5) {
                tag = '선행마';
            }
            else if (avgG1f != null && avgG1f < 12.5) {
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
    parseSectionalTime(val) {
        if (val == null)
            return null;
        const n = Number(val);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    constructPrompt(race, horseAnalysis, jockeyAnalysis, sectionalByHorse = {}) {
        const raceContext = this.buildRaceContext(race);
        const entries = (race.entries || []).map((e) => this.buildEntrySummary(e, this.summarizeTraining(e), sectionalByHorse[e.hrNo]?.tag));
        const horseScores = Array.isArray(horseAnalysis) ? horseAnalysis : [];
        const jockeyMap = new Map();
        for (const x of jockeyAnalysis?.entriesWithScores || []) {
            const key = x.hrNo ?? x.hrName;
            if (key)
                jockeyMap.set(key, { jockeyScore: x.jockeyScore, combinedScore: x.combinedScore });
        }
        const mergedEntries = entries.map((e) => {
            const hs = horseScores.find((h) => String(h.hrNo) === String(e.hrNo));
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
    parseGeminiResponse(text) {
        let cleanText = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch)
            cleanText = jsonMatch[0];
        try {
            return JSON.parse(cleanText);
        }
        catch {
            throw new Error(`Gemini 응답 JSON 파싱 실패: ${cleanText.slice(0, 200)}...`);
        }
    }
    buildScoresForSave(geminiScores, horseScoreResult, jockeyAnalysis) {
        const base = (geminiScores && typeof geminiScores === 'object' && !('error' in geminiScores)) ? { ...geminiScores } : {};
        const gemi = base;
        const hs = gemi.horseScores ?? gemi.scores?.horseScores ?? [];
        const safeHorseResult = Array.isArray(horseScoreResult) && !horseScoreResult.some((x) => x && typeof x === 'object' && 'error' in x)
            ? horseScoreResult
            : [];
        return {
            ...base,
            horseScores: hs,
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
};
exports.PredictionsService = PredictionsService;
exports.PredictionsService = PredictionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        analysis_service_1.AnalysisService,
        config_service_1.GlobalConfigService])
], PredictionsService);
//# sourceMappingURL=predictions.service.js.map