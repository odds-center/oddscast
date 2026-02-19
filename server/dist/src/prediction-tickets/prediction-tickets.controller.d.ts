import { PredictionTicketsService } from './prediction-tickets.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsController {
    private ticketsService;
    constructor(ticketsService: PredictionTicketsService);
    useTicket(user: JwtPayload, dto: UseTicketDto): Promise<{
        ticket: {
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
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
    getBalance(user: JwtPayload): Promise<{
        available: number;
        used: number;
        expired: number;
        total: number;
    }>;
    getHistory(user: JwtPayload, page?: number, limit?: number): Promise<{
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
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
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
        id: number;
        userId: number;
        expiresAt: Date;
        status: import("@prisma/client").$Enums.TicketStatus;
        raceId: number | null;
        subscriptionId: number | null;
        predictionId: number | null;
        usedAt: Date | null;
        issuedAt: Date;
    }>;
}
