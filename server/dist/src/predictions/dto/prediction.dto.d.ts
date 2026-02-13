export declare class CreatePredictionDto {
    raceId: string;
    scores?: Record<string, unknown>;
    analysis?: string;
    preview?: string;
}
export declare class UpdatePredictionStatusDto {
    status: string;
    scores?: Record<string, unknown>;
    analysis?: string;
    accuracy?: number;
    previewApproved?: boolean;
}
export declare class PredictionFilterDto {
    page?: number;
    limit?: number;
    status?: string;
}
export declare class AccuracyHistoryFilterDto {
    period?: string;
    limit?: number;
}
