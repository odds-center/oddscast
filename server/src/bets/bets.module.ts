import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { Bet } from '../entities/bet.entity';
import { UserPoints } from '../entities/user-points.entity';
import { User } from '../entities/user.entity';
import { Race } from '../entities/race.entity';
import { DividendRate } from '../entities/dividend-rate.entity';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet, UserPoints, User, Race, DividendRate]),
    PointsModule,
  ],
  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule {}
