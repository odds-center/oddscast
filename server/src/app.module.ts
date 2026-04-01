import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Core
import {
  User,
  Favorite,
  AdminUser,
  PasswordResetToken,
  EmailVerificationToken,
  PredictionTicket,
  Race,
  RaceEntry,
  RaceResult,
  Prediction,
  Training,
  JockeyResult,
  TrainerResult,
  KraSyncLog,
  BatchSchedule,
  GlobalConfig,
  WeeklyPreview,
  UserDailyFortune,
  UserPick,
  Notification,
  PushToken,
  UserNotificationPreference,
  Subscription,
  AdminActivityLog,
  UserActivityLog,
  SinglePurchase,
  SubscriptionPlan,
  BillingHistory,
  RaceDividend,
  RaceAnalysisCache,
} from './database/entities';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

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
import { PicksModule } from './picks/picks.module';
import { KraModule } from './kra/kra.module';
import { AnalysisModule } from './analysis/analysis.module';
import { HorsesModule } from './horses/horses.module';
import { JockeysModule } from './jockeys/jockeys.module';
import { TrainersModule } from './trainers/trainers.module';
import { FortuneModule } from './fortune/fortune.module';
import { WeeklyPreviewModule } from './weekly-preview/weekly-preview.module';
import { AdminModule } from './admin/admin.module';
import { GlobalConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache/cache.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { MailModule } from './mail/mail.module';
import { DiscordModule } from './discord/discord.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 120 }, // 120 req/min per IP (general API)
      { name: 'long', ttl: 3600_000, limit: 2000 }, // 2000 req/hour per IP
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        schema: 'oddscast',
        entities: [
          User,
          Favorite,
          AdminUser,
          PasswordResetToken,
          EmailVerificationToken,
          PredictionTicket,
          Race,
          RaceEntry,
          RaceResult,
          Prediction,
          Training,
          JockeyResult,
          TrainerResult,
          KraSyncLog,
          BatchSchedule,
          GlobalConfig,
          WeeklyPreview,
          UserDailyFortune,
          UserPick,
          Notification,
          PushToken,
          UserNotificationPreference,
          Subscription,
          AdminActivityLog,
          UserActivityLog,
          SinglePurchase,
          SubscriptionPlan,
          BillingHistory,
          RaceDividend,
          RaceAnalysisCache,
        ],
        // Temporarily enable logging in production to diagnose startup hang
        logging: ['error', 'warn', 'schema', 'migration'],
        synchronize: false,
        connectTimeoutMS: 10000,
        extra: {
          connectionTimeoutMillis: 10000,
          max: 5, // reduce pool size to avoid connection saturation
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    MailModule, // Resend email (global)
    DiscordModule, // Discord webhook notifications (global)
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
    WeeklyPreviewModule,
    NotificationsModule,
    SubscriptionsModule,
    PaymentsModule,
    RankingsModule,
    SinglePurchasesModule,
    KraModule,
    AdminModule,
    GlobalConfigModule,
    ActivityLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
