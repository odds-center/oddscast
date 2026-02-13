import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinglePurchasesController } from './single-purchases.controller';
import { SinglePurchasesService } from './single-purchases.service';
import { SinglePurchase } from './entities/single-purchase.entity';
import { SinglePurchaseConfig } from './entities/single-purchase-config.entity';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';

/**
 * 개별 구매 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SinglePurchase, SinglePurchaseConfig]),
    PredictionTicketsModule,
  ],
  controllers: [SinglePurchasesController],
  providers: [SinglePurchasesService],
  exports: [SinglePurchasesService],
})
export class SinglePurchasesModule {}
