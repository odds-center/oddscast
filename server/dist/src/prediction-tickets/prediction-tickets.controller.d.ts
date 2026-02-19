import { PredictionTicketsService } from './prediction-tickets.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsController {
    private ticketsService;
    constructor(ticketsService: PredictionTicketsService);
    useTicket(user: JwtPayload, dto: UseTicketDto): Promise<{
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
    getBalance(user: JwtPayload): Promise<{
        available: number;
        used: number;
        expired: number;
        total: number;
    }>;
    checkMatrixAccess(user: JwtPayload, date: string): Promise<{
        hasAccess: boolean;
        expiresAt?: Date;
    }>;
    useMatrixTicket(user: JwtPayload, body: {
        date?: string;
    }): Promise<{
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
    getMatrixBalance(user: JwtPayload): Promise<{
        available: number;
        used: number;
        total: number;
    }>;
    purchaseMatrixTicket(user: JwtPayload, body: {
        count?: number;
    }): Promise<{
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
    getMatrixPrice(): {
        pricePerTicket: number;
        currency: string;
        maxPerPurchase: number;
    };
    getHistory(user: JwtPayload, page?: number, limit?: number): Promise<{
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
}
