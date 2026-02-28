import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationType, NotificationCategory } from '@prisma/client';
import Expo from 'expo-server-sdk';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  BulkSendDto,
  UpdateNotificationPreferenceDto,
  PushSubscribeDto,
  PushUnsubscribeDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }

  /** Base URL for deep links (FEATURE_ROADMAP 3.4). Mobile app resolves relative path if empty. */
  private getWebappBaseUrl(): string {
    return (process.env.WEBAPP_BASE_URL ?? '').replace(/\/$/, '');
  }

  async findAll(
    userId: number,
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

  async findOne(id: number) {
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

  async update(id: number, dto: UpdateNotificationDto) {
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

  async remove(id: number) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: '알림이 삭제되었습니다' };
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async getUnreadCount(userId: number) {
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

  async deleteAll(userId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  /** 알림 설정 조회 (없으면 기본값으로 생성) */
  async getPreferences(userId: number) {
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

  /** 푸시 토큰 등록 (Expo Push) */
  async pushSubscribe(userId: number, dto: PushSubscribeDto) {
    if (!Expo.isExpoPushToken(dto.token)) {
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

  /** 푸시 토큰 삭제 */
  async pushUnsubscribe(userId: number, dto: PushUnsubscribeDto) {
    await this.prisma.pushToken.deleteMany({
      where: { userId, token: dto.token },
    });
    return { message: '푸시 알림 구독이 해제되었습니다.' };
  }

  /** 알림 설정 수정 */
  async updatePreferences(
    userId: number,
    dto: UpdateNotificationPreferenceDto,
  ) {
    const data: Record<string, boolean> = {};
    if (dto.pushEnabled !== undefined) data.pushEnabled = dto.pushEnabled;
    if (dto.raceEnabled !== undefined) data.raceEnabled = dto.raceEnabled;
    if (dto.predictionEnabled !== undefined)
      data.predictionEnabled = dto.predictionEnabled;
    if (dto.subscriptionEnabled !== undefined)
      data.subscriptionEnabled = dto.subscriptionEnabled;
    if (dto.systemEnabled !== undefined) data.systemEnabled = dto.systemEnabled;
    if (dto.promotionEnabled !== undefined)
      data.promotionEnabled = dto.promotionEnabled;

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
    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Admin: 대상별 알림 발송 (all | active | subscribers) - DB 저장 + Expo Push */
  async adminSend(data: { title: string; message: string; target: string }) {
    let userIds: number[] = [];
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
        const baseUrl = this.getWebappBaseUrl();
        const deepLink = baseUrl
          ? `${baseUrl}/mypage/notifications`
          : '/mypage/notifications';
        const messages = tokens.map((t) => ({
          to: t.token,
          title: data.title,
          body: data.message,
          sound: 'default' as const,
          data: { type: 'SYSTEM', deepLink },
        }));

        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          const receipts = await this.expo.sendPushNotificationsAsync(chunk);
          for (let i = 0; i < receipts.length; i++) {
            const r = receipts[i];
            if (r.status === 'ok') pushSent += 1;
            else if (r.status === 'error' && r.details?.error) {
              this.logger.warn(`Push failed: ${r.details.error}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('Expo push send error', err);
    }

    return {
      count: created.count,
      pushSent,
      message: `알림 ${created.count}건 저장, 푸시 ${pushSent}건 발송`,
    };
  }

  /**
   * Smart Race Alert: notify users with predictionEnabled when a high-confidence prediction is ready.
   * Called from PredictionsService after prediction create.
   */
  async notifyHighConfidencePrediction(payload: {
    raceId: number;
    predictionId: number;
    meet?: string;
    rcNo?: string;
    rcDate?: string;
    confidencePercent: number;
  }): Promise<{ count: number }> {
    const {
      raceId,
      predictionId,
      meet = '',
      rcNo = '',
      confidencePercent,
    } = payload;
    const meetLabel = meet || '경주';
    const raceLabel = rcNo ? `${meetLabel} ${rcNo}R` : meetLabel;
    const title = '고신뢰도 AI 예측 준비됨';
    const message = `${raceLabel} — 예측 확률 ${confidencePercent}%. 상세 분석을 확인하세요.`;
    const baseUrl = this.getWebappBaseUrl();
    const deepLink = baseUrl
      ? `${baseUrl}/races/${raceId}`
      : `/races/${raceId}`;
    const data = {
      raceId,
      predictionId,
      type: 'HIGH_CONFIDENCE',
      deepLink,
    } as Prisma.InputJsonValue;

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { notificationPreference: null },
          { notificationPreference: { predictionEnabled: true } },
        ],
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return { count: 0 };

    const created = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: 'PREDICTION' as NotificationType,
        category: 'INFO' as NotificationCategory,
        data,
      })),
    });
    this.logger.log(
      `[SmartAlert] HIGH_CONFIDENCE: raceId=${raceId} → ${created.count} notifications`,
    );

    // Push with deepLink so tapping opens race detail (FEATURE_ROADMAP 3.4)
    try {
      const tokens = await this.prisma.pushToken.findMany({
        where: {
          userId: { in: userIds },
          user: {
            OR: [
              { notificationPreference: null },
              { notificationPreference: { pushEnabled: true } },
            ],
          },
        },
        select: { token: true },
      });
      if (tokens.length > 0) {
        const pushMessages = tokens.map((t) => ({
          to: t.token,
          title,
          body: message,
          sound: 'default' as const,
          data: { type: 'HIGH_CONFIDENCE', raceId, predictionId, deepLink },
        }));
        const chunks = this.expo.chunkPushNotifications(pushMessages);
        for (const chunk of chunks) {
          await this.expo.sendPushNotificationsAsync(chunk);
        }
        this.logger.log(
          `[SmartAlert] Push sent to ${tokens.length} device(s) with deepLink`,
        );
      }
    } catch (err) {
      this.logger.warn(
        '[SmartAlert] Push send failed',
        (err as Error)?.message,
      );
    }

    return { count: created.count };
  }
}
