/**
 * API 응답 공통 타입
 * Server ResponseInterceptor: { data, status, message? }
 * webapp, mobile, admin, server 모두 사용
 */
export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    message?: string;
}
export interface PaginatedResponse<T = unknown> {
    data?: T[];
    items?: T[];
    total: number;
    page: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
    code?: string;
    details?: unknown;
}
export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TICKET_REQUIRED = "TICKET_REQUIRED",
    INSUFFICIENT_TICKETS = "INSUFFICIENT_TICKETS",
    PREDICTION_NOT_FOUND = "PREDICTION_NOT_FOUND",
    PREDICTION_GENERATING = "PREDICTION_GENERATING",
    PREDICTION_FAILED = "PREDICTION_FAILED",
    RACE_NOT_FOUND = "RACE_NOT_FOUND",
    RACE_ALREADY_STARTED = "RACE_ALREADY_STARTED",
    BAD_REQUEST = "BAD_REQUEST",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
//# sourceMappingURL=api.types.d.ts.map