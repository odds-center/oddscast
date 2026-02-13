import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationType, NotificationCategory } from '@prisma/client';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  BulkSendDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const { page = 1, limit = 20, isRead } = filters;
    const where: Prisma.NotificationWhereInput = { userId };
    if (isRead !== undefined) where.isRead = isRead;

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

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('알림을 찾을 수 없습니다');
    return notification;
  }

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: (dto.type as NotificationType) || 'SYSTEM',
        category: (dto.category as NotificationCategory) || 'GENERAL',
        data: dto.data as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async update(id: string, dto: UpdateNotificationDto) {
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

  async remove(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: '알림이 삭제되었습니다' };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async bulkSend(dto: BulkSendDto) {
    const created = await this.prisma.notification.createMany({
      data: dto.recipients.map((userId) => ({
        userId,
        title: `Template: ${dto.templateId}`,
        message: JSON.stringify(dto.variables || {}),
        type: 'SYSTEM' as NotificationType,
        category: 'GENERAL' as NotificationCategory,
      })),
    });
    return { count: created.count };
  }

  async deleteAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  /** 알림 설정 조회 (없으면 기본값으로 생성) */
  async getPreferences(userId: string) {
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

  /** 알림 설정 수정 */
  async updatePreferences(userId: string, dto: UpdateNotificationPreferenceDto) {
    const data: Record<string, boolean> = {};
    if (dto.pushEnabled !== undefined) data.pushEnabled = dto.pushEnabled;
    if (dto.raceEnabled !== undefined) data.raceEnabled = dto.raceEnabled;
    if (dto.predictionEnabled !== undefined) data.predictionEnabled = dto.predictionEnabled;
    if (dto.subscriptionEnabled !== undefined) data.subscriptionEnabled = dto.subscriptionEnabled;
    if (dto.systemEnabled !== undefined) data.systemEnabled = dto.systemEnabled;
    if (dto.promotionEnabled !== undefined) data.promotionEnabled = dto.promotionEnabled;

    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /** Admin: 전체 알림 목록 */
  async findAllAdmin(filters: { page?: number; limit?: number }) {
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
    return { data: notifications, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Admin: 대상별 알림 발송 (all | active | subscribers) */
  async adminSend(data: { title: string; message: string; target: string }) {
    let userIds: string[] = [];
    if (data.target === 'all') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (data.target === 'active') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, lastLoginAt: { not: null } },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (data.target === 'subscribers') {
      const subs = await this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true },
        distinct: ['userId'],
      });
      userIds = subs.map((s) => s.userId);
    }

    if (userIds.length === 0) {
      return { count: 0, message: '발송 대상이 없습니다.' };
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
    return { count: created.count };
  }
}
