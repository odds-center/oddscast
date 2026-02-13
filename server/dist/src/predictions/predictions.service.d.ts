import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { Prisma } from '@prisma/client';
import { CreatePredictionDto, UpdatePredictionStatusDto, PredictionFilterDto, AccuracyHistoryFilterDto } from './dto/prediction.dto';
export declare class PredictionsService {
    private prisma;
    private analysisService;
    private configService;
    constructor(prisma: PrismaService, analysisService: AnalysisService, configService: GlobalConfigService);
    findAll(filters: PredictionFilterDto): Promise<{
        predictions: ({
            race: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                rcName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rank: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                track: string | null;
                status: import("@prisma/client").$Enums.RaceStatus;
                rcDay: string | null;
                stTime: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PredictionStatus;
            raceId: number;
            scores: Prisma.JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        race: {
            entries: {
                id: number;
                hrNo: string;
                hrName: string;
                jkName: string;
                trName: string | null;
                owName: string | null;
                wgBudam: number | null;
                raceId: number;
                hrNameEn: string | null;
                jkNo: string | null;
                jkNameEn: string | null;
                trNo: string | null;
                owNo: string | null;
                rating: number | null;
                chulNo: string | null;
                dusu: number | null;
                sex: string | null;
                age: number | null;
                prd: string | null;
                chaksun1: number | null;
                chaksunT: bigint | null;
                rcCntT: number | null;
                ord1CntT: number | null;
                budam: string | null;
                recentRanks: Prisma.JsonValue | null;
                trainingData: Prisma.JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: Prisma.JsonValue | null;
                isScratched: boolean;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: Prisma.JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    create(dto: CreatePredictionDto): Promise<{
        race: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: Prisma.JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    updateStatus(id: number, dto: UpdatePredictionStatusDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: Prisma.JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    getDashboard(): Promise<{
        total: number;
        completed: number;
        pending: number;
        averageAccuracy: number;
    }>;
    getAnalyticsDashboard(): Promise<{
        overall: {
            totalPredictions: number;
            correctPredictions: number;
            accuracy: number;
            avgConfidence: number;
        };
        byPosition: {
            first: {
                correct: number;
                total: number;
                accuracy: number;
            };
            second: {
                correct: number;
                total: number;
                accuracy: number;
            };
            third: {
                correct: number;
                total: number;
                accuracy: number;
            };
        };
        recent7Days: {
            date: string;
            accuracy: number;
            count: number;
        }[];
        byProvider: {
            provider: string;
            accuracy: number;
            count: number;
            avgCost: number;
        }[];
    }>;
    private getRecent7DaysAccuracy;
    getCostStats(): Promise<{
        totalCost: number;
    }>;
    getAnalyticsFailures(opts: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalFailures: number;
        byReason: {
            reason: string;
            count: number;
            percentage: number;
        }[];
        avgMissDistance: number;
        commonPatterns: never[];
    }>;
    getAccuracyHistory(filters: AccuracyHistoryFilterDto): Promise<{
        id: number;
        createdAt: Date;
        raceId: number;
        accuracy: number | null;
    }[]>;
    getPreview(raceId: number): Promise<{
        id: number;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        scores: Prisma.JsonValue;
        analysis: string | null;
        preview: string | null;
    } | null>;
    getByRace(raceId: number): Promise<({
        race: {
            entries: {
                id: number;
                hrNo: string;
                hrName: string;
                jkName: string;
                trName: string | null;
                owName: string | null;
                wgBudam: number | null;
                raceId: number;
                hrNameEn: string | null;
                jkNo: string | null;
                jkNameEn: string | null;
                trNo: string | null;
                owNo: string | null;
                rating: number | null;
                chulNo: string | null;
                dusu: number | null;
                sex: string | null;
                age: number | null;
                prd: string | null;
                chaksun1: number | null;
                chaksunT: bigint | null;
                rcCntT: number | null;
                ord1CntT: number | null;
                budam: string | null;
                recentRanks: Prisma.JsonValue | null;
                trainingData: Prisma.JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: Prisma.JsonValue | null;
                isScratched: boolean;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: Prisma.JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }) | null>;
    generatePrediction(raceId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: Prisma.JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    private runPythonScript;
    private buildRaceContext;
    private buildEntrySummary;
    private summarizeTraining;
    private getSectionalAnalysisByHorse;
    private parseSectionalTime;
    private constructPrompt;
    private parseGeminiResponse;
    private buildScoresForSave;
}
