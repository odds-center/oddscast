import { Module } from '@nestjs/common';
import { BetsModule } from '../bets/bets.module';
import { RacesModule } from '../races/races.module';
import { RankingsModule } from '../rankings/rankings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

/**
 * 홈 화면 모듈
 */
@Module({
  imports: [BetsModule, RacesModule, RankingsModule, SubscriptionsModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
