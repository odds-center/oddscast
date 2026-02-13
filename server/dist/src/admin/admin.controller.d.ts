import { KraService } from '../kra/kra.service';
import { UsersService } from '../users/users.service';
import { GlobalConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SinglePurchasesService } from '../single-purchases/single-purchases.service';
export declare class AdminController {
    private readonly kraService;
    private readonly usersService;
    private readonly configService;
    private readonly prisma;
    private readonly subscriptionsService;
    private readonly notificationsService;
    private readonly singlePurchasesService;
    constructor(kraService: KraService, usersService: UsersService, configService: GlobalConfigService, prisma: PrismaService, subscriptionsService: SubscriptionsService, notificationsService: NotificationsService, singlePurchasesService: SinglePurchasesService);
    syncSchedule(date: string): Promise<{
        message: string;
    }>;
    syncResults(date: string): Promise<{
        message: string;
        totalResults?: number;
    }>;
    syncDetails(date: string): Promise<{
        message: string;
    }>;
    syncJockeys(meet?: string): Promise<{
        message: string;
    }>;
    syncHistorical(dateFrom: string, dateTo: string): Promise<{
        message: string;
        processed: number;
        failed: string[];
        totalResults: number;
    }>;
    getUsers(page?: number, limit?: number, role?: string, search?: string): Promise<{
        data: {
            email: string;
            name: string;
            nickname: string | null;
            avatar: string | null;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    getUser(id: string): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    updateUser(id: string, body: any): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    activateUser(id: string): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deactivateUser(id: string): Promise<{
        email: string;
        name: string;
        nickname: string | null;
        avatar: string | null;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
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
    estimateCost(): Promise<{
        estimatedMonthlyCost: number;
        costStrategy: any;
        enableCaching: any;
    }>;
    getBets(page?: number, limit?: number, userId?: string, raceId?: string, status?: string): Promise<{
        data: ({
            race: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                raceName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rcGrade: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                trackState: string | null;
                status: import(".prisma/client").$Enums.RaceStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceId: string;
            userId: string;
            analysisData: import("@prisma/client/runtime/client").JsonValue | null;
            betType: import(".prisma/client").$Enums.BetType;
            betName: string;
            betDescription: string | null;
            betAmount: number;
            selections: import("@prisma/client/runtime/client").JsonValue;
            betReason: string | null;
            confidenceLevel: number | null;
            betStatus: import(".prisma/client").$Enums.BetStatus;
            notes: string | null;
            betResult: import(".prisma/client").$Enums.BetResult;
            potentialWin: number | null;
            odds: number | null;
            betTime: Date;
            raceTime: Date | null;
            resultTime: Date | null;
            actualWin: number | null;
            actualOdds: number | null;
            apiVersion: string | null;
            dataSource: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            roi: number | null;
            riskLevel: string | null;
            isFavorite: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getBet(id: string): Promise<({
        user: {
            email: string;
            name: string;
            id: string;
        };
        race: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        raceId: string;
        userId: string;
        analysisData: import("@prisma/client/runtime/client").JsonValue | null;
        betType: import(".prisma/client").$Enums.BetType;
        betName: string;
        betDescription: string | null;
        betAmount: number;
        selections: import("@prisma/client/runtime/client").JsonValue;
        betReason: string | null;
        confidenceLevel: number | null;
        betStatus: import(".prisma/client").$Enums.BetStatus;
        notes: string | null;
        betResult: import(".prisma/client").$Enums.BetResult;
        potentialWin: number | null;
        odds: number | null;
        betTime: Date;
        raceTime: Date | null;
        resultTime: Date | null;
        actualWin: number | null;
        actualOdds: number | null;
        apiVersion: string | null;
        dataSource: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        roi: number | null;
        riskLevel: string | null;
        isFavorite: boolean;
    }) | null>;
    getSubscriptionPlans(): Promise<{
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
    getSubscriptionPlan(id: string): Promise<{
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
    } | null>;
    updateSubscriptionPlan(id: string, body: any): Promise<{
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
    getNotifications(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                email: string;
                name: string;
                id: string;
            };
        } & {
            type: import(".prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            category: import(".prisma/client").$Enums.NotificationCategory;
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
        message: string;
    } | {
        count: number;
        message?: undefined;
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
