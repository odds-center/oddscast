export declare class PurchaseDto {
    quantity?: number;
    paymentMethod?: string;
    pgTransactionId?: string;
}
export declare class PaymentSubscribeDto {
    planId: string;
    paymentMethod: string;
}
export declare class PaymentPurchaseDto {
    amount: number;
    paymentMethod: string;
    pgTransactionId?: string;
}
export declare class UseTicketDto {
    raceId: string;
    regenerate?: boolean;
}
