/**
 * Result API 응답 DTO
 * KRA API 필드명 기준
 */
export interface RaceResultItemDto {
    id: string;
    raceId: string | number;
    ord: string | number;
    hrNo: string;
    hrName: string;
    jkName?: string;
    trName?: string;
    owName?: string;
    rcTime?: string;
    chaksun1?: number;
    track?: string;
    weather?: string;
    rank?: string;
}
export interface ResultListResponseDto {
    results: RaceResultItemDto[];
    total: number;
    page: number;
    totalPages: number;
}
//# sourceMappingURL=result.dto.d.ts.map