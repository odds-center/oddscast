import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from '../predictions/predictions.service';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsService {
    private prisma;
    private predictionsService;
    constructor(prisma: PrismaService, predictionsService: PredictionsService);
    useTicket(userId: number, dto: UseTicketDto): Promise<{
        ticket: {
            type: import("@prisma/client").$Enums.TicketType;
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            matrixDate: string | null;
            issuedAt: Date;
        };
        prediction: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PredictionStatus;
            raceId: number;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
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
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PredictionStatus;
                raceId: number;
                scores: import("@prisma/client/runtime/client").JsonValue | null;
                analysis: string | null;
                preview: string | null;
                previewApproved: boolean;
                accuracy: number | null;
            } | null;
        } & {
            type: import("@prisma/client").$Enums.TicketType;
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            matrixDate: string | null;
            issuedAt: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        prediction: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PredictionStatus;
            raceId: number;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
        } | null;
        subscription: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
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
        type: import("@prisma/client").$Enums.TicketType;
        id: number;
        userId: number;
        expiresAt: Date;
        status: import("@prisma/client").$Enums.TicketStatus;
        raceId: number | null;
        subscriptionId: number | null;
        predictionId: number | null;
        usedAt: Date | null;
        matrixDate: string | null;
        issuedAt: Date;
    }>;
    checkMatrixAccess(userId: number, date: string): Promise<{
        hasAccess: boolean;
        expiresAt?: Date;
    }>;
    useMatrixTicket(userId: number, date: string): Promise<{
        ticket: {
            type: import("@prisma/client").$Enums.TicketType;
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            matrixDate: string | null;
            issuedAt: Date;
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
            type: import("@prisma/client").$Enums.TicketType;
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            matrixDate: string | null;
            issuedAt: Date;
        }[];
    }>;
    grantTickets(userId: number, count: number, expiresInDays?: number, type?: 'RACE' | 'MATRIX'): Promise<{
        granted: number;
        type: "RACE" | "MATRIX";
        tickets: {
            type: import("@prisma/client").$Enums.TicketType;
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            matrixDate: string | null;
            issuedAt: Date;
        }[];
    }>;
}
