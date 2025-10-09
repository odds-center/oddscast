import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BatchModule } from './batch/batch.module';
import { BetsModule } from './bets/bets.module';
import { DataSourceModule } from './data-source/data-source.module';
import { FavoritesModule } from './favorites/favorites.module';
import { KraApiModule } from './kra-api/kra-api.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PointsModule } from './points/points.module';
import { RacePlansModule } from './race-plans/race-plans.module';
import { RacesModule } from './races/races.module';
import { RankingsModule } from './rankings/rankings.module';
import { ResultsModule } from './results/results.module';
import { SocialModule } from './social/social.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
    AuthModule,
    UsersModule,
    RacesModule,
    ResultsModule,
    RacePlansModule,
    RankingsModule,
    SocialModule,
    KraApiModule,
    BatchModule,
    DataSourceModule,
    BetsModule,
    FavoritesModule,
    NotificationsModule,
    PointsModule,
  ],
})
export class AppModule {}
