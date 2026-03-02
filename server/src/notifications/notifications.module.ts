import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../database/entities/notification.entity';
import { PushToken } from '../database/entities/push-token.entity';
import { UserNotificationPreference } from '../database/entities/user-notification-preference.entity';
import { User } from '../database/entities/user.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { Race } from '../database/entities/race.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { GlobalConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      PushToken,
      UserNotificationPreference,
      User,
      Subscription,
      Race,
    ]),
    GlobalConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
