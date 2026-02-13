import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoints } from '../points/entities/user-points.entity';
import { PointsModule } from '../points/points.module';
import { Race } from '../races/entities/race.entity';
import { Result } from '../results/entities/result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { User } from '../users/entities/user.entity';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { BetValidatorService } from './bet-validator.service';
import { BetResultCheckerService } from './bet-result-checker.service';
import { Bet } from './entities/bet.entity';

/**
 * 베팅 모듈 (자동 결과 확인 추가)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bet,
      UserPoints,
      User,
      Race,
      Result,
      DividendRate,
    ]),
    PointsModule,
  ],
  controllers: [BetsController],
  providers: [BetsService, BetValidatorService, BetResultCheckerService],
  exports: [BetsService],
})
export class BetsModule {}
