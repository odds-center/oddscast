/**
 * Recurring subscription billing: run daily, charge subscriptions whose nextBillingDate is today.
 * @see docs/features/SUBSCRIPTION_PG_TOSSPAYMENTS.md
 */

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionStatus } from '../database/db-enums';
import { PaymentsService } from './payments.service';

@Injectable()
export class SubscriptionBillingScheduler {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly paymentsService: PaymentsService,
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

    const subs = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('s.nextBillingDate >= :start', { start: todayStart })
      .andWhere('s.nextBillingDate < :end', { end: tomorrowStart })
      .andWhere('s.billingKey IS NOT NULL')
      .andWhere('s.customerKey IS NOT NULL')
      .select(['s.id'])
      .getMany();

    for (const sub of subs) {
      await this.paymentsService.requestRecurringBilling(sub.id);
    }
  }
}
