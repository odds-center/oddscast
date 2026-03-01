import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PgService } from '../database/pg.service';
import {
  SubscribeDto,
  ActivateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';
import type { SubscriptionPlanRow, SubscriptionRow } from '../database/db-enums';

const BILLING_PERIOD_DAYS = 30;

export interface SubscriptionStatusResult {
  isActive: boolean;
  planId: string | number | null;
  planDisplayName: string | null;
  monthlyTickets: number;
  remainingTickets: number;
  daysUntilRenewal: number | null;
  subscription?: SubscriptionRow & { plan: SubscriptionPlanRow };
}

interface PlanRow extends SubscriptionPlanRow {
  id: number;
  planName: string;
  baseTickets: number;
  matrixTickets: number;
  sortOrder: number;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly db: PgService) {}

  private async resolvePlan(planId?: string | number): Promise<PlanRow> {
    if (planId != null && planId !== '') {
      const { rows } = await this.db.query<PlanRow>(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [Number(planId)],
      );
      if (!rows[0]) throw new NotFoundException('플랜을 찾을 수 없습니다.');
      return rows[0];
    }
    const { rows } = await this.db.query<PlanRow>(
      'SELECT * FROM subscription_plans WHERE "isActive" = true ORDER BY "sortOrder" ASC LIMIT 1',
      [],
    );
    if (!rows[0]) throw new NotFoundException('활성 플랜이 없습니다.');
    return rows[0];
  }

  async subscribe(userId: number, dto: SubscribeDto) {
    const hasActive = await this.db.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1 AND status = \'ACTIVE\' LIMIT 1',
      [userId],
    );
    if (hasActive.rows[0]) {
      throw new BadRequestException(
        '이미 활성 구독이 있습니다. 취소 후 다시 신청해 주세요.',
      );
    }

    const plan = await this.resolvePlan(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('선택한 플랜은 현재 제공되지 않습니다.');
    }

    const customerKey = randomUUID();
    const now = new Date();
    const { rows } = await this.db.query<{ id: number }>(
      `INSERT INTO subscriptions ("userId", "planId", price, "customerKey", "billingKey", status, "startedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $6, $6) RETURNING id`,
      [userId, plan.id, plan.totalPrice, customerKey, dto.billingKey ?? null, now],
    );
    const id = rows[0]?.id;
    if (id == null) throw new Error('Subscription insert failed');
    const sub = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."planName", p."displayName", p.description, p."totalPrice", p."baseTickets", p."totalTickets", p."matrixTickets", p."isActive"
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s.id = $1`,
      [id],
    );
    const row = sub.rows[0] as Record<string, unknown>;
    return {
      ...row,
      plan: {
        id: row.plan_id,
        planName: row.planName,
        displayName: row.displayName,
        description: row.description,
        totalPrice: row.totalPrice,
        baseTickets: row.baseTickets,
        totalTickets: row.totalTickets,
        matrixTickets: row.matrixTickets,
        isActive: row.isActive,
      },
    };
  }

  async activate(id: number, userId: number, dto: ActivateSubscriptionDto) {
    const subRes = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."planName", p."displayName", p."totalTickets", p."baseTickets", p."matrixTickets"
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s.id = $1`,
      [id],
    );
    const sub = subRes.rows[0] as Record<string, unknown> | undefined;
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new BadRequestException('본인의 구독만 활성화할 수 있습니다.');
    }
    if (sub.status !== 'PENDING') {
      throw new BadRequestException(
        `이미 ${sub.status} 상태입니다. PENDING 구독만 활성화할 수 있습니다.`,
      );
    }

    const startedAt = new Date();
    const nextBillingDate = new Date(startedAt);
    nextBillingDate.setDate(nextBillingDate.getDate() + BILLING_PERIOD_DAYS);
    const ticketsToIssue = Number(sub.totalTickets ?? sub.baseTickets ?? 0);
    const matrixTicketsToIssue = Number(sub.matrixTickets ?? 0);
    const ticketExpiresAt = new Date(nextBillingDate);

    const client = await this.db.getClient();
    if (client) {
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE subscriptions SET status = 'ACTIVE', "billingKey" = $1, "startedAt" = $2, "nextBillingDate" = $3, "updatedAt" = $3 WHERE id = $4`,
          [dto.billingKey ?? sub.billingKey, startedAt, nextBillingDate, id],
        );
        for (let i = 0; i < ticketsToIssue; i++) {
          await client.query(
            `INSERT INTO prediction_tickets ("userId", "subscriptionId", type, status, "expiresAt") VALUES ($1, $2, 'RACE', 'AVAILABLE', $3)`,
            [sub.userId, id, ticketExpiresAt],
          );
        }
        for (let i = 0; i < matrixTicketsToIssue; i++) {
          await client.query(
            `INSERT INTO prediction_tickets ("userId", "subscriptionId", type, status, "expiresAt") VALUES ($1, $2, 'MATRIX', 'AVAILABLE', $3)`,
            [sub.userId, id, ticketExpiresAt],
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    const updated = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."planName", p."displayName", p."totalTickets", p."baseTickets", p."matrixTickets"
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s.id = $1`,
      [id],
    );
    const row = updated.rows[0] as Record<string, unknown>;
    return {
      ...row,
      plan: {
        id: row.plan_id,
        planName: row.planName,
        displayName: row.displayName,
        totalTickets: row.totalTickets,
        baseTickets: row.baseTickets,
        matrixTickets: row.matrixTickets,
      },
      ticketsIssued: ticketsToIssue,
      matrixTicketsIssued: matrixTicketsToIssue,
    };
  }

  async cancel(id: number, userId: number, dto: CancelSubscriptionDto) {
    const subRes = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."displayName", p."planName" FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s.id = $1`,
      [id],
    );
    const sub = subRes.rows[0] as Record<string, unknown> | undefined;
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new BadRequestException('본인의 구독만 취소할 수 있습니다.');
    }
    if (sub.status === 'CANCELLED') {
      throw new BadRequestException('이미 취소된 구독입니다.');
    }
    if (sub.status !== 'ACTIVE') {
      throw new BadRequestException('활성 구독만 취소할 수 있습니다.');
    }

    const now = new Date();
    await this.db.query(
      `UPDATE subscriptions SET status = 'CANCELLED', "cancelledAt" = $1, "cancelReason" = $2, "updatedAt" = $1 WHERE id = $3`,
      [now, dto.reason ?? null, id],
    );
    const updated = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."displayName", p."planName" FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s.id = $1`,
      [id],
    );
    const row = updated.rows[0] as Record<string, unknown>;
    return { ...row, plan: { id: row.plan_id, displayName: row.displayName, planName: row.planName } };
  }

  async getStatus(userId: number): Promise<SubscriptionStatusResult> {
    const subRes = await this.db.query(
      `SELECT s.*, p.id AS "plan_id", p."planName", p."displayName", p."totalTickets", p."baseTickets"
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId"
       WHERE s."userId" = $1 AND s.status = 'ACTIVE' ORDER BY s."createdAt" DESC LIMIT 1`,
      [userId],
    );
    const sub = subRes.rows[0] as Record<string, unknown> | undefined;
    if (!sub) {
      return {
        isActive: false,
        planId: null,
        planDisplayName: null,
        monthlyTickets: 0,
        remainingTickets: 0,
        daysUntilRenewal: null,
      };
    }

    const monthlyTickets = Number(sub.totalTickets ?? sub.baseTickets ?? 0);
    const now = new Date();
    const remainRes = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prediction_tickets WHERE "userId" = $1 AND "subscriptionId" = $2 AND status = 'AVAILABLE' AND "expiresAt" >= $3`,
      [userId, sub.id, now],
    );
    const remainingTickets = parseInt(remainRes.rows[0]?.count ?? '0', 10);

    let daysUntilRenewal: number | null = null;
    if (sub.nextBillingDate) {
      const diff = Math.ceil(
        (new Date(sub.nextBillingDate as Date).getTime() - Date.now()) /
          (24 * 60 * 60 * 1000),
      );
      daysUntilRenewal = diff >= 0 ? diff : null;
    }

    const planRow = {
      id: sub.plan_id,
      planName: sub.planName,
      displayName: sub.displayName,
      description: sub.description,
      totalPrice: sub.totalPrice,
      totalTickets: sub.totalTickets,
      matrixTickets: sub.matrixTickets ?? 0,
      isActive: sub.isActive,
    };
    return {
      isActive: true,
      planId: (sub.planId ?? sub.displayName ?? sub.planName ?? null) as string | number | null,
      planDisplayName: (sub.displayName ?? sub.planName) as string | null,
      monthlyTickets,
      remainingTickets,
      daysUntilRenewal,
      subscription: { ...sub, plan: planRow } as SubscriptionRow & { plan: SubscriptionPlanRow },
    };
  }

  async cancelByUserId(userId: number, reason?: string) {
    const { rows } = await this.db.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1 AND status = \'ACTIVE\' ORDER BY "createdAt" DESC LIMIT 1',
      [userId],
    );
    if (!rows[0]) throw new NotFoundException('활성 구독이 없습니다.');
    return this.cancel((rows[0] as { id: number }).id, userId, { reason });
  }

  async getHistory(userId: number, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM subscriptions WHERE "userId" = $1',
        [userId],
      ),
      this.db.query(
        `SELECT s.*, p.id AS "plan_id", p."planName", p."displayName", p.description, p."totalPrice", p."totalTickets", p."matrixTickets"
         FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" WHERE s."userId" = $1 ORDER BY s."createdAt" DESC LIMIT $2 OFFSET $3`,
        [userId, safeLimit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    const subscriptions = rowsRes.rows.map((r: Record<string, unknown>) => ({
      ...r,
      plan: {
        id: r.plan_id,
        planName: r.planName,
        displayName: r.displayName,
        description: r.description,
        totalPrice: r.totalPrice,
        totalTickets: r.totalTickets,
        matrixTickets: r.matrixTickets,
      },
    }));
    return { subscriptions, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
  }

  async getPlans() {
    const { rows } = await this.db.query(
      'SELECT * FROM subscription_plans WHERE "isActive" = true ORDER BY "sortOrder" ASC',
      [],
    );
    return rows;
  }

  async getPlansAdmin() {
    const { rows } = await this.db.query(
      'SELECT * FROM subscription_plans ORDER BY "sortOrder" ASC',
      [],
    );
    return rows;
  }

  async updatePlan(
    id: number,
    data: Partial<{
      displayName: string;
      description: string;
      originalPrice: number;
      vat: number;
      totalPrice: number;
      baseTickets: number;
      bonusTickets: number;
      totalTickets: number;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    const planCheck = await this.db.query('SELECT id FROM subscription_plans WHERE id = $1', [
      id,
    ]);
    if (!planCheck.rows[0]) throw new NotFoundException('플랜을 찾을 수 없습니다.');
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const keys = [
      'displayName',
      'description',
      'originalPrice',
      'vat',
      'totalPrice',
      'baseTickets',
      'bonusTickets',
      'totalTickets',
      'isActive',
      'sortOrder',
    ] as const;
    for (const key of keys) {
      if (data[key] !== undefined) {
        updates.push(`"${key}" = $${i++}`);
        values.push(data[key]);
      }
    }
    if (updates.length === 0) {
      const r = await this.db.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
      return r.rows[0];
    }
    updates.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), id);
    await this.db.query(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $${i}`,
      values,
    );
    const r = await this.db.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
    return r.rows[0];
  }

  async createPlan(data: {
    planName: string;
    displayName: string;
    description?: string;
    originalPrice: number;
    vat: number;
    totalPrice: number;
    baseTickets: number;
    bonusTickets: number;
    totalTickets: number;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const existing = await this.db.query(
      'SELECT id FROM subscription_plans WHERE "planName" = $1',
      [data.planName],
    );
    if (existing.rows[0]) {
      throw new BadRequestException(
        `플랜 코드 '${data.planName}'가 이미 존재합니다.`,
      );
    }
    const now = new Date();
    const { rows } = await this.db.query(
      `INSERT INTO subscription_plans ("planName", "displayName", description, "originalPrice", vat, "totalPrice", "baseTickets", "bonusTickets", "totalTickets", "matrixTickets", "isActive", "sortOrder", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $12) RETURNING *`,
      [
        data.planName,
        data.displayName,
        data.description ?? null,
        data.originalPrice,
        data.vat,
        data.totalPrice,
        data.baseTickets,
        data.bonusTickets,
        data.totalTickets,
        data.isActive !== false,
        data.sortOrder ?? 0,
        now,
      ],
    );
    return rows[0];
  }

  async deletePlan(id: number) {
    const planCheck = await this.db.query('SELECT id FROM subscription_plans WHERE id = $1', [
      id,
    ]);
    if (!planCheck.rows[0]) throw new NotFoundException('플랜을 찾을 수 없습니다.');
    const countRes = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM subscriptions WHERE "planId" = $1',
      [id],
    );
    const count = parseInt(countRes.rows[0]?.count ?? '0', 10);
    if (count > 0) {
      await this.db.query(
        'UPDATE subscription_plans SET "isActive" = false, "updatedAt" = $1 WHERE id = $2',
        [new Date(), id],
      );
      const r = await this.db.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
      return r.rows[0];
    }
    await this.db.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
    return planCheck.rows[0];
  }
}
