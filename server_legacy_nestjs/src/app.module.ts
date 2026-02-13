import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dns from 'dns';

// DNS 서버 설정 (공용 DNS 사용)
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
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

    // TypeORM 설정 - PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // DATABASE_URL 우선 사용, 없으면 개별 환경변수로 조합
        const dbUrl =
          configService.get('DATABASE_URL') ||
          `postgresql://${configService.get('SUPABASE_DB_USER')}:${configService.get('SUPABASE_DB_PASSWORD')}@${configService.get('SUPABASE_DB_HOST')}:${configService.get('SUPABASE_DB_PORT')}/${configService.get('SUPABASE_DB_NAME')}?sslmode=require`;

        const isDevelopment = configService.get('NODE_ENV') !== 'production';
        const isProduction = configService.get('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          url: dbUrl,
          entities: [
            __dirname + '/**/*.entity{.ts,.js}',
            SubscriptionPlanEntity,
          ],
          // 프로덕션에서는 절대 synchronize를 true로 설정하지 않음!
          synchronize: isDevelopment && configService.get('DB_SYNC') === 'true',
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          migrationsRun: isProduction, // 프로덕션에서는 마이그레이션 자동 실행
          logging:
            configService.get('DB_LOGGING') === 'true'
              ? ['query', 'error']
              : isDevelopment
                ? ['error']
                : false,
          // 클라우드 PostgreSQL SSL 필수
          ssl: { rejectUnauthorized: false },
          extra: {
            // Connection pool 설정 (PostgreSQL 권장)
            max: 20, // 최대 연결 수
            connectionTimeoutMillis: 20000, // 연결 타임아웃 (증가)
            idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
            // DNS 해석 문제 해결을 위한 추가 설정
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
          },
        };
      },
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
