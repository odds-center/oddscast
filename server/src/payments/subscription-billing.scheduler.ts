/**
 * Recurring subscription billing: run daily, charge subscriptions whose nextBillingDate is today.
 * @see docs/features/SUBSCRIPTION_PG_TOSSPAYMENTS.md
 */

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PgService } from '../database/pg.service';
import { PaymentsService } from './payments.service';

@Injectable()
export class SubscriptionBillingScheduler {
  constructor(
    private readonly db: PgService,
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

    const res = await this.db.query<{ id: number }>(
      `SELECT id FROM subscriptions
       WHERE status = 'ACTIVE' AND "nextBillingDate" >= $1 AND "nextBillingDate" < $2
         AND "billingKey" IS NOT NULL AND "customerKey" IS NOT NULL`,
      [todayStart, tomorrowStart],
    );
    for (const sub of res.rows) {
      await this.paymentsService.requestRecurringBilling(sub.id);
    }
  }
}
