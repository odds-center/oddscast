/**
 * API 공통 DTO
 * Server ResponseInterceptor: { data, status, message? }
 */
export interface ApiResponseDto<T = unknown> {
    data: T;
    status: number;
    message?: string;
}
//# sourceMappingURL=api.dto.d.ts.map