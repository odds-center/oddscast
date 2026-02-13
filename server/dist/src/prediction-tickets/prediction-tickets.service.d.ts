import { PrismaService } from '../prisma/prisma.service';
import { UseTicketDto } from '../common/dto/payment.dto';
export declare class PredictionTicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    useTicket(userId: string, dto: UseTicketDto): Promise<{
        ticket: {
            id: string;
            status: import(".prisma/client").$Enums.TicketStatus;
            raceId: string | null;
            userId: string;
            expiresAt: Date;
            usedAt: Date | null;
            issuedAt: Date;
            subscriptionId: string | null;
            predictionId: string | null;
        };
        prediction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PredictionStatus;
            raceId: string;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
        };
    }>;
    getBalance(userId: string): Promise<{
        available: number;
        used: number;
        expired: number;
        total: number;
    }>;
    getHistory(userId: string, page?: number, limit?: number): Promise<{
        tickets: ({
            prediction: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.PredictionStatus;
                raceId: string;
                scores: import("@prisma/client/runtime/client").JsonValue | null;
                analysis: string | null;
                preview: string | null;
                previewApproved: boolean;
                accuracy: number | null;
            } | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TicketStatus;
            raceId: string | null;
            userId: string;
            expiresAt: Date;
            usedAt: Date | null;
            issuedAt: Date;
            subscriptionId: string | null;
            predictionId: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        prediction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PredictionStatus;
            raceId: string;
            scores: import("@prisma/client/runtime/client").JsonValue | null;
            analysis: string | null;
            preview: string | null;
            previewApproved: boolean;
            accuracy: number | null;
        } | null;
        subscription: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            userId: string;
            planId: string;
            price: number;
            billingKey: string | null;
            nextBillingDate: Date | null;
            lastBilledAt: Date | null;
            startedAt: Date;
            cancelledAt: Date | null;
            cancelReason: string | null;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        raceId: string | null;
        userId: string;
        expiresAt: Date;
        usedAt: Date | null;
        issuedAt: Date;
        subscriptionId: string | null;
        predictionId: string | null;
    }>;
}
