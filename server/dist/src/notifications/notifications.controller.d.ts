import { NotificationsService } from './notifications.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateNotificationDto, UpdateNotificationDto, BulkSendDto, UpdateNotificationPreferenceDto, PushSubscribeDto, PushUnsubscribeDto } from './dto/notification.dto';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: JwtPayload, page?: number, limit?: number, isRead?: boolean): Promise<{
        notifications: {
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
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getUnreadCount(user: JwtPayload): Promise<{
        count: number;
    }>;
    getPreferences(user: JwtPayload): Promise<{
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
    updatePreferences(user: JwtPayload, dto: UpdateNotificationPreferenceDto): Promise<{
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
    getTemplates(): never[];
    findOne(id: number): Promise<{
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
    }>;
    create(dto: CreateNotificationDto): Promise<{
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
    }>;
    pushSubscribe(user: JwtPayload, dto: PushSubscribeDto): Promise<{
        message: string;
    }>;
    pushUnsubscribe(user: JwtPayload, dto: PushUnsubscribeDto): Promise<{
        message: string;
    }>;
    bulkSend(dto: BulkSendDto): Promise<{
        count: number;
    }>;
    markAsRead(id: number): Promise<{
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
    }>;
    markAllAsRead(user: JwtPayload): Promise<{
        count: number;
    }>;
    update(id: number, dto: UpdateNotificationDto): Promise<{
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
    }>;
    deleteAll(user: JwtPayload): Promise<{
        count: number;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
