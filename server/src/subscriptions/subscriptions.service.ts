import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscribeDto,
  ActivateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = dto.planId
      ? await this.prisma.subscriptionPlan.findUnique({
          where: { id: dto.planId },
        })
      : await this.prisma.subscriptionPlan.findFirst({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });

    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다');

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        price: plan.totalPrice,
        billingKey: dto.billingKey,
        status: 'PENDING',
      },
      include: { plan: true },
    });
  }

  async activate(id: string, dto: ActivateSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        billingKey: dto.billingKey,
        startedAt: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  async cancel(id: string, dto: CancelSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: dto.reason,
      },
      include: { plan: true },
    });
  }

  async getStatus(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) {
      return { isActive: false, planId: null, monthlyTickets: 0, daysUntilRenewal: null };
    }
    const monthlyTickets = sub.plan?.totalTickets ?? sub.plan?.baseTickets ?? 0;
    let daysUntilRenewal: number | null = null;
    if (sub.nextBillingDate) {
      daysUntilRenewal = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    }
    return {
      isActive: true,
      planId: sub.plan?.displayName ?? sub.plan?.planName ?? sub.planId,
      monthlyTickets,
      daysUntilRenewal: daysUntilRenewal !== null && daysUntilRenewal >= 0 ? daysUntilRenewal : null,
      subscription: sub,
    };
  }

  async cancelByUserId(userId: string, reason?: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundException('활성 구독이 없습니다.');
    return this.cancel(sub.id, { reason });
  }

  async getHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
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

  async updatePlan(id: string, data: Partial<{
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
  }>) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });
  }
}
