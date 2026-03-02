import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminActivityLog } from '../database/entities/admin-activity-log.entity';
import { UserActivityLog } from '../database/entities/user-activity-log.entity';

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

  constructor(
    @InjectRepository(AdminActivityLog)
    private readonly adminLogRepo: Repository<AdminActivityLog>,
    @InjectRepository(UserActivityLog)
    private readonly userLogRepo: Repository<UserActivityLog>,
  ) {}

  private activityLogErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist')) {
      return 'Activity log table missing. Run ./scripts/setup.sh or psql $DATABASE_URL -f docs/db/schema.sql';
    }
    return msg;
  }

  async logAdminActivity(params: AdminLogParams): Promise<void> {
    try {
      await this.adminLogRepo.save(
        this.adminLogRepo.create({
          adminUserId: params.adminUserId ?? null,
          adminEmail: params.adminEmail ?? null,
          action: params.action,
          target: params.target ?? null,
          details: params.details ?? null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        }),
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

    const qb = this.adminLogRepo.createQueryBuilder('a');
    if (filters.adminUserId != null) {
      qb.andWhere('a.adminUserId = :adminUserId', {
        adminUserId: filters.adminUserId,
      });
    }
    if (filters.action) {
      qb.andWhere('a.action = :action', { action: filters.action });
    }
    if (filters.dateFrom) {
      qb.andWhere('a.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }
    if (filters.dateTo) {
      qb.andWhere('a.createdAt <= :dateTo', {
        dateTo: new Date(filters.dateTo + 'T23:59:59.999Z'),
      });
    }
    qb.orderBy('a.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async logUserActivity(params: UserLogParams): Promise<void> {
    try {
      await this.userLogRepo.save(
        this.userLogRepo.create({
          userId: params.userId ?? null,
          sessionId: params.sessionId ?? null,
          event: params.event,
          page: params.page ?? null,
          target: params.target ?? null,
          metadata: params.metadata ?? null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        }),
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

    const qb = this.userLogRepo.createQueryBuilder('u');
    if (filters.userId != null) {
      qb.andWhere('u.userId = :userId', { userId: filters.userId });
    }
    if (filters.event) {
      qb.andWhere('u.event = :event', { event: filters.event });
    }
    if (filters.dateFrom) {
      qb.andWhere('u.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }
    if (filters.dateTo) {
      qb.andWhere('u.createdAt <= :dateTo', {
        dateTo: new Date(filters.dateTo + 'T23:59:59.999Z'),
      });
    }
    qb.orderBy('u.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async getUserActivitySummary(userId: number) {
    const [totalEvents, recentEvents, topRows] = await Promise.all([
      this.userLogRepo.count({ where: { userId } }),
      this.userLogRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.userLogRepo
        .createQueryBuilder('u')
        .select('u.event', 'event')
        .addSelect('COUNT(*)', 'count')
        .where('u.userId = :userId', { userId })
        .groupBy('u.event')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ event: string; count: string }>(),
    ]);

    return {
      totalEvents,
      recentEvents,
      topEvents: topRows.map((r) => ({
        event: r.event,
        count: parseInt(r.count, 10),
      })),
    };
  }
}
