import { PredictionsService } from './predictions.service';
import { CreatePredictionDto, UpdatePredictionStatusDto, PredictionFilterDto, AccuracyHistoryFilterDto } from './dto/prediction.dto';
export declare class PredictionsController {
    private predictionsService;
    constructor(predictionsService: PredictionsService);
    findAll(filters: PredictionFilterDto): Promise<{
        predictions: ({
            race: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                raceName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rcGrade: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                trackState: string | null;
                status: import(".prisma/client").$Enums.RaceStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PredictionStatus;
            raceId: string;
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
        id: string;
        createdAt: Date;
        raceId: string;
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
    getPreview(raceId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
    } | null>;
    getPreviewAlias(raceId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        scores: import("@prisma/client/runtime/client").JsonValue;
        analysis: string | null;
        preview: string | null;
    } | null>;
    getByRace(raceId: string): Promise<({
        race: {
            entries: {
                id: string;
                hrNo: string;
                hrName: string;
                jkName: string;
                trName: string | null;
                owName: string | null;
                weight: number | null;
                raceId: string;
                hrNameEn: string | null;
                jkNo: string | null;
                jkNameEn: string | null;
                trNo: string | null;
                owNo: string | null;
                rating: number | null;
                chulNo: number | null;
                dusu: number | null;
                sex: string | null;
                age: number | null;
                origin: string | null;
                prize1: number | null;
                prizeT: bigint | null;
                totalRuns: number | null;
                totalWins: number | null;
                recentRanks: import("@prisma/client/runtime/client").JsonValue | null;
                trainingData: import("@prisma/client/runtime/client").JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: import("@prisma/client/runtime/client").JsonValue | null;
                isScratched: boolean;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        raceId: string;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }) | null>;
    findOne(id: string): Promise<{
        race: {
            entries: {
                id: string;
                hrNo: string;
                hrName: string;
                jkName: string;
                trName: string | null;
                owName: string | null;
                weight: number | null;
                raceId: string;
                hrNameEn: string | null;
                jkNo: string | null;
                jkNameEn: string | null;
                trNo: string | null;
                owNo: string | null;
                rating: number | null;
                chulNo: number | null;
                dusu: number | null;
                sex: string | null;
                age: number | null;
                origin: string | null;
                prize1: number | null;
                prizeT: bigint | null;
                totalRuns: number | null;
                totalWins: number | null;
                recentRanks: import("@prisma/client/runtime/client").JsonValue | null;
                trainingData: import("@prisma/client/runtime/client").JsonValue | null;
                equipment: string | null;
                horseWeight: string | null;
                bleedingInfo: import("@prisma/client/runtime/client").JsonValue | null;
                isScratched: boolean;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        raceId: string;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    create(dto: CreatePredictionDto): Promise<{
        race: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        raceId: string;
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
    updateStatus(id: string, dto: UpdatePredictionStatusDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        raceId: string;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
    generate(raceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PredictionStatus;
        raceId: string;
        scores: import("@prisma/client/runtime/client").JsonValue | null;
        analysis: string | null;
        preview: string | null;
        previewApproved: boolean;
        accuracy: number | null;
    }>;
}
