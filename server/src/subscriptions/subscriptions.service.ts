import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { SubscriptionStatus } from '../database/db-enums';
import { TicketType, TicketStatus } from '../database/db-enums';
import { randomUUID } from 'crypto';
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

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan) private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(PredictionTicket)
    private readonly predictionTicketRepo: Repository<PredictionTicket>,
    private readonly dataSource: DataSource,
  ) {}

  private async resolvePlan(planId?: string | number): Promise<SubscriptionPlan> {
    if (planId != null && planId !== '') {
      const plan = await this.planRepo.findOne({
        where: { id: Number(planId) },
      });
      if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다.');
      return plan;
    }
    const plan = await this.planRepo.findOne({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
    if (!plan) throw new NotFoundException('활성 플랜이 없습니다.');
    return plan;
  }

  private toPlanRow(plan: SubscriptionPlan): SubscriptionPlanRow {
    return {
      id: plan.id,
      planName: plan.planName,
      displayName: plan.displayName,
      description: plan.description ?? null,
      totalPrice: plan.totalPrice,
      totalTickets: plan.totalTickets,
      matrixTickets: plan.matrixTickets,
      isActive: plan.isActive,
    };
  }

  private toSubWithPlan(sub: Subscription & { plan?: SubscriptionPlan }) {
    const plan = sub.plan;
    return {
      ...sub,
      plan: plan ? this.toPlanRow(plan) : undefined,
    };
  }

  async subscribe(userId: number, dto: SubscribeDto) {
    const hasActive = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
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

    const customerKey = randomUUID();
    const now = new Date();
    const sub = await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        userId,
        planId: plan.id,
        price: plan.totalPrice,
        customerKey,
        billingKey: dto.billingKey ?? null,
        status: SubscriptionStatus.PENDING,
        startedAt: now,
      }),
    );
    const withPlan = await this.subscriptionRepo.findOne({
      where: { id: sub.id },
      relations: ['plan'],
    });
    return withPlan ? this.toSubWithPlan(withPlan) : sub;
  }

  async activate(id: number, userId: number, dto: ActivateSubscriptionDto) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new BadRequestException('본인의 구독만 활성화할 수 있습니다.');
    }
    if (sub.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException(
        `이미 ${sub.status} 상태입니다. PENDING 구독만 활성화할 수 있습니다.`,
      );
    }

    const plan = sub.plan;
    if (!plan) throw new NotFoundException('플랜 정보를 찾을 수 없습니다.');

    const startedAt = new Date();
    const nextBillingDate = new Date(startedAt);
    nextBillingDate.setDate(nextBillingDate.getDate() + BILLING_PERIOD_DAYS);
    const ticketsToIssue = plan.totalTickets ?? plan.baseTickets ?? 0;
    const matrixTicketsToIssue = plan.matrixTickets ?? 0;
    const ticketExpiresAt = new Date(nextBillingDate);

    await this.dataSource.transaction(async (manager) => {
      const subRepo = manager.getRepository(Subscription);
      await subRepo.update(id, {
        status: SubscriptionStatus.ACTIVE,
        billingKey: dto.billingKey ?? sub.billingKey,
        startedAt,
        nextBillingDate,
        updatedAt: new Date(),
      });
      const ticketRepo = manager.getRepository(PredictionTicket);
      const now = new Date();
      for (let i = 0; i < ticketsToIssue; i++) {
        await ticketRepo.save(
          ticketRepo.create({
            userId: sub.userId,
            subscriptionId: id,
            type: TicketType.RACE,
            status: TicketStatus.AVAILABLE,
            expiresAt: ticketExpiresAt,
            issuedAt: now,
          }),
        );
      }
      for (let i = 0; i < matrixTicketsToIssue; i++) {
        await ticketRepo.save(
          ticketRepo.create({
            userId: sub.userId,
            subscriptionId: id,
            type: TicketType.MATRIX,
            status: TicketStatus.AVAILABLE,
            expiresAt: ticketExpiresAt,
            issuedAt: now,
          }),
        );
      }
    });

    const updated = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    const row = updated ? this.toSubWithPlan(updated) : null;
    return {
      ...row,
      ticketsIssued: ticketsToIssue,
      matrixTicketsIssued: matrixTicketsToIssue,
    };
  }

  async cancel(id: number, userId: number, dto: CancelSubscriptionDto) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new BadRequestException('본인의 구독만 취소할 수 있습니다.');
    }
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('이미 취소된 구독입니다.');
    }
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('활성 구독만 취소할 수 있습니다.');
    }

    const now = new Date();
    await this.subscriptionRepo.update(id, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: now,
      cancelReason: dto.reason ?? null,
      updatedAt: now,
    });
    const updated = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    return updated ? this.toSubWithPlan(updated) : sub;
  }

  async getStatus(userId: number): Promise<SubscriptionStatusResult> {
    const sub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
    if (!sub || !sub.plan) {
      return {
        isActive: false,
        planId: null,
        planDisplayName: null,
        monthlyTickets: 0,
        remainingTickets: 0,
        daysUntilRenewal: null,
      };
    }

    const plan = sub.plan;
    const monthlyTickets = plan.totalTickets ?? plan.baseTickets ?? 0;
    const now = new Date();
    const remainingTickets = await this.predictionTicketRepo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.subscriptionId = :subId', { subId: sub.id })
      .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
      .andWhere('t.expiresAt >= :now', { now })
      .getCount();

    let daysUntilRenewal: number | null = null;
    if (sub.nextBillingDate) {
      const diff = Math.ceil(
        (new Date(sub.nextBillingDate).getTime() - Date.now()) /
          (24 * 60 * 60 * 1000),
      );
      daysUntilRenewal = diff >= 0 ? diff : null;
    }

    const planRow = this.toPlanRow(plan);
    return {
      isActive: true,
      planId: sub.planId,
      planDisplayName: plan.displayName,
      monthlyTickets,
      remainingTickets,
      daysUntilRenewal,
      subscription: { ...sub, plan: planRow } as SubscriptionRow & {
        plan: SubscriptionPlanRow;
      },
    };
  }

  async cancelByUserId(userId: number, reason?: string) {
    const sub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    if (!sub) throw new NotFoundException('활성 구독이 없습니다.');
    return this.cancel(sub.id, userId, { reason });
  }

  async getHistory(userId: number, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const [subscriptions, total] = await this.subscriptionRepo.findAndCount({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    const list = subscriptions.map((s) => this.toSubWithPlan(s));
    return {
      subscriptions: list,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getPlans() {
    return this.planRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPlansAdmin() {
    return this.planRepo.find({ order: { sortOrder: 'ASC' } });
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
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다.');
    if (data.displayName !== undefined) plan.displayName = data.displayName;
    if (data.description !== undefined) plan.description = data.description;
    if (data.originalPrice !== undefined) plan.originalPrice = data.originalPrice;
    if (data.vat !== undefined) plan.vat = data.vat;
    if (data.totalPrice !== undefined) plan.totalPrice = data.totalPrice;
    if (data.baseTickets !== undefined) plan.baseTickets = data.baseTickets;
    if (data.bonusTickets !== undefined) plan.bonusTickets = data.bonusTickets;
    if (data.totalTickets !== undefined) plan.totalTickets = data.totalTickets;
    if (data.isActive !== undefined) plan.isActive = data.isActive;
    if (data.sortOrder !== undefined) plan.sortOrder = data.sortOrder;
    await this.planRepo.save(plan);
    return this.planRepo.findOne({ where: { id } });
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
    const existing = await this.planRepo.findOne({
      where: { planName: data.planName },
    });
    if (existing) {
      throw new BadRequestException(
        `플랜 코드 '${data.planName}'가 이미 존재합니다.`,
      );
    }
    const plan = this.planRepo.create({
      planName: data.planName,
      displayName: data.displayName,
      description: data.description ?? null,
      originalPrice: data.originalPrice,
      vat: data.vat,
      totalPrice: data.totalPrice,
      baseTickets: data.baseTickets,
      bonusTickets: data.bonusTickets,
      totalTickets: data.totalTickets,
      matrixTickets: 0,
      isActive: data.isActive !== false,
      sortOrder: data.sortOrder ?? 0,
    });
    return this.planRepo.save(plan);
  }

  async deletePlan(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다.');
    const count = await this.subscriptionRepo.count({ where: { planId: id } });
    if (count > 0) {
      plan.isActive = false;
      await this.planRepo.save(plan);
      return this.planRepo.findOne({ where: { id } });
    }
    await this.planRepo.delete(id);
    return plan;
  }
}
