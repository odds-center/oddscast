import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../database/entities/notification.entity';
import { PushToken } from '../database/entities/push-token.entity';
import { UserNotificationPreference } from '../database/entities/user-notification-preference.entity';
import { User } from '../database/entities/user.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      PushToken,
      UserNotificationPreference,
      User,
      Subscription,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
