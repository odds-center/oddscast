import { PrismaService } from '../prisma/prisma.service';
import { GlobalConfigService } from '../config/config.service';
import { PurchaseDto } from '../common/dto/payment.dto';
export declare class SinglePurchasesService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: GlobalConfigService);
    private readonly DEFAULT_PRICE_PER_TICKET;
    private getPricePerTicket;
    purchase(userId: number, dto: PurchaseDto): Promise<{
        purchase: {
            id: number;
            userId: number;
            totalAmount: number;
            quantity: number;
            paymentMethod: string | null;
            pgTransactionId: string | null;
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
    updateConfig(data: {
        id?: string;
        originalPrice?: number;
        vat?: number;
        totalPrice?: number;
        displayName?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        id: any;
        configName: any;
        displayName: any;
        description: any;
        originalPrice: any;
        vat: any;
        totalPrice: any;
        isActive: boolean;
    }>;
    calculatePrice(quantity: number): Promise<{
        unitPrice: number;
        quantity: number;
        subtotal: number;
        discount: number;
        discountAmount: number;
        total: number;
    }>;
    getHistory(userId: number, page?: number, limit?: number): Promise<{
        purchases: {
            id: number;
            userId: number;
            totalAmount: number;
            quantity: number;
            paymentMethod: string | null;
            pgTransactionId: string | null;
            purchasedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTotalSpent(userId: number): Promise<{
        totalSpent: number;
        totalPurchases: number;
    }>;
}
