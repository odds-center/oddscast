import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RacesModule } from './races/races.module';
import { ResultsModule } from './results/results.module';
import { RacePlansModule } from './race-plans/race-plans.module';
import { KraApiModule } from './external-apis/kra/kra-api.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 스케줄러 모듈
    ScheduleModule.forRoot(),

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
        synchronize: configService.get('NODE_ENV') === 'development',
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
  ],
})
export class AppModule {}
