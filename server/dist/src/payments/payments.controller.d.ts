import { PaymentsService } from './payments.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaymentSubscribeDto, PaymentPurchaseDto } from '../common/dto/payment.dto';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    processSubscription(user: JwtPayload, dto: PaymentSubscribeDto): Promise<{
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
    processPurchase(user: JwtPayload, dto: PaymentPurchaseDto): Promise<{
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
    getHistory(user: JwtPayload): Promise<{
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
