import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { PushToken } from '../database/entities/push-token.entity';
import { UserNotificationPreference } from '../database/entities/user-notification-preference.entity';
import { User } from '../database/entities/user.entity';
import { Subscription } from '../database/entities/subscription.entity';
import {
  NotificationType,
  NotificationCategory,
  SubscriptionStatus,
} from '../database/db-enums';
import * as admin from 'firebase-admin';
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
  private firebaseApp: admin.app.App | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    @InjectRepository(UserNotificationPreference)
    private readonly prefRepo: Repository<UserNotificationPreference>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {
    if (!admin.apps.length) {
      const jsonCred = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      try {
        if (jsonCred) {
          const serviceAccount = JSON.parse(jsonCred) as admin.ServiceAccount;
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        }
      } catch (e) {
        this.logger.warn('Firebase init failed', (e as Error)?.message);
      }
    }
    if (!this.firebaseApp && admin.apps.length) {
      this.firebaseApp = admin.app() as admin.app.App;
    }
  }

  private async sendFcm(
    token: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<boolean> {
    if (!this.firebaseApp) return false;
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        ),
        android: { priority: 'high' as const },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return true;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      if (
        msg.includes('registration-token-not-registered') ||
        msg.includes('invalid-registration-token')
      ) {
        this.logger.debug(`Removing invalid FCM token: ${msg}`);
      } else {
        this.logger.warn(`FCM send failed: ${msg}`);
      }
      return false;
    }
  }

  private getWebappBaseUrl(): string {
    return (process.env.WEBAPP_BASE_URL ?? '').replace(/\/$/, '');
  }

  async findAll(
    userId: number,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const { page = 1, limit = 20, isRead } = filters;
    const where: { userId: number; isRead?: boolean } = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const row = await this.notificationRepo.findOne({ where });
    if (!row) throw new NotFoundException('알림을 찾을 수 없습니다');
    return row;
  }

  async create(dto: CreateNotificationDto) {
    const type = (dto.type as NotificationType) || NotificationType.SYSTEM;
    const category =
      (dto.category as NotificationCategory) || NotificationCategory.GENERAL;
    const now = new Date();
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type,
      category,
      data: dto.data ?? null,
      isRead: false,
      updatedAt: now,
    });
    return this.notificationRepo.save(notification);
  }

  async update(id: number, dto: UpdateNotificationDto, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const notification = await this.notificationRepo.findOne({ where });
    if (!notification) throw new NotFoundException('알림을 찾을 수 없습니다');
    if (dto.title !== undefined) notification.title = dto.title;
    if (dto.message !== undefined) notification.message = dto.message;
    if (dto.isRead !== undefined) {
      notification.isRead = dto.isRead;
      if (dto.isRead) notification.readAt = new Date();
    }
    await this.notificationRepo.save(notification);
    return this.findOne(id);
  }

  async remove(id: number, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const result = await this.notificationRepo.delete(where);
    if (!result.affected)
      throw new NotFoundException('알림을 찾을 수 없습니다');
    return { message: '알림이 삭제되었습니다' };
  }

  async markAsRead(id: number, userId?: number) {
    const where: Record<string, unknown> = { id };
    if (userId !== undefined) where.userId = userId;
    const notification = await this.notificationRepo.findOne({ where });
    if (!notification) throw new NotFoundException('알림을 찾을 수 없습니다');
    const now = new Date();
    await this.notificationRepo.update(id, {
      isRead: true,
      readAt: now,
      updatedAt: now,
    });
    return this.findOne(id);
  }

  async markAllAsRead(userId: number) {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date(), updatedAt: new Date() },
    );
    return { count: result.affected ?? 0 };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async bulkSend(dto: BulkSendDto) {
    let count = 0;
    const now = new Date();
    for (const userId of dto.recipients) {
      await this.notificationRepo.save(
        this.notificationRepo.create({
          userId,
          title: `Template: ${dto.templateId}`,
          message: JSON.stringify(dto.variables ?? {}),
          type: NotificationType.SYSTEM,
          category: NotificationCategory.GENERAL,
          updatedAt: now,
        }),
      );
      count++;
    }
    return { count };
  }

  async deleteAll(userId: number) {
    const result = await this.notificationRepo.delete({ userId });
    return { count: result.affected ?? 0 };
  }

  async getPreferences(userId: number) {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      const now = new Date();
      prefs = this.prefRepo.create({ userId, updatedAt: now });
      await this.prefRepo.save(prefs);
    }
    return prefs;
  }

  async pushSubscribe(userId: number, dto: PushSubscribeDto) {
    if (!dto.token || typeof dto.token !== 'string' || dto.token.length < 10) {
      throw new Error('유효하지 않은 푸시 토큰입니다.');
    }
    const existing = await this.pushTokenRepo.findOne({
      where: { userId, token: dto.token },
    });
    if (existing) {
      existing.deviceId = dto.deviceId ?? null;
      await this.pushTokenRepo.save(existing);
    } else {
      const now = new Date();
      await this.pushTokenRepo.save(
        this.pushTokenRepo.create({
          userId,
          token: dto.token,
          deviceId: dto.deviceId ?? null,
          updatedAt: now,
        }),
      );
    }
    return { message: '푸시 알림이 구독되었습니다.' };
  }

  async pushUnsubscribe(userId: number, dto: PushUnsubscribeDto) {
    await this.pushTokenRepo.delete({ userId, token: dto.token });
    return { message: '푸시 알림 구독이 해제되었습니다.' };
  }

  async updatePreferences(
    userId: number,
    dto: UpdateNotificationPreferenceDto,
  ) {
    const prefs = await this.getPreferences(userId);
    if (dto.pushEnabled !== undefined) prefs.pushEnabled = dto.pushEnabled;
    if (dto.raceEnabled !== undefined) prefs.raceEnabled = dto.raceEnabled;
    if (dto.predictionEnabled !== undefined)
      prefs.predictionEnabled = dto.predictionEnabled;
    if (dto.subscriptionEnabled !== undefined)
      prefs.subscriptionEnabled = dto.subscriptionEnabled;
    if (dto.systemEnabled !== undefined)
      prefs.systemEnabled = dto.systemEnabled;
    if (dto.promotionEnabled !== undefined)
      prefs.promotionEnabled = dto.promotionEnabled;
    await this.prefRepo.save(prefs);
    return this.getPreferences(userId);
  }

  async findAllAdmin(filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const [data, total] = await this.notificationRepo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    const mapped = data.map((n) => ({
      ...n,
      user: n.user
        ? { id: n.user.id, email: n.user.email, name: n.user.name }
        : null,
    }));
    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminSend(data: { title: string; message: string; target: string }) {
    let userIds: number[] = [];
    if (data.target === 'all') {
      const users = await this.userRepo.find({
        where: { isActive: true },
        select: ['id'],
      });
      userIds = users.map((u) => u.id);
    } else if (data.target === 'active') {
      const users = await this.userRepo
        .createQueryBuilder('u')
        .where('u.isActive = :active', { active: true })
        .andWhere('u.lastLoginAt IS NOT NULL')
        .select('u.id')
        .getMany();
      userIds = users.map((u) => u.id);
    } else if (data.target === 'subscribers') {
      const subs = await this.subscriptionRepo.find({
        where: { status: SubscriptionStatus.ACTIVE },
        select: ['userId'],
      });
      userIds = [...new Set(subs.map((s) => s.userId))];
    }

    if (userIds.length === 0) {
      return { count: 0, pushSent: 0, message: '발송 대상이 없습니다.' };
    }

    const now = new Date();
    for (const userId of userIds) {
      await this.notificationRepo.save(
        this.notificationRepo.create({
          userId,
          title: data.title,
          message: data.message,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.GENERAL,
          updatedAt: now,
        }),
      );
    }

    let pushSent = 0;
    try {
      const tokens = await this.pushTokenRepo.find({
        where: { userId: In(userIds) },
        select: ['token'],
      });
      if (tokens.length > 0) {
        const baseUrl = this.getWebappBaseUrl();
        const deepLink = baseUrl
          ? `${baseUrl}/mypage/notifications`
          : '/mypage/notifications';
        for (const t of tokens) {
          const ok = await this.sendFcm(t.token, data.title, data.message, {
            type: 'SYSTEM',
            deepLink,
          });
          if (ok) pushSent++;
        }
      }
    } catch (err) {
      this.logger.error('FCM send error', err);
    }
    return {
      count: userIds.length,
      pushSent,
      message: `알림 ${userIds.length}건 저장, 푸시 ${pushSent}건 발송`,
    };
  }

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
    const raceLabel = rcNo ? `${meet || '경주'} ${rcNo}R` : meet || '경주';
    const title = '고신뢰도 AI 예측 준비됨';
    const message = `${raceLabel} — 예측 확률 ${confidencePercent}%. 상세 분석을 확인하세요.`;
    const baseUrl = this.getWebappBaseUrl();
    const deepLink = baseUrl
      ? `${baseUrl}/races/${raceId}`
      : `/races/${raceId}`;
    const dataJson: Record<string, unknown> = {
      raceId,
      predictionId,
      type: 'HIGH_CONFIDENCE',
      deepLink,
    };

    const users = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin(UserNotificationPreference, 'unp', 'unp."userId" = u.id')
      .where('u.isActive = :active', { active: true })
      .andWhere('(unp.id IS NULL OR unp.predictionEnabled = true)')
      .select('u.id')
      .getMany();
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return { count: 0 };

    for (const userId of userIds) {
      await this.notificationRepo.save(
        this.notificationRepo.create({
          userId,
          title,
          message,
          type: NotificationType.PREDICTION,
          category: NotificationCategory.INFO,
          data: dataJson,
        }),
      );
    }
    this.logger.log(
      `[SmartAlert] HIGH_CONFIDENCE: raceId=${raceId} → ${userIds.length} notifications`,
    );

    try {
      const pushTokens = await this.pushTokenRepo.find({
        where: { userId: In(userIds) },
        select: ['token'],
      });
      if (pushTokens.length > 0) {
        let sent = 0;
        for (const t of pushTokens) {
          const ok = await this.sendFcm(t.token, title, message, {
            type: 'HIGH_CONFIDENCE',
            raceId: String(raceId),
            predictionId: String(predictionId),
            deepLink,
          });
          if (ok) sent++;
        }
        this.logger.log(
          `[SmartAlert] Push sent to ${sent}/${pushTokens.length} device(s)`,
        );
      }
    } catch (err) {
      this.logger.warn(
        '[SmartAlert] Push send failed',
        (err as Error)?.message,
      );
    }
    return { count: userIds.length };
  }

  /**
   * First race 30 min reminder — notify users with raceEnabled (type RACE, data.type FIRST_RACE_SOON).
   */
  async notifyFirstRaceSoon(payload: {
    raceId: number;
    rcDate: string;
    meet: string;
    rcNo: string;
    stTime: string | null;
  }): Promise<{ count: number }> {
    const { raceId, meet, rcNo } = payload;
    const raceLabel = rcNo ? `${meet || '경주'} ${rcNo}R` : meet || '경주';
    const title = '첫 경주 30분 전';
    const message = `${raceLabel}이(가) 곧 시작됩니다. 경주 정보를 확인하세요.`;
    const baseUrl = this.getWebappBaseUrl();
    const deepLink = baseUrl
      ? `${baseUrl}/races/${raceId}`
      : `/races/${raceId}`;
    const dataJson: Record<string, unknown> = {
      type: 'FIRST_RACE_SOON',
      raceId,
      deepLink,
    };

    const users = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin(UserNotificationPreference, 'unp', 'unp."userId" = u.id')
      .where('u.isActive = :active', { active: true })
      .andWhere('(unp.id IS NULL OR unp.raceEnabled = true)')
      .select('u.id')
      .getMany();
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return { count: 0 };

    for (const userId of userIds) {
      await this.notificationRepo.save(
        this.notificationRepo.create({
          userId,
          title,
          message,
          type: NotificationType.RACE,
          category: NotificationCategory.INFO,
          data: dataJson,
        }),
      );
    }

    try {
      const pushTokens = await this.pushTokenRepo.find({
        where: { userId: In(userIds) },
        select: ['token'],
      });
      if (pushTokens.length > 0) {
        for (const t of pushTokens) {
          await this.sendFcm(t.token, title, message, {
            type: 'FIRST_RACE_SOON',
            raceId: String(raceId),
            deepLink,
          });
        }
      }
    } catch (err) {
      this.logger.warn(
        '[FirstRaceReminder] Push failed',
        (err as Error)?.message,
      );
    }
    return { count: userIds.length };
  }
}
