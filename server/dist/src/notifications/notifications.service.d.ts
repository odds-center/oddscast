import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto, BulkSendDto, UpdateNotificationPreferenceDto } from './dto/notification.dto';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, filters: {
        page?: number;
        limit?: number;
        isRead?: boolean;
    }): Promise<{
        notifications: {
            type: import(".prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: Prisma.JsonValue | null;
            userId: string;
            category: import(".prisma/client").$Enums.NotificationCategory;
            isRead: boolean;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: string;
        category: import(".prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    create(dto: CreateNotificationDto): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: string;
        category: import(".prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    update(id: string, dto: UpdateNotificationDto): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: string;
        category: import(".prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    markAsRead(id: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Prisma.JsonValue | null;
        userId: string;
        category: import(".prisma/client").$Enums.NotificationCategory;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    bulkSend(dto: BulkSendDto): Promise<{
        count: number;
    }>;
    deleteAll(userId: string): Promise<{
        count: number;
    }>;
    getPreferences(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        pushEnabled: boolean;
        raceEnabled: boolean;
        predictionEnabled: boolean;
        subscriptionEnabled: boolean;
        systemEnabled: boolean;
        promotionEnabled: boolean;
    }>;
    updatePreferences(userId: string, dto: UpdateNotificationPreferenceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
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
                id: string;
            };
        } & {
            type: import(".prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: Prisma.JsonValue | null;
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
    adminSend(data: {
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
}
