import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  // --- Admin Activity ---

  private activityLogErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist')) {
      return 'Activity log table missing. Run: cd server && pnpm prisma db push';
    }
    return msg;
  }

  async logAdminActivity(params: AdminLogParams): Promise<void> {
    try {
      await this.prisma.adminActivityLog.create({
        data: {
          adminUserId: params.adminUserId,
          adminEmail: params.adminEmail,
          action: params.action,
          target: params.target,
          details: (params.details ?? undefined) as Prisma.InputJsonValue | undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log admin activity: ${params.action} — ${this.activityLogErrorMessage(err)}`);
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

    const where: Record<string, unknown> = {};
    if (filters.adminUserId) where.adminUserId = filters.adminUserId;
    if (filters.action) where.action = filters.action;
    if (filters.dateFrom || filters.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      this.prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.adminActivityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  // --- User Activity ---

  async logUserActivity(params: UserLogParams): Promise<void> {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId: params.userId,
          sessionId: params.sessionId,
          event: params.event,
          page: params.page,
          target: params.target,
          metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log user activity: ${params.event} — ${this.activityLogErrorMessage(err)}`);
    }
  }

  async logUserActivities(events: UserLogParams[]): Promise<void> {
    try {
      await this.prisma.userActivityLog.createMany({
        data: events.map((e) => ({
          userId: e.userId,
          sessionId: e.sessionId,
          event: e.event,
          page: e.page,
          target: e.target,
          metadata: (e.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
        })),
      });
    } catch (err) {
      this.logger.warn(`Failed to bulk log user activities — ${this.activityLogErrorMessage(err)}`);
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

    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.event) where.event = filters.event;
    if (filters.dateFrom || filters.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.userActivityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async getUserActivitySummary(userId: number) {
    const [totalEvents, recentEvents, topEvents] = await Promise.all([
      this.prisma.userActivityLog.count({ where: { userId } }),
      this.prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.userActivityLog.groupBy({
        by: ['event'],
        where: { userId },
        _count: { event: true },
        orderBy: { _count: { event: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      recentEvents,
      topEvents: topEvents.map((e) => ({ event: e.event, count: e._count.event })),
    };
  }
}
