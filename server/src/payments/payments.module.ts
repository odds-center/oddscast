import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionBillingScheduler } from './subscription-billing.scheduler';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SubscriptionsModule, DatabaseModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionBillingScheduler],
})
export class PaymentsModule {}
