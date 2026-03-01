import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PgService } from '../database/pg.service';
import { NotificationType, NotificationCategory } from '../database/db-enums';
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

  constructor(private readonly db: PgService) {
    this.expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }

  private getWebappBaseUrl(): string {
    return (process.env.WEBAPP_BASE_URL ?? '').replace(/\/$/, '');
  }

  async findAll(
    userId: number,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const { page = 1, limit = 20, isRead } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['"userId" = $1'];
    const params: unknown[] = [userId];
    if (isRead !== undefined) {
      conditions.push('"isRead" = $2');
      params.push(isRead);
    }
    const where = conditions.join(' AND ');
    const countParams = params.slice(0, conditions.length);
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM notifications WHERE ${where}`,
        countParams,
      ),
      this.db.query(
        `SELECT * FROM notifications WHERE ${where} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    return { notifications: rowsRes.rows, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const { rows } = await this.db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('알림을 찾을 수 없습니다');
    return rows[0];
  }

  async create(dto: CreateNotificationDto) {
    const now = new Date();
    const type = (dto.type as NotificationType) || 'SYSTEM';
    const category = (dto.category as NotificationCategory) || 'GENERAL';
    const { rows } = await this.db.query(
      `INSERT INTO notifications ("userId", title, message, type, category, data, "isRead", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, false, $7, $7) RETURNING *`,
      [
        dto.userId,
        dto.title,
        dto.message,
        type,
        category,
        dto.data != null ? JSON.stringify(dto.data) : null,
        now,
      ],
    );
    return rows[0];
  }

  async update(id: number, dto: UpdateNotificationDto) {
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (dto.title !== undefined) {
      updates.push(`title = $${i++}`);
      values.push(dto.title);
    }
    if (dto.message !== undefined) {
      updates.push(`message = $${i++}`);
      values.push(dto.message);
    }
    if (dto.isRead !== undefined) {
      updates.push(`"isRead" = $${i++}`);
      values.push(dto.isRead);
      if (dto.isRead) {
        updates.push(`"readAt" = $${i++}`);
        values.push(new Date());
      }
    }
    if (updates.length === 0) return this.findOne(id);
    updates.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), id);
    await this.db.query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${i}`,
      values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.db.query('DELETE FROM notifications WHERE id = $1', [id]);
    return { message: '알림이 삭제되었습니다' };
  }

  async markAsRead(id: number) {
    const now = new Date();
    await this.db.query(
      'UPDATE notifications SET "isRead" = true, "readAt" = $1, "updatedAt" = $1 WHERE id = $2',
      [now, id],
    );
    return this.findOne(id);
  }

  async markAllAsRead(userId: number) {
    const now = new Date();
    const r = await this.db.query(
      'UPDATE notifications SET "isRead" = true, "readAt" = $1, "updatedAt" = $1 WHERE "userId" = $2 AND "isRead" = false',
      [now, userId],
    );
    return { count: r.rowCount ?? 0 };
  }

  async getUnreadCount(userId: number) {
    const { rows } = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE "userId" = $1 AND "isRead" = false',
      [userId],
    );
    return { count: parseInt(rows[0]?.count ?? '0', 10) };
  }

  async bulkSend(dto: BulkSendDto) {
    const now = new Date();
    let count = 0;
    for (const userId of dto.recipients) {
      await this.db.query(
        `INSERT INTO notifications ("userId", title, message, type, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'SYSTEM', 'GENERAL', $4, $4)`,
        [
          userId,
          `Template: ${dto.templateId}`,
          JSON.stringify(dto.variables || {}),
          now,
        ],
      );
      count++;
    }
    return { count };
  }

  async deleteAll(userId: number) {
    const r = await this.db.query('DELETE FROM notifications WHERE "userId" = $1', [userId]);
    return { count: r.rowCount ?? 0 };
  }

  async getPreferences(userId: number) {
    let { rows } = await this.db.query(
      'SELECT * FROM user_notification_preferences WHERE "userId" = $1',
      [userId],
    );
    if (!rows[0]) {
      const now = new Date();
      await this.db.query(
        `INSERT INTO user_notification_preferences ("userId", "createdAt", "updatedAt") VALUES ($1, $2, $2)`,
        [userId, now],
      );
      const res = await this.db.query(
        'SELECT * FROM user_notification_preferences WHERE "userId" = $1',
        [userId],
      );
      rows = res.rows;
    }
    return rows[0];
  }

  async pushSubscribe(userId: number, dto: PushSubscribeDto) {
    if (!Expo.isExpoPushToken(dto.token)) {
      throw new Error('유효하지 않은 Expo Push Token입니다.');
    }
    const now = new Date();
    await this.db.query(
      `INSERT INTO push_tokens ("userId", token, "deviceId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT ("userId", token) DO UPDATE SET "deviceId" = $3, "updatedAt" = $4`,
      [userId, dto.token, dto.deviceId ?? null, now],
    );
    return { message: '푸시 알림이 구독되었습니다.' };
  }

  async pushUnsubscribe(userId: number, dto: PushUnsubscribeDto) {
    await this.db.query('DELETE FROM push_tokens WHERE "userId" = $1 AND token = $2', [
      userId,
      dto.token,
    ]);
    return { message: '푸시 알림 구독이 해제되었습니다.' };
  }

  async updatePreferences(userId: number, dto: UpdateNotificationPreferenceDto) {
    const prefs = await this.getPreferences(userId);
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const fields = [
      'pushEnabled',
      'raceEnabled',
      'predictionEnabled',
      'subscriptionEnabled',
      'systemEnabled',
      'promotionEnabled',
    ] as const;
    for (const key of fields) {
      if (dto[key] !== undefined) {
        updates.push(`"${key}" = $${i++}`);
        values.push(dto[key]);
      }
    }
    const now = new Date();
    if (updates.length > 0) {
      updates.push(`"updatedAt" = $${i++}`);
      values.push(now, userId);
      await this.db.query(
        `UPDATE user_notification_preferences SET ${updates.join(', ')} WHERE "userId" = $${i}`,
        values,
      );
    }
    return this.getPreferences(userId);
  }

  async findAllAdmin(filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM notifications', []),
      this.db.query(
        `SELECT n.*, u.id AS "user_id", u.email AS "user_email", u.name AS "user_name"
         FROM notifications n LEFT JOIN users u ON u.id = n."userId" ORDER BY n."createdAt" DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    const data = rowsRes.rows.map((r: Record<string, unknown>) => ({
      ...r,
      user: r.user_id != null ? { id: r.user_id, email: r.user_email, name: r.user_name } : null,
    }));
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminSend(data: { title: string; message: string; target: string }) {
    let userIds: number[] = [];
    if (data.target === 'all') {
      const { rows } = await this.db.query<{ id: number }>(
        'SELECT id FROM users WHERE "isActive" = true',
        [],
      );
      userIds = rows.map((r) => r.id);
    } else if (data.target === 'active') {
      const { rows } = await this.db.query<{ id: number }>(
        'SELECT id FROM users WHERE "isActive" = true AND "lastLoginAt" IS NOT NULL',
        [],
      );
      userIds = rows.map((r) => r.id);
    } else if (data.target === 'subscribers') {
      const { rows } = await this.db.query<{ userId: number }>(
        'SELECT DISTINCT "userId" FROM subscriptions WHERE status = \'ACTIVE\'',
        [],
      );
      userIds = rows.map((r) => r.userId);
    }

    if (userIds.length === 0) {
      return { count: 0, pushSent: 0, message: '발송 대상이 없습니다.' };
    }

    const now = new Date();
    for (const userId of userIds) {
      await this.db.query(
        `INSERT INTO notifications ("userId", title, message, type, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'SYSTEM', 'GENERAL', $4, $4)`,
        [userId, data.title, data.message, now],
      );
    }
    let pushSent = 0;
    try {
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
      const { rows: tokens } = await this.db.query<{ token: string }>(
        `SELECT pt.token FROM push_tokens pt WHERE pt."userId" IN (${placeholders})`,
        userIds,
      );
      if (tokens.length > 0) {
        const baseUrl = this.getWebappBaseUrl();
        const deepLink = baseUrl ? `${baseUrl}/mypage/notifications` : '/mypage/notifications';
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
          for (const r of receipts) {
            if (r.status === 'ok') pushSent++;
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
    const { raceId, predictionId, meet = '', rcNo = '', confidencePercent } = payload;
    const raceLabel = rcNo ? `${meet || '경주'} ${rcNo}R` : meet || '경주';
    const title = '고신뢰도 AI 예측 준비됨';
    const message = `${raceLabel} — 예측 확률 ${confidencePercent}%. 상세 분석을 확인하세요.`;
    const baseUrl = this.getWebappBaseUrl();
    const deepLink = baseUrl ? `${baseUrl}/races/${raceId}` : `/races/${raceId}`;
    const dataJson = JSON.stringify({
      raceId,
      predictionId,
      type: 'HIGH_CONFIDENCE',
      deepLink,
    });

    const { rows: users } = await this.db.query<{ id: number }>(
      `SELECT u.id FROM users u
       LEFT JOIN user_notification_preferences unp ON unp."userId" = u.id
       WHERE u."isActive" = true AND (unp.id IS NULL OR unp."predictionEnabled" = true)`,
      [],
    );
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return { count: 0 };

    const now = new Date();
    for (const userId of userIds) {
      await this.db.query(
        `INSERT INTO notifications ("userId", title, message, type, category, data, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'PREDICTION', 'INFO', $4, $5, $5)`,
        [userId, title, message, dataJson, now],
      );
    }
    this.logger.log(
      `[SmartAlert] HIGH_CONFIDENCE: raceId=${raceId} → ${userIds.length} notifications`,
    );

    try {
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
      const { rows: tokens } = await this.db.query<{ token: string }>(
        `SELECT token FROM push_tokens WHERE "userId" IN (${placeholders})`,
        userIds,
      );
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
        this.logger.log(`[SmartAlert] Push sent to ${tokens.length} device(s) with deepLink`);
      }
    } catch (err) {
      this.logger.warn('[SmartAlert] Push send failed', (err as Error)?.message);
    }
    return { count: userIds.length };
  }
}
