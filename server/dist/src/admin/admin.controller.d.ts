import { KraService } from '../kra/kra.service';
import { UsersService } from '../users/users.service';
import { GlobalConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SinglePurchasesService } from '../single-purchases/single-purchases.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
export declare class AdminController {
    private readonly kraService;
    private readonly usersService;
    private readonly configService;
    private readonly prisma;
    private readonly subscriptionsService;
    private readonly notificationsService;
    private readonly singlePurchasesService;
    private readonly predictionTicketsService;
    constructor(kraService: KraService, usersService: UsersService, configService: GlobalConfigService, prisma: PrismaService, subscriptionsService: SubscriptionsService, notificationsService: NotificationsService, singlePurchasesService: SinglePurchasesService, predictionTicketsService: PredictionTicketsService);
    syncSchedule(date?: string): Promise<{
        message: string;
        races: number;
        entries: number;
    }>;
    syncResults(date?: string): Promise<{
        message: string;
        totalResults?: number;
    }>;
    syncDetails(date?: string): Promise<{
        message: string;
    }>;
    getKraStatus(): Promise<{
        baseUrlInUse: string;
        serviceKeyConfigured: boolean;
    }>;
    getKraSyncLogs(endpoint?: string, rcDate?: string, limit?: number): Promise<{
        logs: {
            id: number;
            createdAt: Date;
            meet: string | null;
            rcDate: string | null;
            status: string;
            errorMessage: string | null;
            endpoint: string;
            recordCount: number;
            durationMs: number | null;
        }[];
        total: number;
    }>;
    seedSample(date?: string): Promise<{
        races: number;
        entries: number;
        rcDate: string;
    }>;
    syncJockeys(meet?: string): Promise<{
        message: string;
    }>;
    syncAll(date?: string): Promise<{
        message: string;
        entrySheet?: {
            races: number;
            entries: number;
        };
        results?: {
            totalResults: number;
        };
        details?: string;
        jockeys?: string;
    }>;
    syncHistorical(dateFrom: string, dateTo: string): Promise<{
        message: string;
        processed: number;
        failed: string[];
        totalResults: number;
    } | undefined>;
    getUsers(page?: number, limit?: number, role?: string, search?: string): Promise<{
        data: {
            availableTickets: number;
            totalTickets: number;
            email: string;
            name: string;
            nickname: string | null;
            avatar: string | null;
            id: number;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUser(id: number): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    updateUser(id: number, body: any): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
    activateUser(id: number): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deactivateUser(id: number): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    grantTickets(id: number, body: {
        count: number;
        expiresInDays?: number;
    }): Promise<{
        granted: number;
        tickets: {
            id: number;
            userId: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            raceId: number | null;
            subscriptionId: number | null;
            predictionId: number | null;
            usedAt: Date | null;
            issuedAt: Date;
        }[];
    }>;
    getAIConfig(): Promise<any>;
    updateAIConfig(body: any): Promise<any>;
    getSystemConfig(): Promise<{
        show_google_login: boolean;
        kra_base_url_override: string;
    }>;
    updateSystemConfig(body: {
        show_google_login?: boolean;
        kra_base_url_override?: string;
    }): Promise<{
        show_google_login: boolean;
        kra_base_url_override: string;
    }>;
    private static readonly MODEL_COST;
    private static readonly RACES_PER_MONTH;
    estimateCost(): Promise<{
        estimatedMonthlyCost: number;
        primaryModel: any;
        costStrategy: any;
        enableCaching: any;
        calculationText: string;
    }>;
    getBets(page?: number, limit?: number, userId?: string, raceId?: string, status?: string): Promise<{
        data: ({
            race: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                rcName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rank: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                track: string | null;
                status: import("@prisma/client").$Enums.RaceStatus;
                rcDay: string | null;
                stTime: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            raceId: number;
            betType: import("@prisma/client").$Enums.BetType;
            betName: string;
            betDescription: string | null;
            betAmount: number;
            potentialWin: number | null;
            odds: number | null;
            selections: import("@prisma/client/runtime/client").JsonValue;
            betStatus: import("@prisma/client").$Enums.BetStatus;
            betResult: import("@prisma/client").$Enums.BetResult;
            betTime: Date;
            raceTime: Date | null;
            resultTime: Date | null;
            actualWin: number | null;
            actualOdds: number | null;
            confidenceLevel: number | null;
            betReason: string | null;
            analysisData: import("@prisma/client/runtime/client").JsonValue | null;
            apiVersion: string | null;
            dataSource: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            roi: number | null;
            riskLevel: string | null;
            isFavorite: boolean;
            notes: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getBet(id: number): Promise<({
        user: {
            email: string;
            name: string;
            id: number;
        };
        race: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        raceId: number;
        betType: import("@prisma/client").$Enums.BetType;
        betName: string;
        betDescription: string | null;
        betAmount: number;
        potentialWin: number | null;
        odds: number | null;
        selections: import("@prisma/client/runtime/client").JsonValue;
        betStatus: import("@prisma/client").$Enums.BetStatus;
        betResult: import("@prisma/client").$Enums.BetResult;
        betTime: Date;
        raceTime: Date | null;
        resultTime: Date | null;
        actualWin: number | null;
        actualOdds: number | null;
        confidenceLevel: number | null;
        betReason: string | null;
        analysisData: import("@prisma/client/runtime/client").JsonValue | null;
        apiVersion: string | null;
        dataSource: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        roi: number | null;
        riskLevel: string | null;
        isFavorite: boolean;
        notes: string | null;
    }) | null>;
    getSubscriptionPlans(): Promise<{
        description: string | null;
        id: number;
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
    createSubscriptionPlan(body: {
        planName: string;
        displayName: string;
        description?: string;
        originalPrice: number;
        vat: number;
        totalPrice: number;
        baseTickets: number;
        bonusTickets: number;
        totalTickets: number;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<{
        description: string | null;
        id: number;
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
    getSubscriptionPlan(id: number): Promise<{
        description: string | null;
        id: number;
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
    } | null>;
    updateSubscriptionPlan(id: number, body: Record<string, unknown>): Promise<{
        description: string | null;
        id: number;
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
    deleteSubscriptionPlan(id: number): Promise<{
        description: string | null;
        id: number;
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
    getNotifications(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                email: string;
                name: string;
                id: number;
            };
        } & {
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            userId: number;
            category: import("@prisma/client").$Enums.NotificationCategory;
            isRead: boolean;
            readAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    sendNotification(body: {
        title: string;
        message: string;
        target: string;
    }): Promise<{
        count: number;
        pushSent: number;
        message: string;
    }>;
    getSinglePurchaseConfig(): Promise<{
        id: any;
        configName: any;
        displayName: any;
        description: any;
        originalPrice: any;
        vat: any;
        totalPrice: any;
        isActive: boolean;
    }>;
    updateSinglePurchaseConfig(body: any): Promise<{
        id: any;
        configName: any;
        displayName: any;
        description: any;
        originalPrice: any;
        vat: any;
        totalPrice: any;
        isActive: boolean;
    }>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        todayRaces: number;
        todayBets: {
            count: number;
            amount: number;
        };
        totalBets: {
            count: number;
            amount: number;
            winAmount: number;
        };
        activeSubscriptions: number;
    }>;
    getRevenueStats(period?: string): Promise<{
        monthlyRevenue: number;
        singleRevenue: number;
        totalRevenue: number;
        monthlyCost: number;
        monthlyProfit: number;
        margin: number;
        activeSubscribers: number;
        avgRevenuePerUser: number;
        subscriptionByPlan: {
            planName: string;
            count: number;
            revenue: number;
        }[];
        singlePurchaseCount: number;
        rows: {
            period: string;
            revenue: number;
            payout: number;
            profit: number;
        }[];
    }>;
    getUsersGrowth(days?: number): Promise<{
        date: string;
        count: number;
    }[]>;
    getBetsTrend(days?: number): Promise<{
        count: number;
        amount: number;
        winAmount: number;
        date: string;
    }[]>;
}
