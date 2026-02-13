import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';
import { CreatePointTransactionDto, PointTransferDto, PurchaseTicketDto } from './dto/point.dto';
export declare class PointsService {
    private prisma;
    private picksService;
    constructor(prisma: PrismaService, picksService: PicksService);
    getBalance(userId: string): Promise<{
        userId: string;
        currentPoints: number;
        totalPointsEarned: number;
        totalPointsSpent: number;
        bonusPoints: number;
        expiringPoints: number;
        lastUpdated: Date;
    }>;
    getTransactions(userId: string, filters: any): Promise<{
        transactions: {
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PointStatus;
            userId: string;
            amount: number;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            transactionType: import(".prisma/client").$Enums.PointTransactionType;
            balanceAfter: number;
            transactionTime: Date;
        }[];
        total: number;
        page: any;
        totalPages: number;
    }>;
    createTransaction(userId: string, dto: CreatePointTransactionDto): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PointStatus;
        userId: string;
        amount: number;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        transactionType: import(".prisma/client").$Enums.PointTransactionType;
        balanceAfter: number;
        transactionTime: Date;
    }>;
    transfer(fromUserId: string, dto: PointTransferDto): Promise<{
        status: string;
    }>;
    getPromotions(_filters: any): Promise<{
        type: import(".prisma/client").$Enums.PromotionType;
        description: string;
        name: string;
        id: string;
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
    applyPromotion(userId: string, promotionId: string): Promise<{
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
    purchaseTicket(userId: string, dto: PurchaseTicketDto): Promise<{
        tickets: any[];
        pointsSpent: number;
        remainingPoints: number;
    }>;
    awardPickPointsForRace(raceId: string): Promise<{
        awarded: number;
    }>;
    private getPointConfigMap;
}
