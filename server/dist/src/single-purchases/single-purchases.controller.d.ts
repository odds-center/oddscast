import { SinglePurchasesService } from './single-purchases.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PurchaseDto } from '../common/dto/payment.dto';
export declare class SinglePurchasesController {
    private singlePurchasesService;
    constructor(singlePurchasesService: SinglePurchasesService);
    purchase(user: JwtPayload, dto: PurchaseDto): Promise<{
        purchase: {
            id: string;
            userId: string;
            quantity: number;
            paymentMethod: string | null;
            pgTransactionId: string | null;
            totalAmount: number;
            purchasedAt: Date;
        };
        ticketsIssued: number;
    }>;
    purchaseAlias(user: JwtPayload, dto: PurchaseDto): Promise<{
        purchase: {
            id: string;
            userId: string;
            quantity: number;
            paymentMethod: string | null;
            pgTransactionId: string | null;
            totalAmount: number;
            purchasedAt: Date;
        };
        ticketsIssued: number;
    }>;
    getConfig(): Promise<{
        id: any;
        configName: any;
        displayName: any;
        description: any;
        originalPrice: any;
        vat: any;
        totalPrice: any;
        isActive: boolean;
    }>;
    calculatePrice(quantity?: number): Promise<{
        unitPrice: number;
        quantity: number;
        subtotal: number;
        discount: number;
        discountAmount: number;
        total: number;
    }>;
    calculatePriceAlias(quantity?: number): Promise<{
        unitPrice: number;
        quantity: number;
        subtotal: number;
        discount: number;
        discountAmount: number;
        total: number;
    }>;
    getHistory(user: JwtPayload, page?: number, limit?: number): Promise<{
        purchases: {
            id: string;
            userId: string;
            quantity: number;
            paymentMethod: string | null;
            pgTransactionId: string | null;
            totalAmount: number;
            purchasedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTotalSpent(user: JwtPayload): Promise<{
        totalSpent: number;
        totalPurchases: number;
    }>;
}
