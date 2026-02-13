import { PrismaService } from '../prisma/prisma.service';
import { PaymentSubscribeDto, PaymentPurchaseDto } from '../common/dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    processSubscription(userId: string, dto: PaymentSubscribeDto): Promise<{
        billing: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            userId: string;
            amount: number;
            pgTransactionId: string | null;
            billingDate: Date;
            pgProvider: string | null;
            errorMessage: string | null;
        };
        planName: string;
    }>;
    processPurchase(userId: string, dto: PaymentPurchaseDto): Promise<{
        billing: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            userId: string;
            amount: number;
            pgTransactionId: string | null;
            billingDate: Date;
            pgProvider: string | null;
            errorMessage: string | null;
        };
    }>;
    getHistory(userId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        userId: string;
        amount: number;
        pgTransactionId: string | null;
        billingDate: Date;
        pgProvider: string | null;
        errorMessage: string | null;
    }[]>;
}
