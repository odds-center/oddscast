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
const constants_1 = require("../kra/constants");
let lastWorkingGeminiModel = null;
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
            const accuracy = count > 0
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
            byReason: [
                { reason: 'accuracy_zero', count: failed.length, percentage: 100 },
            ],
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
    async getByRaceHistory(raceId) {
        return this.prisma.prediction.findMany({
            where: { raceId, status: 'COMPLETED' },
            include: { race: { include: { entries: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getMatrix(date, meet) {
        const rcDate = date
            ? date.replace(/-/g, '').slice(0, 8)
            : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const where = { rcDate };
        if (meet)
            where.meet = (0, constants_1.toKraMeetName)(meet);
        const races = await this.prisma.race.findMany({
            where,
            select: {
                id: true,
                meet: true,
                meetName: true,
                rcNo: true,
                stTime: true,
                rcDist: true,
                rank: true,
                entries: { select: { hrNo: true, hrName: true } },
            },
            orderBy: [{ meet: 'asc' }, { rcNo: 'asc' }],
        });
        const rows = [];
        for (const race of races) {
            const pred = await this.prisma.prediction.findFirst({
                where: { raceId: race.id, previewApproved: true, status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                select: { scores: true },
            });
            const scores = pred?.scores
                ?.horseScores ?? [];
            const top1 = scores[0]?.hrNo;
            const top2 = scores[1]?.hrNo;
            const consensus = top1 ?? '-';
            const consensusArr = top1 && top2 ? [top1, top2] : top1 ? [top1] : [];
            const horseNames = {};
            const entryList = race.entries ?? [];
            for (const e of entryList) {
                if (e.hrNo && e.hrName)
                    horseNames[e.hrNo] = e.hrName;
            }
            for (const s of scores) {
                if (s.hrNo && s.hrName && !horseNames[s.hrNo]) {
                    horseNames[s.hrNo] = s.hrName;
                }
            }
            rows.push({
                raceId: String(race.id),
                meet: race.meet ?? '',
                meetName: race.meetName ?? undefined,
                rcNo: race.rcNo ?? '',
                stTime: race.stTime ?? undefined,
                rcDist: race.rcDist ?? undefined,
                rank: race.rank ?? undefined,
                entryCount: entryList.length > 0 ? entryList.length : undefined,
                entries: entryList.map((e) => ({ hrNo: e.hrNo ?? '', hrName: e.hrName ?? '' })),
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
    async getCommentary(date, limit = 20, offset = 0, meet) {
        const rcDate = date
            ? date.replace(/-/g, '').slice(0, 8)
            : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const raceWhere = { rcDate };
        if (meet)
            raceWhere.meet = (0, constants_1.toKraMeetName)(meet);
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
        const comments = [];
        for (const p of preds) {
            const scores = p.scores?.horseScores ?? [];
            const top = scores[0];
            if (!top || !p.race)
                continue;
            comments.push({
                id: `pred-${p.id}`,
                expertId: 'ai',
                expertName: 'AI 종합',
                raceId: String(p.raceId),
                meet: p.race.meet ?? '',
                rcNo: p.race.rcNo ?? '',
                hrNo: top.hrNo ?? '',
                hrName: top.hrName ?? '',
                comment: top.reason ?? (p.preview && String(p.preview).slice(0, 120)) ?? '',
                keywords: top.reason ? [top.reason.slice(0, 30)] : undefined,
            });
        }
        const total = await this.prisma.prediction.count({
            where: { previewApproved: true, status: 'COMPLETED', race: raceWhere },
        });
        return { comments, total };
    }
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
    async generatePrediction(raceId) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        const rawConfig = await this.configService.get('ai_config');
        const aiConfig = rawConfig
            ? JSON.parse(rawConfig)
            : {};
        const rawModel = aiConfig.primaryModel || 'gemini-2.5-flash';
        const deprecatedOrUnavailable = [
            'gemini-1.5-pro',
            'gemini-1.5-pro-002',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
        ];
        const fallbackModels = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-pro',
        ];
        let modelsToTry = deprecatedOrUnavailable.includes(rawModel)
            ? [...fallbackModels]
            : [rawModel, ...fallbackModels.filter((m) => m !== rawModel)];
        if (lastWorkingGeminiModel &&
            modelsToTry.includes(lastWorkingGeminiModel)) {
            modelsToTry = [
                lastWorkingGeminiModel,
                ...modelsToTry.filter((m) => m !== lastWorkingGeminiModel),
            ];
        }
        const temperature = Math.min(1, Math.max(0, Number(aiConfig.temperature) || 0.7));
        const maxTokens = Math.min(8192, Math.max(500, Number(aiConfig.maxTokens) || 4096));
        const { GoogleGenerativeAI } = await Promise.resolve().then(() => __importStar(require('@google/generative-ai')));
        const genAI = new GoogleGenerativeAI(apiKey);
        const race = await this.prisma.race.findUnique({
            where: { id: raceId },
            include: prisma_includes_1.RACE_INCLUDE_FOR_ANALYSIS,
        });
        if (!race)
            throw new common_1.NotFoundException('Race not found');
        const sectionalByHorse = await this.getSectionalAnalysisByHorse(race);
        const raceWithRecentRanks = await this.enrichEntriesWithRecentRanks(race);
        const raceWithFallHistory = await this.enrichEntriesWithFallHistory(raceWithRecentRanks);
        const raceWithTrainer = await this.enrichEntriesWithTrainerResults(raceWithFallHistory);
        const raceWithSectional = this.enrichEntriesWithSectionalTag(raceWithTrainer, sectionalByHorse);
        const path = require('path');
        const scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
        const { horseScores: horseScoreResult, cascadeFallRisk } = await this.runPythonScript(scriptPath, raceWithSectional);
        let jockeyAnalysis = null;
        try {
            jockeyAnalysis = await this.analysisService.analyzeJockey(raceId);
        }
        catch (e) {
            console.warn('Jockey analysis skipped:', e.message);
        }
        const prompt = this.constructPrompt(raceWithTrainer, horseScoreResult, jockeyAnalysis, sectionalByHorse, cascadeFallRisk);
        const generationConfig = {
            temperature,
            maxOutputTokens: maxTokens,
        };
        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig,
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const predictionData = this.parseGeminiResponse(text);
                const geminiScores = predictionData?.scores ?? predictionData;
                const scoresToSave = this.buildScoresForSave(geminiScores, horseScoreResult, jockeyAnalysis, race
                    .entries ?? []);
                lastWorkingGeminiModel = modelName;
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
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                const status = err?.status;
                const msg = String(err.message);
                const is404 = status === 404 ||
                    msg.includes('404') ||
                    msg.toLowerCase().includes('not found');
                if (is404) {
                    console.warn(`Gemini model "${modelName}" not found (404), trying next...`);
                    continue;
                }
                console.error(`Gemini generation failed (${modelName}):`, lastError);
                throw new Error(`Failed to generate prediction via Gemini: ${lastError.message}`);
            }
        }
        throw new Error(`Failed to generate prediction: no usable model. Last error: ${lastError?.message ?? 'unknown'}`);
    }
    fallbackHorseScoresFromEntries(entries) {
        return entries.slice(0, 14).map((e, i) => ({
            hrNo: e.hrNo ?? e.chulNo ?? String(i + 1),
            score: 50 + (14 - i) * 2,
        }));
    }
    runPythonScript(scriptPath, raceData) {
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
                let horseScores;
                let cascadeFallRisk;
                try {
                    const parsed = JSON.parse(dataString || '[]');
                    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.scores)) {
                        horseScores = parsed.scores;
                        cascadeFallRisk = typeof parsed.cascadeFallRisk === 'number' ? parsed.cascadeFallRisk : undefined;
                    }
                    else if (Array.isArray(parsed) && parsed.length > 0) {
                        horseScores = parsed;
                    }
                    else {
                        horseScores = this.fallbackHorseScoresFromEntries(entries);
                        if (code !== 0 || parsed?.error) {
                            console.warn(`Python analysis fallback (code=${code}): ${errorString || parsed?.error || 'no valid output'}`);
                        }
                    }
                }
                catch {
                    horseScores = this.fallbackHorseScoresFromEntries(entries);
                    console.warn(`Python parse fallback: ${dataString?.slice(0, 100) || errorString}`);
                }
                resolve({ horseScores, cascadeFallRisk });
            });
            pythonProcess.stdin.write(JSON.stringify(raceData, (_, value) => typeof value === 'bigint' ? value.toString() : value));
            pythonProcess.stdin.end();
        });
    }
    buildRaceContext(race, cascadeFallRisk) {
        const ctx = {
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
    buildEntrySummary(entry, trainingSummary, sectionalTag) {
        const chaksunTStr = entry.chaksunT != null
            ? typeof entry.chaksunT === 'bigint'
                ? entry.chaksunT.toString()
                : String(entry.chaksunT)
            : undefined;
        const ratingHist = entry.ratingHistory;
        const ratingHistoryLimited = Array.isArray(ratingHist) && ratingHist.length > 0
            ? ratingHist.slice(0, 3)
            : undefined;
        const trainSummary = trainingSummary && trainingSummary.length > 80
            ? trainingSummary.slice(0, 77) + '...'
            : trainingSummary;
        const base = {
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
        if (entry.equipment)
            base.equipment = entry.equipment;
        if (entry.bleedingInfo)
            base.bleedingInfo = entry.bleedingInfo;
        if (entry.fallHistoryHorse != null)
            base.fallHistoryHorse = entry.fallHistoryHorse;
        if (entry.fallHistoryJockey != null)
            base.fallHistoryJockey = entry.fallHistoryJockey;
        if (trainSummary)
            base.trainingSummary = trainSummary;
        if (sectionalTag)
            base.sectionalTag = sectionalTag;
        return base;
    }
    async enrichEntriesWithRecentRanks(race) {
        const entries = race.entries ?? [];
        if (!entries.length)
            return race;
        const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
        if (!hrNos.length)
            return race;
        const beforeRcDate = race.rcDate ?? '';
        if (!beforeRcDate)
            return race;
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
        const sorted = [...results].sort((a, b) => {
            const da = a.race?.rcDate ?? '';
            const db = b.race?.rcDate ?? '';
            return db.localeCompare(da);
        });
        const byHorse = new Map();
        for (const r of sorted) {
            const arr = byHorse.get(r.hrNo) ?? [];
            if (arr.length >= 5)
                continue;
            const ordNum = r.ordInt ??
                (r.ord != null && /^\d+$/.test(r.ord)
                    ? parseInt(r.ord, 10)
                    : undefined);
            if (ordNum != null && ordNum > 0)
                arr.push(ordNum);
            byHorse.set(r.hrNo, arr);
        }
        const enrichedEntries = entries.map((e) => {
            const ranks = byHorse.get(e.hrNo);
            if (!ranks?.length && e.recentRanks)
                return e;
            return { ...e, recentRanks: ranks ?? e.recentRanks };
        });
        return { ...race, entries: enrichedEntries };
    }
    enrichEntriesWithSectionalTag(race, sectionalByHorse) {
        const entries = race.entries ?? [];
        if (!entries.length)
            return race;
        const enrichedEntries = entries.map((e) => ({
            ...e,
            sectionalTag: sectionalByHorse[e.hrNo]?.tag,
        }));
        return { ...race, entries: enrichedEntries };
    }
    async enrichEntriesWithFallHistory(race) {
        const entries = race.entries ?? [];
        if (!entries.length)
            return race;
        const hrNos = [...new Set(entries.map((e) => e.hrNo).filter(Boolean))];
        const jkNos = [
            ...new Set(entries.map((e) => e.jkNo).filter(Boolean)),
        ];
        const beforeRcDate = race.rcDate ?? '';
        if (!beforeRcDate)
            return race;
        const fallResults = await this.prisma.raceResult.findMany({
            where: {
                ordType: 'FALL',
                race: { rcDate: { lt: beforeRcDate } },
                OR: [{ hrNo: { in: hrNos } }, { jkNo: { in: jkNos } }],
            },
            select: { hrNo: true, jkNo: true },
            take: 2000,
        });
        const byHorse = new Map();
        const byJockey = new Map();
        for (const r of fallResults) {
            if (r.hrNo)
                byHorse.set(r.hrNo, (byHorse.get(r.hrNo) ?? 0) + 1);
            if (r.jkNo)
                byJockey.set(r.jkNo, (byJockey.get(r.jkNo) ?? 0) + 1);
        }
        const enrichedEntries = entries.map((e) => {
            const jkNo = e.jkNo;
            return {
                ...e,
                fallHistoryHorse: byHorse.get(e.hrNo) ?? 0,
                fallHistoryJockey: jkNo ? byJockey.get(jkNo) ?? 0 : 0,
            };
        });
        return { ...race, entries: enrichedEntries };
    }
    async enrichEntriesWithTrainerResults(race) {
        const entries = race.entries ?? [];
        if (!entries.length)
            return race;
        const meetCode = (0, constants_1.meetToCode)(race.meet ?? '');
        const trNos = [
            ...new Set(entries.map((e) => e.trNo).filter((v) => Boolean(v))),
        ];
        if (!trNos.length)
            return race;
        const trainers = await this.prisma.trainerResult.findMany({
            where: { meet: meetCode, trNo: { in: trNos } },
            select: {
                trNo: true,
                winRateTsum: true,
                quRateTsum: true,
            },
        });
        const byTrNo = new Map(trainers.map((t) => [
            t.trNo,
            { winRateTsum: t.winRateTsum, quRateTsum: t.quRateTsum },
        ]));
        const enrichedEntries = entries.map((e) => {
            const trNo = e.trNo;
            if (!trNo)
                return e;
            const t = byTrNo.get(trNo);
            if (!t)
                return e;
            return {
                ...e,
                trainerWinRate: t.winRateTsum,
                trainerQuRate: t.quRateTsum,
            };
        });
        return { ...race, entries: enrichedEntries };
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
    async getSectionalAnalysisByHorse(race) {
        const entries = race.entries ?? [];
        const hrNos = entries.map((e) => e.hrNo).filter(Boolean);
        if (!hrNos.length)
            return {};
        const out = {};
        for (const e of entries) {
            const st = e.sectionalStats;
            if (!st || typeof st !== 'object')
                continue;
            const obj = st;
            const s1f = this.parseSectionalTime(obj.s1fAvg ?? obj['s1f_avg'] ?? obj.S1F ?? obj.seS1fAccTime) ?? null;
            const g1f = this.parseSectionalTime(obj.g1fAvg ?? obj['g1f_avg'] ?? obj.G1F ?? obj.seG1fAccTime) ?? null;
            if (s1f == null && g1f == null)
                continue;
            let tag = '미분류';
            if (s1f != null && g1f != null) {
                tag =
                    s1f < 13.5
                        ? '선행마(초반 빠름)'
                        : g1f < 12.5
                            ? '추입마(막판 스퍼트)'
                            : '중간마';
            }
            else if (s1f != null && s1f < 13.5) {
                tag = '선행마';
            }
            else if (g1f != null && g1f < 12.5) {
                tag = '추입마';
            }
            out[e.hrNo] = { tag, s1f: s1f ?? undefined, g1f: g1f ?? undefined };
        }
        const covered = new Set(Object.keys(out));
        const hrNosWithout = hrNos.filter((h) => !covered.has(h));
        if (hrNosWithout.length === 0)
            return out;
        const results = await this.prisma.raceResult.findMany({
            where: {
                hrNo: { in: hrNosWithout },
                sectionalTimes: { not: client_1.Prisma.JsonNull },
                race: {
                    rcDate: { lt: race.rcDate ?? '' },
                    meet: race.meet ?? undefined,
                },
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
    computeWinProbabilities(scores) {
        if (!scores.length)
            return [];
        const T = 15;
        const maxS = Math.max(...scores);
        const exps = scores.map((s) => Math.exp((s - maxS) / T));
        const total = exps.reduce((a, b) => a + b, 0);
        if (total === 0)
            return scores.map(() => Math.round((100 / scores.length) * 10) / 10);
        return exps.map((e) => Math.round((e / total) * 1000) / 10);
    }
    constructPrompt(race, horseAnalysis, jockeyAnalysis, _sectionalByHorse = {}, cascadeFallRisk) {
        const horseScores = Array.isArray(horseAnalysis)
            ? horseAnalysis
            : [];
        const wH = jockeyAnalysis?.weightRatio?.horse ?? 0.7;
        const wJ = jockeyAnalysis?.weightRatio?.jockey ?? 0.3;
        const jockeyMap = new Map();
        for (const x of jockeyAnalysis?.entriesWithScores || []) {
            const key = x.hrNo ?? x.hrName;
            if (key)
                jockeyMap.set(key, x.jockeyScore);
        }
        const entryMap = new Map();
        for (const e of race.entries || []) {
            entryMap.set(e.hrNo, e);
        }
        const compactEntries = [];
        const finalScores = [];
        for (const hs of horseScores) {
            const hrNo = String(hs.hrNo);
            const entry = entryMap.get(hrNo);
            const jScore = jockeyMap.get(hrNo) ?? jockeyMap.get(hs.hrName ?? '') ?? 0;
            const hScore = hs.score ?? 50;
            const finalScore = Math.round((hScore * wH + jScore * wJ) * 100) / 100;
            finalScores.push(finalScore);
            const compact = {
                n: hs.chulNo ?? hrNo,
                h: hs.hrName ?? entry?.hrName ?? '',
                j: entry?.jkName ?? '',
                fs: finalScore,
                hs: hScore,
                js: Math.round(jScore * 100) / 100,
            };
            if (hs.sub) {
                compact.sub = [
                    hs.sub.rat ?? 0, hs.sub.frm ?? 0, hs.sub.cnd ?? 0,
                    hs.sub.exp ?? 0, hs.sub.trn ?? 0, hs.sub.suit ?? 0,
                ];
            }
            if (entry?.rating != null)
                compact.r = entry.rating;
            if (hs.recentRanks?.length)
                compact.rk = hs.recentRanks;
            if (hs.risk && hs.risk >= 15)
                compact.risk = hs.risk;
            if (hs.tags?.length)
                compact.t = hs.tags;
            compactEntries.push(compact);
        }
        const probs = this.computeWinProbabilities(finalScores);
        for (let i = 0; i < compactEntries.length; i++) {
            if (probs[i] != null)
                compactEntries[i].wp = probs[i];
        }
        const raceCtx = {
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
    parseGeminiResponse(text) {
        let cleanText = text
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
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
            try {
                const fixed = cleanText.replace(/,\s*([\]}])/g, '$1');
                return JSON.parse(fixed);
            }
            catch {
                try {
                    const { jsonrepair } = require('jsonrepair');
                    const repaired = jsonrepair(cleanText);
                    return JSON.parse(repaired);
                }
                catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    throw new Error(`Gemini 응답 JSON 파싱 실패: ${msg}. 응답 앞 300자: ${cleanText.slice(0, 300)}...`);
                }
            }
        }
    }
    deriveBetTypePredictionsFromHorseScores(horseScores) {
        const id = (h) => (h?.hrNo ?? h?.chulNo ?? '').toString().trim();
        const sorted = [...horseScores]
            .filter((h) => id(h))
            .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
        const ids = sorted.map((h) => id(h)).filter(Boolean);
        const [a, b, c, d] = ids;
        if (!a)
            return {};
        const pairCombos = b && c
            ? [
                { hrNos: [a, b] },
                { hrNos: [a, c] },
                b && c
                    ? { hrNos: [b, c] }
                    : { hrNos: [a, b] },
            ].slice(0, 3)
            : b
                ? [{ hrNos: [a, b] }]
                : [];
        const exactaCombos = b && c
            ? [
                { first: a, second: b },
                { first: a, second: c },
                { first: b, second: a },
            ]
            : b
                ? [{ first: a, second: b }]
                : [];
        const tripleCombos = a && b && c && d
            ? [
                { hrNos: [a, b, c] },
                { hrNos: [a, b, d] },
                { hrNos: [a, c, d] },
            ]
            : a && b && c
                ? [{ hrNos: [a, b, c] }]
                : [];
        const tripleExactCombos = a && b && c && d
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
            QUINELLA: pairCombos.length > 0
                ? { combinations: pairCombos, reason: '1·2등 조합' }
                : undefined,
            EXACTA: exactaCombos.length > 0
                ? { combinations: exactaCombos, reason: '1→2등 순서' }
                : undefined,
            QUINELLA_PLACE: pairCombos.length > 0
                ? {
                    combinations: pairCombos.map((p) => ({ ...p })),
                    reason: '3등 이내 2마리',
                }
                : undefined,
            TRIFECTA: tripleCombos.length > 0
                ? { combinations: tripleCombos, reason: '1·2·3등 조합' }
                : undefined,
            TRIPLE: tripleExactCombos.length > 0
                ? { combinations: tripleExactCombos, reason: '1→2→3등 순서' }
                : undefined,
        };
    }
    mergeBetTypePredictions(fromGemini, fromHorseScores) {
        return {
            SINGLE: fromGemini?.SINGLE ?? fromHorseScores.SINGLE,
            PLACE: fromGemini?.PLACE ?? fromHorseScores.PLACE,
            QUINELLA: fromGemini?.QUINELLA ?? fromHorseScores.QUINELLA,
            EXACTA: fromGemini?.EXACTA ?? fromHorseScores.EXACTA,
            QUINELLA_PLACE: fromGemini?.QUINELLA_PLACE ?? fromHorseScores.QUINELLA_PLACE,
            TRIFECTA: fromGemini?.TRIFECTA ?? fromHorseScores.TRIFECTA,
            TRIPLE: fromGemini?.TRIPLE ?? fromHorseScores.TRIPLE,
        };
    }
    resolveToHrNo(value, entries) {
        if (!value || typeof value !== 'string')
            return value;
        const v = String(value).trim();
        const e = entries.find((x) => String(x.hrNo || '').trim() === v ||
            String(x.chulNo || '').trim() === v);
        return e?.hrNo ? String(e.hrNo).trim() : v;
    }
    normalizeBetTypePredictionsToHrNo(pred, entries) {
        const r = (v) => this.resolveToHrNo(v, entries);
        const out = {};
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
        const normPair = (p) => ({
            hrNos: [r(p.hrNos[0]) ?? p.hrNos[0], r(p.hrNos[1]) ?? p.hrNos[1]],
        });
        const normExacta = (p) => ({
            first: r(p.first) ?? p.first,
            second: r(p.second) ?? p.second,
        });
        const normTriple = (p) => ({
            hrNos: [
                r(p.hrNos[0]) ?? p.hrNos[0],
                r(p.hrNos[1]) ?? p.hrNos[1],
                r(p.hrNos[2]) ?? p.hrNos[2],
            ],
        });
        const normTripleExact = (p) => ({
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
        }
        else if (q && 'hrNos' in q) {
            out.QUINELLA = { combinations: [normPair(q)], reason: q.reason };
        }
        const ex = pred.EXACTA;
        if (ex && 'combinations' in ex && ex.combinations.length) {
            out.EXACTA = {
                combinations: ex.combinations.map(normExacta).slice(0, 3),
                reason: ex.reason,
            };
        }
        else if (ex && 'first' in ex && 'second' in ex) {
            out.EXACTA = { combinations: [normExacta(ex)], reason: ex.reason };
        }
        const qp = pred.QUINELLA_PLACE;
        if (qp && 'combinations' in qp && qp.combinations.length) {
            out.QUINELLA_PLACE = {
                combinations: qp.combinations.map(normPair).slice(0, 3),
                reason: qp.reason,
            };
        }
        else if (qp && 'hrNos' in qp) {
            out.QUINELLA_PLACE = { combinations: [normPair(qp)], reason: qp.reason };
        }
        const tr = pred.TRIFECTA;
        if (tr && 'combinations' in tr && tr.combinations.length) {
            out.TRIFECTA = {
                combinations: tr.combinations.map(normTriple).slice(0, 3),
                reason: tr.reason,
            };
        }
        else if (tr && 'hrNos' in tr) {
            out.TRIFECTA = { combinations: [normTriple(tr)], reason: tr.reason };
        }
        const tp = pred.TRIPLE;
        if (tp && 'combinations' in tp && tp.combinations.length) {
            out.TRIPLE = {
                combinations: tp.combinations.map(normTripleExact).slice(0, 3),
                reason: tp.reason,
            };
        }
        else if (tp && 'first' in tp && 'second' in tp && 'third' in tp) {
            out.TRIPLE = { combinations: [normTripleExact(tp)], reason: tp.reason };
        }
        return out;
    }
    buildScoresForSave(geminiScores, horseScoreResult, jockeyAnalysis, entries = []) {
        const base = geminiScores &&
            typeof geminiScores === 'object' &&
            !('error' in geminiScores)
            ? { ...geminiScores }
            : {};
        const gemi = base;
        const hsRaw = gemi.horseScores ?? gemi.scores?.horseScores ?? [];
        const safeHorseResult = Array.isArray(horseScoreResult) &&
            !horseScoreResult.some((x) => x && typeof x === 'object' && 'error' in x)
            ? horseScoreResult
            : [];
        const hsSource = Array.isArray(safeHorseResult) && safeHorseResult.length > 0
            ? safeHorseResult
            : hsRaw;
        let derived = this.deriveBetTypePredictionsFromHorseScores(hsSource);
        const hasTrifecta = derived.TRIFECTA &&
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
        const mergedBetType = this.mergeBetTypePredictions(gemi.betTypePredictions, derived);
        const normalizedBet = this.normalizeBetTypePredictionsToHrNo(mergedBetType, entries);
        const hs = entries.length
            ? hsRaw.map((h) => {
                const rawId = (h.hrNo ?? h.chulNo)
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
};
exports.PredictionsService = PredictionsService;
exports.PredictionsService = PredictionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        analysis_service_1.AnalysisService,
        config_service_1.GlobalConfigService])
], PredictionsService);
//# sourceMappingURL=predictions.service.js.map