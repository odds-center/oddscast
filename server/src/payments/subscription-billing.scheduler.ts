/**
 * Recurring subscription billing: run daily, charge subscriptions whose nextBillingDate is today.
 * @see docs/features/SUBSCRIPTION_PG_TOSSPAYMENTS.md
 */

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

@Injectable()
export class SubscriptionBillingScheduler {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * Every day at 09:00 KST (00:00 UTC), charge ACTIVE subscriptions with nextBillingDate <= today.
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul' })
  async runRecurringBilling() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const due = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { gte: todayStart, lt: tomorrowStart },
        billingKey: { not: null },
        customerKey: { not: null },
      },
      select: { id: true },
    });

    for (const sub of due) {
      await this.paymentsService.requestRecurringBilling(sub.id);
    }
  }
}
