import { PredictionsService } from './predictions.service';
import { CreatePredictionDto, UpdatePredictionStatusDto, PredictionFilterDto, AccuracyHistoryFilterDto } from './dto/prediction.dto';
export declare class PredictionsController {
    private predictionsService;
    constructor(predictionsService: PredictionsService);
    findAll(filters: PredictionFilterDto): Promise<{
        predictions: ({
            race: {
                id: number;
                status: import("@prisma/client").$Enums.RaceStatus;
                createdAt: Date;
                updatedAt: Date;
                rcName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcDay: string | null;
                rcNo: string;
                stTime: string | null;
                rcDist: string | null;
                rank: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                track: string | null;
            };
        } & {
            id: number;
            raceId: number;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
            status: import("@prisma/client").$Enums.PredictionStatus;
            createdAt: Date;
            updatedAt: Date;
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
        raceId: number;
        accuracy: number | null;
        createdAt: Date;
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
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
    } | null>;
    getPreviewAlias(raceId: number): Promise<{
        id: number;
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
    } | null>;
    getByRaceHistory(raceId: number): Promise<({
        race: {
            entries: {
                id: number;
                raceId: number;
                hrNo: string;
                hrName: string;
                hrNameEn: string | null;
                jkNo: string | null;
                jkName: string;
                jkNameEn: string | null;
                trNo: string | null;
                trName: string | null;
                owNo: string | null;
                owName: string | null;
                wgBudam: number | null;
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
            status: import("@prisma/client").$Enums.RaceStatus;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcDay: string | null;
            rcNo: string;
            stTime: string | null;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
        };
    } & {
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getByRace(raceId: number): Promise<({
        race: {
            entries: {
                id: number;
                raceId: number;
                hrNo: string;
                hrName: string;
                hrNameEn: string | null;
                jkNo: string | null;
                jkName: string;
                jkNameEn: string | null;
                trNo: string | null;
                trName: string | null;
                owNo: string | null;
                owName: string | null;
                wgBudam: number | null;
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
            status: import("@prisma/client").$Enums.RaceStatus;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcDay: string | null;
            rcNo: string;
            stTime: string | null;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
        };
    } & {
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
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
                raceId: number;
                hrNo: string;
                hrName: string;
                hrNameEn: string | null;
                jkNo: string | null;
                jkName: string;
                jkNameEn: string | null;
                trNo: string | null;
                trName: string | null;
                owNo: string | null;
                owName: string | null;
                wgBudam: number | null;
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
            status: import("@prisma/client").$Enums.RaceStatus;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcDay: string | null;
            rcNo: string;
            stTime: string | null;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
        };
    } & {
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreatePredictionDto): Promise<{
        race: {
            id: number;
            status: import("@prisma/client").$Enums.RaceStatus;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcDay: string | null;
            rcNo: string;
            stTime: string | null;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
        };
    } & {
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    calculateDailyStats(): Promise<{
        total: number;
        completed: number;
        pending: number;
        averageAccuracy: number;
    }>;
    updateStatus(id: number, dto: UpdatePredictionStatusDto): Promise<{
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generate(raceId: number): Promise<{
        id: number;
        raceId: number;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
        status: import("@prisma/client").$Enums.PredictionStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
