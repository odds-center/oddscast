import { SubscriptionsService } from './subscriptions.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { SubscribeDto, ActivateSubscriptionDto, CancelSubscriptionDto } from './dto/subscription.dto';
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
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
    getStatus(user: JwtPayload): Promise<{
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
    getHistory(user: JwtPayload): Promise<({
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
    subscribe(user: JwtPayload, dto: SubscribeDto): Promise<{
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
    subscribeAlias(user: JwtPayload, dto: SubscribeDto): Promise<{
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
    cancelPost(user: JwtPayload, dto: CancelSubscriptionDto): Promise<{
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
    activatePost(id: string, dto: ActivateSubscriptionDto): Promise<{
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
}
