import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { BillingHistory } from '../database/entities/billing-history.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionBillingScheduler } from './subscription-billing.scheduler';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionPlan,
      BillingHistory,
      PredictionTicket,
    ]),
    SubscriptionsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionBillingScheduler],
})
export class PaymentsModule {}
