"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.expo = new expo_server_sdk_1.default({ accessToken: process.env.EXPO_ACCESS_TOKEN });
    }
    async findAll(userId, filters) {
        const { page = 1, limit = 20, isRead } = filters;
        const where = { userId };
        if (isRead !== undefined)
            where.isRead = isRead;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
        ]);
        return { notifications, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification)
            throw new common_1.NotFoundException('알림을 찾을 수 없습니다');
        return notification;
    }
    async create(dto) {
        return this.prisma.notification.create({
            data: {
                userId: dto.userId,
                title: dto.title,
                message: dto.message,
                type: dto.type || 'SYSTEM',
                category: dto.category || 'GENERAL',
                data: dto.data,
            },
        });
    }
    async update(id, dto) {
        return this.prisma.notification.update({
            where: { id },
            data: {
                title: dto.title,
                message: dto.message,
                isRead: dto.isRead,
                readAt: dto.isRead ? new Date() : undefined,
            },
        });
    }
    async remove(id) {
        await this.prisma.notification.delete({ where: { id } });
        return { message: '알림이 삭제되었습니다' };
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { count: result.count };
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { count };
    }
    async bulkSend(dto) {
        const created = await this.prisma.notification.createMany({
            data: dto.recipients.map((userId) => ({
                userId,
                title: `Template: ${dto.templateId}`,
                message: JSON.stringify(dto.variables || {}),
                type: 'SYSTEM',
                category: 'GENERAL',
            })),
        });
        return { count: created.count };
    }
    async deleteAll(userId) {
        const result = await this.prisma.notification.deleteMany({
            where: { userId },
        });
        return { count: result.count };
    }
    async getPreferences(userId) {
        let pref = await this.prisma.userNotificationPreference.findUnique({
            where: { userId },
        });
        if (!pref) {
            pref = await this.prisma.userNotificationPreference.create({
                data: { userId },
            });
        }
        return pref;
    }
    async pushSubscribe(userId, dto) {
        if (!expo_server_sdk_1.default.isExpoPushToken(dto.token)) {
            throw new Error('유효하지 않은 Expo Push Token입니다.');
        }
        await this.prisma.pushToken.upsert({
            where: {
                userId_token: { userId, token: dto.token },
            },
            create: {
                userId,
                token: dto.token,
                deviceId: dto.deviceId ?? null,
            },
            update: { deviceId: dto.deviceId ?? undefined, updatedAt: new Date() },
        });
        return { message: '푸시 알림이 구독되었습니다.' };
    }
    async pushUnsubscribe(userId, dto) {
        await this.prisma.pushToken.deleteMany({
            where: { userId, token: dto.token },
        });
        return { message: '푸시 알림 구독이 해제되었습니다.' };
    }
    async updatePreferences(userId, dto) {
        const data = {};
        if (dto.pushEnabled !== undefined)
            data.pushEnabled = dto.pushEnabled;
        if (dto.raceEnabled !== undefined)
            data.raceEnabled = dto.raceEnabled;
        if (dto.predictionEnabled !== undefined)
            data.predictionEnabled = dto.predictionEnabled;
        if (dto.subscriptionEnabled !== undefined)
            data.subscriptionEnabled = dto.subscriptionEnabled;
        if (dto.systemEnabled !== undefined)
            data.systemEnabled = dto.systemEnabled;
        if (dto.promotionEnabled !== undefined)
            data.promotionEnabled = dto.promotionEnabled;
        return this.prisma.userNotificationPreference.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    }
    async findAllAdmin(filters) {
        const { page = 1, limit = 20 } = filters;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, name: true } } },
            }),
            this.prisma.notification.count(),
        ]);
        return {
            data: notifications,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async adminSend(data) {
        let userIds = [];
        if (data.target === 'all') {
            const users = await this.prisma.user.findMany({
                where: { isActive: true },
                select: { id: true },
            });
            userIds = users.map((u) => u.id);
        }
        else if (data.target === 'active') {
            const users = await this.prisma.user.findMany({
                where: { isActive: true, lastLoginAt: { not: null } },
                select: { id: true },
            });
            userIds = users.map((u) => u.id);
        }
        else if (data.target === 'subscribers') {
            const subs = await this.prisma.subscription.findMany({
                where: { status: 'ACTIVE' },
                select: { userId: true },
                distinct: ['userId'],
            });
            userIds = subs.map((s) => s.userId);
        }
        if (userIds.length === 0) {
            return { count: 0, pushSent: 0, message: '발송 대상이 없습니다.' };
        }
        const created = await this.prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                title: data.title,
                message: data.message,
                type: 'SYSTEM',
                category: 'GENERAL',
            })),
        });
        let pushSent = 0;
        try {
            const tokens = await this.prisma.pushToken.findMany({
                where: {
                    userId: { in: userIds },
                    OR: [
                        { user: { notificationPreference: { is: null } } },
                        {
                            user: {
                                notificationPreference: {
                                    pushEnabled: true,
                                    systemEnabled: true,
                                },
                            },
                        },
                    ],
                },
                select: { token: true },
            });
            if (tokens.length > 0) {
                const messages = tokens.map((t) => ({
                    to: t.token,
                    title: data.title,
                    body: data.message,
                    sound: 'default',
                    data: { type: 'SYSTEM' },
                }));
                const chunks = this.expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    const receipts = await this.expo.sendPushNotificationsAsync(chunk);
                    for (let i = 0; i < receipts.length; i++) {
                        const r = receipts[i];
                        if (r.status === 'ok')
                            pushSent += 1;
                        else if (r.status === 'error' && r.details?.error) {
                            this.logger.warn(`Push failed: ${r.details.error}`);
                        }
                    }
                }
            }
        }
        catch (err) {
            this.logger.error('Expo push send error', err);
        }
        return {
            count: created.count,
            pushSent,
            message: `알림 ${created.count}건 저장, 푸시 ${pushSent}건 발송`,
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map