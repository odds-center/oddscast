import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KraModule } from '../kra/kra.module';
import { UsersModule } from '../users/users.module';
import { GlobalConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SinglePurchasesModule } from '../single-purchases/single-purchases.module';

@Module({
  imports: [
    KraModule,
    UsersModule,
    GlobalConfigModule,
    PrismaModule,
    SubscriptionsModule,
    NotificationsModule,
    SinglePurchasesModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
