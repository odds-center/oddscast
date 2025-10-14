import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminRacesController } from './controllers/admin-races.controller';
import { AdminResultsController } from './controllers/admin-results.controller';
import { AdminSubscriptionsController } from './controllers/admin-subscriptions.controller';
import { AdminBetsController } from './controllers/admin-bets.controller';
import { AdminStatisticsController } from './controllers/admin-statistics.controller';
import { AdminNotificationsController } from './controllers/admin-notifications.controller';
import { AdminAIConfigController } from './controllers/admin-ai-config.controller';
import { UsersModule } from '../users/users.module';
import { RacesModule } from '../races/races.module';
import { ResultsModule } from '../results/results.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BetsModule } from '../bets/bets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { Bet } from '../bets/entities/bet.entity';
import { Race } from '../races/entities/race.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { AIConfigEntity } from '../llm/entities/ai-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      User,
      Bet,
      Race,
      Subscription,
      AIConfigEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
    UsersModule,
    RacesModule,
    ResultsModule,
    SubscriptionsModule,
    BetsModule,
    NotificationsModule,
  ],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminRacesController,
    AdminResultsController,
    AdminSubscriptionsController,
    AdminBetsController,
    AdminStatisticsController,
    AdminNotificationsController,
    AdminAIConfigController,
  ],
  providers: [AdminService],
  exports: [AdminService, JwtModule],
})
export class AdminModule {}
