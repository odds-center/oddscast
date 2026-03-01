import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { GlobalConfigModule } from '../config/config.module';
import { SinglePurchasesController } from './single-purchases.controller';
import { SinglePurchasesService } from './single-purchases.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SinglePurchase, PredictionTicket]),
    GlobalConfigModule,
  ],
  controllers: [SinglePurchasesController],
  providers: [SinglePurchasesService],
  exports: [SinglePurchasesService],
})
export class SinglePurchasesModule {}
