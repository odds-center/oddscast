import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto, BulkSendDto, UpdateNotificationPreferenceDto, PushSubscribeDto, PushUnsubscribeDto } from './dto/notification.dto';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    private expo;
    constructor(prisma: PrismaService);
    findAll(userId: number, filters: {
        page?: number;
        limit?: number;
        isRead?: boolean;
    }): Promise<{
        notifications: {
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            data: Prisma.JsonValue | null;
            userId: number;
            category: import("@prisma/client").$Enums.NotificationCategory;
            isRead: boolean;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: number;
        category: import("@prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    create(dto: CreateNotificationDto): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: number;
        category: import("@prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    update(id: number, dto: UpdateNotificationDto): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: number;
        category: import("@prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    markAsRead(id: number): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: number;
        category: import("@prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(userId: number): Promise<{
        count: number;
    }>;
    getUnreadCount(userId: number): Promise<{
        count: number;
    }>;
    bulkSend(dto: BulkSendDto): Promise<{
        count: number;
    }>;
    deleteAll(userId: number): Promise<{
        count: number;
    }>;
    getPreferences(userId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        pushEnabled: boolean;
        raceEnabled: boolean;
        predictionEnabled: boolean;
        subscriptionEnabled: boolean;
        systemEnabled: boolean;
        promotionEnabled: boolean;
    }>;
    pushSubscribe(userId: number, dto: PushSubscribeDto): Promise<{
        message: string;
    }>;
    pushUnsubscribe(userId: number, dto: PushUnsubscribeDto): Promise<{
        message: string;
    }>;
    updatePreferences(userId: number, dto: UpdateNotificationPreferenceDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        pushEnabled: boolean;
        raceEnabled: boolean;
        predictionEnabled: boolean;
        subscriptionEnabled: boolean;
        systemEnabled: boolean;
        promotionEnabled: boolean;
    }>;
    findAllAdmin(filters: {
        page?: number;
        limit?: number;
    }): Promise<{
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
            data: Prisma.JsonValue | null;
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
    adminSend(data: {
        title: string;
        message: string;
        target: string;
    }): Promise<{
        count: number;
        pushSent: number;
        message: string;
    }>;
}
