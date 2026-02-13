import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentSubscribeDto,
  PaymentPurchaseDto,
} from '../common/dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async processSubscription(userId: string, dto: PaymentSubscribeDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다');

    const billing = await this.prisma.billingHistory.create({
      data: {
        userId,
        amount: plan.totalPrice,
        status: 'SUCCESS',
        pgProvider: dto.paymentMethod,
      },
    });

    return { billing, planName: plan.displayName };
  }

  async processPurchase(userId: string, dto: PaymentPurchaseDto) {
    const billing = await this.prisma.billingHistory.create({
      data: {
        userId,
        amount: dto.amount,
        status: 'SUCCESS',
        pgProvider: dto.paymentMethod,
        pgTransactionId: dto.pgTransactionId,
      },
    });

    return { billing };
  }

  async getHistory(userId: string) {
    return this.prisma.billingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
