import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminRacesController } from './admin-races.controller';
import { AdminResultsController } from './admin-results.controller';
import { AdminPredictionsController } from './admin-predictions.controller';
import { AuthModule } from '../auth/auth.module';
import { KraModule } from '../kra/kra.module';
import { UsersModule } from '../users/users.module';
import { GlobalConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SinglePurchasesModule } from '../single-purchases/single-purchases.module';
import { RacesModule } from '../races/races.module';
import { ResultsModule } from '../results/results.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [
    AuthModule,
    KraModule,
    UsersModule,
    GlobalConfigModule,
    PrismaModule,
    SubscriptionsModule,
    NotificationsModule,
    SinglePurchasesModule,
    RacesModule,
    ResultsModule,
    PredictionsModule,
  ],
  controllers: [
    AdminController,
    AdminAuthController,
    AdminRacesController,
    AdminResultsController,
    AdminPredictionsController,
  ],
})
export class AdminModule {}
