import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';
import { CreatePointTransactionDto, PointTransferDto, PurchaseTicketDto } from './dto/point.dto';
export declare class PointsService {
    private prisma;
    private picksService;
    constructor(prisma: PrismaService, picksService: PicksService);
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
    transfer(fromUserId: number, dto: PointTransferDto): Promise<{
        status: string;
    }>;
    getPromotions(_filters: any): Promise<{
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
    applyPromotion(userId: number, promotionId: number): Promise<{
        message: string;
        pointsEarned: number;
    }>;
    getExpirySettings(): Promise<{
        defaultExpiryDays: number;
        allowExtension: boolean;
        maxExtensionDays: number;
    }>;
    getTicketPrice(): Promise<{
        pointsPerTicket: number;
    }>;
    purchaseTicket(userId: number, dto: PurchaseTicketDto): Promise<{
        tickets: any[];
        pointsSpent: number;
        remainingPoints: number;
    }>;
    awardPickPointsForRace(raceId: number): Promise<{
        awarded: number;
    }>;
    private getPointConfigMap;
}
