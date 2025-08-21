import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RacesModule } from './races/races.module';
import { ResultsModule } from './results/results.module';
import { RacePlansModule } from './race-plans/race-plans.module';
import { KraApiModule } from './external-apis/kra/kra-api.module';
import { BetsModule } from './bets/bets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PointsModule } from './points/points.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

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
        logging: configService.get('NODE_ENV') === 'development',
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
    KraApiModule,
    BetsModule,
    NotificationsModule,
    PointsModule,
  ],
})
export class AppModule {}
