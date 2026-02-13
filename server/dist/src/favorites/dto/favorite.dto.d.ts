export declare class CreateFavoriteDto {
    type: string;
    targetId: string;
    targetName: string;
    targetData?: Record<string, unknown>;
    memo?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
}
export declare class UpdateFavoriteDto {
    targetName?: string;
    targetData?: Record<string, unknown>;
    memo?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
}
export declare class ToggleFavoriteDto {
    type: string;
    targetId: string;
    targetName: string;
    targetData?: Record<string, unknown>;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
}
