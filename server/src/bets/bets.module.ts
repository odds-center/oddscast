import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoints } from '../points/entities/user-points.entity';
import { PointsModule } from '../points/points.module';
import { Race } from '../races/entities/race.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { User } from '../users/entities/user.entity';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { Bet } from './entities/bet.entity';

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
