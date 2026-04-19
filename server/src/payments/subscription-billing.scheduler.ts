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
   * Every day at 00:00 KST, charge ACTIVE subscriptions with nextBillingDate in KST today.
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul' })
  async runRecurringBilling() {
    // Compute KST today boundaries in UTC
    const nowKst = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );
    const yyyy = nowKst.getFullYear();
    const mm = String(nowKst.getMonth() + 1).padStart(2, '0');
    const dd = String(nowKst.getDate()).padStart(2, '0');
    // KST midnight = UTC previous day 15:00
    const todayStart = new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

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
