/**
 * 포인트 공통 타입
 * webapp, mobile, admin, server
 */
export declare enum PointTransactionType {
    EARNED = "EARNED",
    SPENT = "SPENT",
    REFUNDED = "REFUNDED",
    BONUS = "BONUS",
    PROMOTION = "PROMOTION",
    ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
    EXPIRED = "EXPIRED",
    TRANSFER_IN = "TRANSFER_IN",
    TRANSFER_OUT = "TRANSFER_OUT"
}
export declare enum PointStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    PROCESSING = "PROCESSING"
}
export interface UserPointBalance {
    userId: string;
    currentPoints: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
    bonusPoints?: number;
    expiringPoints?: number;
    lastUpdated: Date | string;
}
export interface PointTransaction {
    id: string;
    userId: string;
    transactionType: PointTransactionType | string;
    amount: number;
    balanceAfter: number;
    description: string;
    status?: PointStatus | string;
    metadata?: Record<string, unknown>;
    transactionTime?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
export interface PointListResponse {
    transactions: PointTransaction[];
    total: number;
    page: number;
    totalPages: number;
}
export interface TicketPrice {
    pointsPerTicket: number;
}
//# sourceMappingURL=point.types.d.ts.map