import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';

/**
 * 구독 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), PredictionTicketsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
