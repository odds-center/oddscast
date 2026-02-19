import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from '../predictions/predictions.service';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsService {
    private prisma;
    private predictionsService;
    constructor(prisma: PrismaService, predictionsService: PredictionsService);
    useTicket(userId: number, dto: UseTicketDto): Promise<{
        ticket: {
            id: number;
            raceId: number | null;
            status: import("@prisma/client").$Enums.TicketStatus;
            userId: number;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
            expiresAt: Date;
        };
        prediction: {
            id: number;
            raceId: number;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
            status: import("@prisma/client").$Enums.PredictionStatus;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getBalance(userId: number): Promise<{
        available: number;
        used: number;
        expired: number;
        total: number;
    }>;
    getHistory(userId: number, page?: number, limit?: number): Promise<{
        tickets: ({
            prediction: {
                id: number;
                raceId: number;
                scores: import("@prisma/client/runtime/client").JsonValue | null;
                analysis: string | null;
                preview: string | null;
                previewApproved: boolean;
                accuracy: number | null;
                status: import("@prisma/client").$Enums.PredictionStatus;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: number;
            raceId: number | null;
            status: import("@prisma/client").$Enums.TicketStatus;
            userId: number;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
            expiresAt: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        prediction: {
            id: number;
            raceId: number;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
            status: import("@prisma/client").$Enums.PredictionStatus;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        subscription: {
            id: number;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            planId: number;
            price: number;
            billingKey: string | null;
            nextBillingDate: Date | null;
            lastBilledAt: Date | null;
            startedAt: Date;
            cancelledAt: Date | null;
            cancelReason: string | null;
        } | null;
    } & {
        id: number;
        raceId: number | null;
        status: import("@prisma/client").$Enums.TicketStatus;
        userId: number;
        subscriptionId: number | null;
        predictionId: number | null;
        usedAt: Date | null;
        issuedAt: Date;
        expiresAt: Date;
    }>;
    checkMatrixAccess(userId: number, date: string): Promise<{
        hasAccess: boolean;
        expiresAt?: Date;
    }>;
    useMatrixTicket(userId: number, date: string): Promise<{
        ticket: {
            id: number;
            raceId: number | null;
            status: import("@prisma/client").$Enums.TicketStatus;
            userId: number;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
            expiresAt: Date;
        };
        alreadyUsed: boolean;
    }>;
    getMatrixBalance(userId: number): Promise<{
        available: number;
        used: number;
        total: number;
    }>;
    purchaseMatrixTickets(userId: number, count: number): Promise<{
        purchased: number;
        totalPrice: number;
        pricePerTicket: number;
        expiresAt: Date;
        tickets: {
            id: number;
            raceId: number | null;
            status: import("@prisma/client").$Enums.TicketStatus;
            userId: number;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
            expiresAt: Date;
        }[];
    }>;
    grantTickets(userId: number, count: number, expiresInDays?: number, type?: 'RACE' | 'MATRIX'): Promise<{
        granted: number;
        type: "MATRIX" | "RACE";
        tickets: {
            id: number;
            raceId: number | null;
            status: import("@prisma/client").$Enums.TicketStatus;
            userId: number;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
            expiresAt: Date;
        }[];
    }>;
}
