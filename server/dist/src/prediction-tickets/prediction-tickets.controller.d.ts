import { PredictionTicketsService } from './prediction-tickets.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsController {
    private ticketsService;
    constructor(ticketsService: PredictionTicketsService);
    useTicket(user: JwtPayload, dto: UseTicketDto): Promise<{
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
    getMatrixPrice(): {
        pricePerTicket: number;
        currency: string;
        maxPerPurchase: number;
    };
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
}
