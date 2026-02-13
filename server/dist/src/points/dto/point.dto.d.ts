import { PointTransactionType, PointStatus } from '@prisma/client';
export declare class CreatePointTransactionDto {
    type: PointTransactionType;
    amount: number;
    description: string;
    metadata?: any;
    expiresAt?: string;
}
export declare class UpdatePointTransactionDto {
    amount?: number;
    description?: string;
    status?: PointStatus;
}
export declare class PointTransferDto {
    toUserId: string;
    amount: number;
    description: string;
}
export declare class PurchaseTicketDto {
    quantity: number;
}
export declare class PointAdjustmentDto {
    userId: string;
    amount: number;
    reason: string;
    type: 'ADMIN_ADJUSTMENT' | 'REFUND' | 'CORRECTION';
}
