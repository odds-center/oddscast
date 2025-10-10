import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

/**
 * 구독 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionPlanEntity]),
    PredictionTicketsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
