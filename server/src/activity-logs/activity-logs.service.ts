import { Injectable, Logger } from '@nestjs/common';
import { PgService } from '../database/pg.service';

interface AdminLogParams {
  adminUserId?: number;
  adminEmail?: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface UserLogParams {
  userId?: number;
  sessionId?: string;
  event: string;
  page?: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private readonly db: PgService) {}

  private activityLogErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist')) {
      return 'Activity log table missing. Apply docs/DB_SCHEMA_FULL.sql to your database.';
    }
    return msg;
  }

  async logAdminActivity(params: AdminLogParams): Promise<void> {
    try {
      const now = new Date();
      await this.db.query(
        `INSERT INTO admin_activity_logs ("adminUserId", "adminEmail", action, target, details, "ipAddress", "userAgent", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          params.adminUserId ?? null,
          params.adminEmail ?? null,
          params.action,
          params.target ?? null,
          params.details != null ? JSON.stringify(params.details) : null,
          params.ipAddress ?? null,
          params.userAgent ?? null,
          now,
        ],
      );
    } catch (err) {
      this.logger.warn(
        `Failed to log admin activity: ${params.action} — ${this.activityLogErrorMessage(err)}`,
      );
    }
  }

  async getAdminLogs(
    filters: {
      adminUserId?: number;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
    } & PaginationParams,
  ) {
    const p = Math.max(1, Number(filters.page) || 1);
    const l = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (filters.adminUserId) {
      conditions.push(`"adminUserId" = $${idx++}`);
      values.push(filters.adminUserId);
    }
    if (filters.action) {
      conditions.push(`action = $${idx++}`);
      values.push(filters.action);
    }
    if (filters.dateFrom) {
      conditions.push(`"createdAt" >= $${idx++}`);
      values.push(new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(`"createdAt" <= $${idx++}`);
      values.push(new Date(filters.dateTo + 'T23:59:59.999Z'));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM admin_activity_logs ${where}`,
        values,
      ),
      this.db.query(
        `SELECT * FROM admin_activity_logs ${where} ORDER BY "createdAt" DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, l, (p - 1) * l],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    return {
      data: rowsRes.rows,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async logUserActivity(params: UserLogParams): Promise<void> {
    try {
      const now = new Date();
      await this.db.query(
        `INSERT INTO user_activity_logs ("userId", "sessionId", event, page, target, metadata, "ipAddress", "userAgent", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          params.userId ?? null,
          params.sessionId ?? null,
          params.event,
          params.page ?? null,
          params.target ?? null,
          params.metadata != null ? JSON.stringify(params.metadata) : null,
          params.ipAddress ?? null,
          params.userAgent ?? null,
          now,
        ],
      );
    } catch (err) {
      this.logger.warn(
        `Failed to log user activity: ${params.event} — ${this.activityLogErrorMessage(err)}`,
      );
    }
  }

  async logUserActivities(events: UserLogParams[]): Promise<void> {
    for (const e of events) {
      await this.logUserActivity(e);
    }
  }

  async getUserLogs(
    filters: {
      userId?: number;
      event?: string;
      dateFrom?: string;
      dateTo?: string;
    } & PaginationParams,
  ) {
    const p = Math.max(1, Number(filters.page) || 1);
    const l = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (filters.userId) {
      conditions.push(`"userId" = $${idx++}`);
      values.push(filters.userId);
    }
    if (filters.event) {
      conditions.push(`event = $${idx++}`);
      values.push(filters.event);
    }
    if (filters.dateFrom) {
      conditions.push(`"createdAt" >= $${idx++}`);
      values.push(new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(`"createdAt" <= $${idx++}`);
      values.push(new Date(filters.dateTo + 'T23:59:59.999Z'));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM user_activity_logs ${where}`,
        values,
      ),
      this.db.query(
        `SELECT * FROM user_activity_logs ${where} ORDER BY "createdAt" DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, l, (p - 1) * l],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    return {
      data: rowsRes.rows,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async getUserActivitySummary(userId: number) {
    const [totalRes, recentRes, topRes] = await Promise.all([
      this.db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM user_activity_logs WHERE "userId" = $1',
        [userId],
      ),
      this.db.query(
        'SELECT * FROM user_activity_logs WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10',
        [userId],
      ),
      this.db.query<{ event: string; count: string }>(
        'SELECT event, COUNT(*)::text AS count FROM user_activity_logs WHERE "userId" = $1 GROUP BY event ORDER BY COUNT(*) DESC LIMIT 10',
        [userId],
      ),
    ]);
    const totalEvents = parseInt(totalRes.rows[0]?.count ?? '0', 10);
    return {
      totalEvents,
      recentEvents: recentRes.rows,
      topEvents: topRes.rows.map((r) => ({ event: r.event, count: parseInt(r.count, 10) })),
    };
  }
}
