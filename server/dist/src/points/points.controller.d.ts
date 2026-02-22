import { PointsService } from './points.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreatePointTransactionDto, PointTransferDto, PurchaseTicketDto } from './dto/point.dto';
export declare class PointsController {
    private pointsService;
    constructor(pointsService: PointsService);
    getPromotions(filters: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        description: string;
        type: import("@prisma/client").$Enums.PromotionType;
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
            id: number;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PointStatus;
            transactionType: import("@prisma/client").$Enums.PointTransactionType;
            amount: number;
            balanceAfter: number;
            description: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
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
            id: number;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PointStatus;
            transactionType: import("@prisma/client").$Enums.PointTransactionType;
            amount: number;
            balanceAfter: number;
            description: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            transactionTime: Date;
        }[];
        total: number;
        page: any;
        totalPages: number;
    }>;
    createTransaction(userId: number, dto: CreatePointTransactionDto): Promise<{
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PointStatus;
        transactionType: import("@prisma/client").$Enums.PointTransactionType;
        amount: number;
        balanceAfter: number;
        description: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        transactionTime: Date;
    }>;
    applyPromotion(userId: number, promotionId: number): Promise<{
        message: string;
        pointsEarned: number;
    }>;
}
