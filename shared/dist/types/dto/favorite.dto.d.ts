/**
 * Favorite API 응답 DTO
 */
export type FavoriteTypeDto = 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';
export interface FavoriteDto {
    id: string | number;
    userId: number;
    type: FavoriteTypeDto;
    targetId: string;
    targetName: string;
    targetData?: Record<string, unknown>;
    memo?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface FavoriteListResponseDto {
    favorites: FavoriteDto[];
    total: number;
    page: number;
    totalPages: number;
}
//# sourceMappingURL=favorite.dto.d.ts.map