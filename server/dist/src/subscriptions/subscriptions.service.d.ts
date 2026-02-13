import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto, ActivateSubscriptionDto, CancelSubscriptionDto } from './dto/subscription.dto';
export declare class SubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    subscribe(userId: string, dto: SubscribeDto): Promise<{
        plan: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            planName: string;
            displayName: string;
            originalPrice: number;
            vat: number;
            totalPrice: number;
            baseTickets: number;
            bonusTickets: number;
            totalTickets: number;
            sortOrder: number;
        };
    } & {
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
    }>;
    activate(id: string, dto: ActivateSubscriptionDto): Promise<{
        plan: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            planName: string;
            displayName: string;
            originalPrice: number;
            vat: number;
            totalPrice: number;
            baseTickets: number;
            bonusTickets: number;
            totalTickets: number;
            sortOrder: number;
        };
    } & {
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
    }>;
    cancel(id: string, dto: CancelSubscriptionDto): Promise<{
        plan: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            planName: string;
            displayName: string;
            originalPrice: number;
            vat: number;
            totalPrice: number;
            baseTickets: number;
            bonusTickets: number;
            totalTickets: number;
            sortOrder: number;
        };
    } & {
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
    }>;
    getStatus(userId: string): Promise<{
        isActive: boolean;
        planId: null;
        monthlyTickets: number;
        daysUntilRenewal: null;
        subscription?: undefined;
    } | {
        isActive: boolean;
        planId: string;
        monthlyTickets: number;
        daysUntilRenewal: number | null;
        subscription: {
            plan: {
                description: string | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                planName: string;
                displayName: string;
                originalPrice: number;
                vat: number;
                totalPrice: number;
                baseTickets: number;
                bonusTickets: number;
                totalTickets: number;
                sortOrder: number;
            };
        } & {
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
        };
    }>;
    cancelByUserId(userId: string, reason?: string): Promise<{
        plan: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            planName: string;
            displayName: string;
            originalPrice: number;
            vat: number;
            totalPrice: number;
            baseTickets: number;
            bonusTickets: number;
            totalTickets: number;
            sortOrder: number;
        };
    } & {
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
    }>;
    getHistory(userId: string): Promise<({
        plan: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            planName: string;
            displayName: string;
            originalPrice: number;
            vat: number;
            totalPrice: number;
            baseTickets: number;
            bonusTickets: number;
            totalTickets: number;
            sortOrder: number;
        };
    } & {
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
    })[]>;
    getPlans(): Promise<{
        description: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        planName: string;
        displayName: string;
        originalPrice: number;
        vat: number;
        totalPrice: number;
        baseTickets: number;
        bonusTickets: number;
        totalTickets: number;
        sortOrder: number;
    }[]>;
    getPlansAdmin(): Promise<{
        description: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        planName: string;
        displayName: string;
        originalPrice: number;
        vat: number;
        totalPrice: number;
        baseTickets: number;
        bonusTickets: number;
        totalTickets: number;
        sortOrder: number;
    }[]>;
    updatePlan(id: string, data: Partial<{
        displayName: string;
        description: string;
        originalPrice: number;
        vat: number;
        totalPrice: number;
        baseTickets: number;
        bonusTickets: number;
        totalTickets: number;
        isActive: boolean;
        sortOrder: number;
    }>): Promise<{
        description: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        planName: string;
        displayName: string;
        originalPrice: number;
        vat: number;
        totalPrice: number;
        baseTickets: number;
        bonusTickets: number;
        totalTickets: number;
        sortOrder: number;
    }>;
}
