import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointTransaction } from '../database/entities/point-transaction.entity';
import { PointConfig } from '../database/entities/point-config.entity';
import { PointPromotion } from '../database/entities/point-promotion.entity';
import { PointTicketPrice } from '../database/entities/point-ticket-price.entity';
import { UserPick } from '../database/entities/user-pick.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { PicksModule } from '../picks/picks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointTransaction,
      PointConfig,
      PointPromotion,
      PointTicketPrice,
      UserPick,
      RaceResult,
      PredictionTicket,
    ]),
    PicksModule,
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
