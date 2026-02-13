import { PointsService } from './points.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreatePointTransactionDto, PointTransferDto, PurchaseTicketDto } from './dto/point.dto';
export declare class PointsController {
    private pointsService;
    constructor(pointsService: PointsService);
    getPromotions(filters: any): Promise<{
        type: import("@prisma/client").$Enums.PromotionType;
        description: string;
        name: string;
        id: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        conditions: import("@prisma/client/runtime/client").JsonValue | null;
        startDate: Date;
        endDate: Date;
        maxUses: number | null;
        currentUses: number;
    }[]>;
    getExpirySettings(): Promise<{
        defaultExpiryDays: number;
        allowExtension: boolean;
        maxExtensionDays: number;
    }>;
    getTicketPrice(): Promise<{
        pointsPerTicket: number;
    }>;
    getMyBalance(user: JwtPayload): Promise<{
        userId: number;
        currentPoints: number;
        totalPointsEarned: number;
        totalPointsSpent: number;
        bonusPoints: number;
        expiringPoints: number;
        lastUpdated: Date;
    }>;
    getMyTransactions(user: JwtPayload, page?: number, limit?: number, type?: string): Promise<{
        transactions: {
            description: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PointStatus;
            userId: number;
            amount: number;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            transactionType: import("@prisma/client").$Enums.PointTransactionType;
            balanceAfter: number;
            transactionTime: Date;
        }[];
        total: number;
        page: any;
        totalPages: number;
    }>;
    purchaseTicket(user: JwtPayload, dto: PurchaseTicketDto): Promise<{
        tickets: any[];
        pointsSpent: number;
        remainingPoints: number;
    }>;
    transfer(user: JwtPayload, dto: PointTransferDto): Promise<{
        status: string;
    }>;
    getBalance(userId: number): Promise<{
        userId: number;
        currentPoints: number;
        totalPointsEarned: number;
        totalPointsSpent: number;
        bonusPoints: number;
        expiringPoints: number;
        lastUpdated: Date;
    }>;
    getTransactions(userId: number, filters: any): Promise<{
        transactions: {
            description: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PointStatus;
            userId: number;
            amount: number;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            transactionType: import("@prisma/client").$Enums.PointTransactionType;
            balanceAfter: number;
            transactionTime: Date;
        }[];
        total: number;
        page: any;
        totalPages: number;
    }>;
    createTransaction(userId: number, dto: CreatePointTransactionDto): Promise<{
        description: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PointStatus;
        userId: number;
        amount: number;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        transactionType: import("@prisma/client").$Enums.PointTransactionType;
        balanceAfter: number;
        transactionTime: Date;
    }>;
    applyPromotion(userId: number, promotionId: number): Promise<{
        message: string;
        pointsEarned: number;
    }>;
}
