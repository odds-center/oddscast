import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Core
import { PrismaModule } from './prisma/prisma.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { RacesModule } from './races/races.module';
import { ResultsModule } from './results/results.module';
import { PredictionsModule } from './predictions/predictions.module';
import { UsersModule } from './users/users.module';
import { FavoritesModule } from './favorites/favorites.module';

import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RankingsModule } from './rankings/rankings.module';
import { PaymentsModule } from './payments/payments.module';
import { PredictionTicketsModule } from './prediction-tickets/prediction-tickets.module';
import { SinglePurchasesModule } from './single-purchases/single-purchases.module';
import { PointsModule } from './points/points.module';
import { BetsModule } from './bets/bets.module';
import { PicksModule } from './picks/picks.module';
import { KraModule } from './kra/kra.module';
import { AnalysisModule } from './analysis/analysis.module';
import { HorsesModule } from './horses/horses.module';
import { JockeysModule } from './jockeys/jockeys.module';
import { TrainersModule } from './trainers/trainers.module';
import { FortuneModule } from './fortune/fortune.module';
import { ReferralsModule } from './referrals/referrals.module';
import { WeeklyPreviewModule } from './weekly-preview/weekly-preview.module';
import { AdminModule } from './admin/admin.module';
import { GlobalConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache/cache.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule, // nginx/LB 헬스체크 — /health
    CacheModule, // Redis(선택) / 인메모리 캐시

    // P0 — Core
    AuthModule,
    RacesModule,
    ResultsModule,
    PredictionsModule,
    AnalysisModule,
    HorsesModule,
    JockeysModule,
    TrainersModule,
    FortuneModule,

    // P1 — Features
    UsersModule,
    FavoritesModule,
    PredictionTicketsModule,
    PicksModule, // 내가 고른 말 (사행성 없음)

    // P2 — Monetization & Social
    ReferralsModule,
    WeeklyPreviewModule,
    NotificationsModule,
    SubscriptionsModule,
    PaymentsModule,
    RankingsModule,
    SinglePurchasesModule,
    PointsModule,
    BetsModule,
    KraModule,
    AdminModule,
    GlobalConfigModule,
    ActivityLogsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
