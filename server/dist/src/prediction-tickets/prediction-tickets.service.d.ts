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
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            userId: number;
            expiresAt: Date;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
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
            id: number;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            userId: number;
            expiresAt: Date;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
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
            status: import("@prisma/client").$Enums.SubscriptionStatus;
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
        status: import("@prisma/client").$Enums.TicketStatus;
        raceId: number | null;
        userId: number;
        expiresAt: Date;
        subscriptionId: number | null;
        predictionId: number | null;
        usedAt: Date | null;
        issuedAt: Date;
    }>;
    grantTickets(userId: number, count: number, expiresInDays?: number): Promise<{
        granted: number;
        tickets: {
            id: number;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            userId: number;
            expiresAt: Date;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
        }[];
    }>;
}
