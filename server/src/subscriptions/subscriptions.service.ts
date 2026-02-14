import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscribeDto,
  ActivateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';
import type { SubscriptionPlan, Subscription } from '@prisma/client';

/** 구독 결제 주기 (일) */
const BILLING_PERIOD_DAYS = 30;

export interface SubscriptionStatusResult {
  isActive: boolean;
  /** 플랜 표시명 (클라이언트 호환용) */
  planId: string | number | null;
  planDisplayName: string | null;
  monthlyTickets: number;
  remainingTickets: number;
  daysUntilRenewal: number | null;
  subscription?: Subscription & { plan: SubscriptionPlan };
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscribe(userId: number, dto: SubscribeDto) {
    const hasActive = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (hasActive) {
      throw new BadRequestException(
        '이미 활성 구독이 있습니다. 취소 후 다시 신청해 주세요.',
      );
    }

    const plan = await this.resolvePlan(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('선택한 플랜은 현재 제공되지 않습니다.');
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        price: plan.totalPrice,
        billingKey: dto.billingKey ?? undefined,
        status: 'PENDING',
      },
      include: { plan: true },
    });
  }

  async activate(id: number, userId: number, dto: ActivateSubscriptionDto) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

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

    const ticketsToIssue = sub.plan.totalTickets;
    const ticketExpiresAt = new Date(nextBillingDate);

    const [updated] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          billingKey: dto.billingKey ?? sub.billingKey,
          startedAt,
          nextBillingDate,
        },
        include: { plan: true },
      }),
      this.prisma.predictionTicket.createMany({
        data: Array.from({ length: ticketsToIssue }, () => ({
          userId: sub.userId,
          subscriptionId: sub.id,
          status: 'AVAILABLE' as const,
          expiresAt: ticketExpiresAt,
        })),
      }),
    ]);

    const ticketsCreated = ticketsToIssue;
    return { ...updated, ticketsIssued: ticketsCreated };
  }

  async cancel(id: number, userId: number, dto: CancelSubscriptionDto) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

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

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: dto.reason ?? undefined,
      },
      include: { plan: true },
    });
  }

  async getStatus(userId: number): Promise<SubscriptionStatusResult> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

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

    const monthlyTickets = sub.plan?.totalTickets ?? sub.plan?.baseTickets ?? 0;

    const remainingTickets = await this.prisma.predictionTicket.count({
      where: {
        userId,
        subscriptionId: sub.id,
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() },
      },
    });

    let daysUntilRenewal: number | null = null;
    if (sub.nextBillingDate) {
      const diff = Math.ceil(
        (new Date(sub.nextBillingDate).getTime() - Date.now()) /
          (24 * 60 * 60 * 1000),
      );
      daysUntilRenewal = diff >= 0 ? diff : null;
    }

    return {
      isActive: true,
      planId: sub.plan?.displayName ?? sub.plan?.planName ?? String(sub.planId),
      planDisplayName: sub.plan?.displayName ?? sub.plan?.planName ?? null,
      monthlyTickets,
      remainingTickets,
      daysUntilRenewal,
      subscription: sub,
    };
  }

  async cancelByUserId(userId: number, reason?: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundException('활성 구독이 없습니다.');
    return this.cancel(sub.id, userId, { reason });
  }

  async getHistory(userId: number, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.subscription.count({ where: { userId } }),
    ]);

    return {
      subscriptions,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlansAdmin() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
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
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다.');

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });
  }

  private async resolvePlan(planId?: string | number) {
    if (planId != null && planId !== '') {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: Number(planId) },
      });
      if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다.');
      return plan;
    }
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (!plan) throw new NotFoundException('활성 플랜이 없습니다.');
    return plan;
  }
}
