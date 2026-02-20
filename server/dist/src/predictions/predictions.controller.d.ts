import { PredictionsService } from './predictions.service';
import { CreatePredictionDto, UpdatePredictionStatusDto, PredictionFilterDto, AccuracyHistoryFilterDto } from './dto/prediction.dto';
export declare class PredictionsController {
    private predictionsService;
    constructor(predictionsService: PredictionsService);
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
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getDashboard(): Promise<{
        total: number;
        completed: number;
        pending: number;
        averageAccuracy: number;
    }>;
    getAccuracyHistory(filters: AccuracyHistoryFilterDto): Promise<{
        id: number;
        createdAt: Date;
        raceId: number;
        accuracy: number | null;
    }[]>;
    getAccuracyStats(): Promise<{
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
    getCost(): Promise<{
        totalCost: number;
    }>;
    getAnalyticsFailures(startDate?: string, endDate?: string): Promise<{
        totalFailures: number;
        byReason: {
            reason: string;
            count: number;
            percentage: number;
        }[];
        avgMissDistance: number;
        commonPatterns: never[];
    }>;
    getPreview(raceId: number): Promise<{
        id: number;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
    } | null>;
    getPreviewAlias(raceId: number): Promise<{
        id: number;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
    } | null>;
    getByRaceHistory(raceId: number): Promise<({
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
                ratingHistory: import("@prisma/client/runtime/client").JsonValue | null;
                recentRanks: import("@prisma/client/runtime/client").JsonValue | null;
                trainingData: import("@prisma/client/runtime/client").JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: import("@prisma/client/runtime/client").JsonValue | null;
                isScratched: boolean;
                sectionalStats: import("@prisma/client/runtime/client").JsonValue | null;
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
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    })[]>;
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
                ratingHistory: import("@prisma/client/runtime/client").JsonValue | null;
                recentRanks: import("@prisma/client/runtime/client").JsonValue | null;
                trainingData: import("@prisma/client/runtime/client").JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: import("@prisma/client/runtime/client").JsonValue | null;
                isScratched: boolean;
                sectionalStats: import("@prisma/client/runtime/client").JsonValue | null;
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
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }) | null>;
    getMatrix(date?: string, meet?: string): Promise<{
        raceMatrix: {
            raceId: string;
            meet: string;
            meetName?: string;
            rcNo: string;
            stTime?: string;
            rcDist?: string;
            rank?: string;
            entryCount?: number;
            entries?: {
                hrNo: string;
                hrName: string;
            }[] | undefined;
            predictions: Record<string, string[] | string>;
            horseNames: Record<string, string>;
            aiConsensus: string;
            consensusLabel?: string;
        }[];
        experts: {
            id: string;
            name: string;
        }[];
    }>;
    getCommentary(date?: string, meet?: string, limit?: string, offset?: string): Promise<{
        comments: {
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
        }[];
        total: number;
    }>;
    getHitRecords(limit?: string): Promise<{
        id: string;
        hitDate: string;
        description: string;
        details: string | undefined;
    }[]>;
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
                ratingHistory: import("@prisma/client/runtime/client").JsonValue | null;
                recentRanks: import("@prisma/client/runtime/client").JsonValue | null;
                trainingData: import("@prisma/client/runtime/client").JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: import("@prisma/client/runtime/client").JsonValue | null;
                isScratched: boolean;
                sectionalStats: import("@prisma/client/runtime/client").JsonValue | null;
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
        scores: import("@prisma/client/runtime/client").JsonValue | null;
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
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    calculateDailyStats(): Promise<{
        total: number;
        completed: number;
        pending: number;
        averageAccuracy: number;
    }>;
    updateStatus(id: number, dto: UpdatePredictionStatusDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    generate(raceId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PredictionStatus;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
}
