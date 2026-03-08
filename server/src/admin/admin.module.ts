import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { User } from '../database/entities/user.entity';
import { Race } from '../database/entities/race.entity';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminRacesController } from './admin-races.controller';
import { AdminResultsController } from './admin-results.controller';
import { AdminPredictionsController } from './admin-predictions.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { KraModule } from '../kra/kra.module';
import { UsersModule } from '../users/users.module';
import { GlobalConfigModule } from '../config/config.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SinglePurchasesModule } from '../single-purchases/single-purchases.module';
import { RacesModule } from '../races/races.module';
import { ResultsModule } from '../results/results.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WeeklyPreviewModule } from '../weekly-preview/weekly-preview.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KraSyncLog,
      Subscription,
      SubscriptionPlan,
      User,
      Race,
      SinglePurchase,
      PredictionTicket,
    ]),
    AuthModule,
    KraModule,
    UsersModule,
    GlobalConfigModule,
    SubscriptionsModule,
    NotificationsModule,
    SinglePurchasesModule,
    RacesModule,
    ResultsModule,
    PredictionsModule,
    PredictionTicketsModule,
    ActivityLogsModule,
    WeeklyPreviewModule,
  ],
  controllers: [
    AdminController,
    AdminAuthController,
    AdminRacesController,
    AdminResultsController,
    AdminPredictionsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
