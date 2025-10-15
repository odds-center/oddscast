import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BatchModule } from './batch/batch.module';
import { BetsModule } from './bets/bets.module';
import { DataSourceModule } from './data-source/data-source.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { KraApiModule } from './kra-api/kra-api.module';
import { LlmModule } from './llm/llm.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module'; // Toss Payments
import { PointsModule } from './points/points.module';
import { PredictionTicketsModule } from './prediction-tickets/prediction-tickets.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RacePlansModule } from './race-plans/race-plans.module';
import { RacesModule } from './races/races.module';
import { RankingsModule } from './rankings/rankings.module';
import { ResultsModule } from './results/results.module';
import { SinglePurchasesModule } from './single-purchases/single-purchases.module';
import { SocialModule } from './social/social.module';
import { SubscriptionPlanEntity } from './subscriptions/entities/subscription-plan.entity';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 글로벌 캐시 모듈
    CacheModule,

    // 스케줄러 모듈 (개발 환경에서는 비활성화)
    ...(process.env.NODE_ENV === 'production'
      ? [ScheduleModule.forRoot()]
      : []),

    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'goldenrace_user'),
        password: configService.get('DB_PASSWORD', 'goldenrace_password'),
        database: configService.get('DB_DATABASE', 'goldenrace'),
        entities: [__dirname + '/**/*.entity{.ts,.js}', SubscriptionPlanEntity],
        synchronize: false, // 개발 환경에서도 안전하게 false로 설정
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: false, // 자동 마이그레이션 비활성화
        logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : false, // 환경변수로 제어
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),

    // 기능 모듈들
    HealthModule,
    AdminModule,
    AuthModule,
    UsersModule,
    HomeModule,
    RacesModule,
    ResultsModule,
    RacePlansModule,
    RankingsModule,
    SocialModule,
    KraApiModule,
    LlmModule, // AI LLM
    PredictionsModule, // AI 예측
    PredictionTicketsModule, // 예측권
    SubscriptionsModule, // 구독
    SinglePurchasesModule, // 개별 구매
    PaymentsModule, // 결제 (Toss)
    BatchModule,
    DataSourceModule,
    BetsModule,
    FavoritesModule,
    NotificationsModule,
    PointsModule,
  ],
})
export class AppModule {}
