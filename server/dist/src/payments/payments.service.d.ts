import { PrismaService } from '../prisma/prisma.service';
import { PaymentSubscribeDto, PaymentPurchaseDto } from '../common/dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    processSubscription(userId: number, dto: PaymentSubscribeDto): Promise<{
        billing: {
            id: number;
            createdAt: Date;
            userId: number;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: number;
            pgTransactionId: string | null;
            billingDate: Date;
            pgProvider: string | null;
            errorMessage: string | null;
        };
        planName: string;
    }>;
    processPurchase(userId: number, dto: PaymentPurchaseDto): Promise<{
        billing: {
            id: number;
            createdAt: Date;
            userId: number;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: number;
            pgTransactionId: string | null;
            billingDate: Date;
            pgProvider: string | null;
            errorMessage: string | null;
        };
    }>;
    getHistory(userId: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        status: import("@prisma/client").$Enums.PaymentStatus;
        amount: number;
        pgTransactionId: string | null;
        billingDate: Date;
        pgProvider: string | null;
        errorMessage: string | null;
    }[]>;
}
