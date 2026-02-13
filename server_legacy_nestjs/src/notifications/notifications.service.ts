import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationCategory,
} from './entities/notification.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationPreferencesDto,
  UnreadCountResponseDto,
} from './dto/index';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  /**
   * 알림 목록 조회
   */
  async getNotifications(
    userId: string,
    filters?: {
      type?: string;
      category?: string;
      isRead?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<NotificationListResponseDto> {
    const { type, category, isRead, page = 1, limit = 20 } = filters || {};

    const queryBuilder = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (category) {
      queryBuilder.andWhere('notification.category = :category', { category });
    }

    if (typeof isRead === 'boolean') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    const [notifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      notifications: notifications.map(n => new NotificationResponseDto(n)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 알림 상세 조회
   */
  async getNotification(
    userId: string,
    id: string
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    return new NotificationResponseDto(notification);
  }

  /**
   * 알림 생성
   */
  async createNotification(
    userId: string,
    createNotificationDto: CreateNotificationDto
  ): Promise<NotificationResponseDto> {
    const {
      type,
      category,
      title,
      message,
      targetId,
      targetType,
      targetData,
      scheduledAt,
      priority = 'NORMAL',
    } = createNotificationDto;

    const notification = this.notificationRepo.create({
      userId,
      type,
      category,
      title,
      message,
      targetId,
      targetType,
      targetData,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      priority,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(`알림 생성: ${saved.id}`);

    return new NotificationResponseDto(saved);
  }

  /**
   * 알림 수정
   */
  async updateNotification(
    userId: string,
    id: string,
    updateNotificationDto: UpdateNotificationDto
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    Object.assign(notification, updateNotificationDto);
    const saved = await this.notificationRepo.save(notification);

    this.logger.log(`알림 수정: ${saved.id}`);
    return new NotificationResponseDto(saved);
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(
    userId: string,
    id: string
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    const saved = await this.notificationRepo.save(notification);

    this.logger.log(`알림 읽음 처리: ${saved.id}`);
    return new NotificationResponseDto(saved);
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    this.logger.log(
      `모든 알림 읽음 처리: userId=${userId}, updatedCount=${result.affected}`
    );
    return { updatedCount: result.affected || 0 };
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(
    userId: string,
    id: string
  ): Promise<{ message: string }> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    await this.notificationRepo.remove(notification);
    this.logger.log(`알림 삭제: ${id}`);

    return { message: '알림이 삭제되었습니다.' };
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  /**
   * 알림 설정 조회 (기본값 반환)
   */
  async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferencesDto> {
    // 실제로는 사용자별 설정을 DB에서 조회해야 하지만,
    // 현재는 기본값을 반환
    return {
      betResult: true,
      raceStart: true,
      raceResult: true,
      prediction: false,
      subscription: true,
      system: true,
      promotion: false,
      pushNotification: true,
      emailNotification: false,
      smsNotification: false,
    };
  }

  /**
   * 알림 설정 업데이트 (현재는 로그만 출력)
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferencesDto
  ): Promise<NotificationPreferencesDto> {
    this.logger.log(
      `알림 설정 업데이트: userId=${userId}, preferences=`,
      preferences
    );

    // 실제로는 사용자별 설정을 DB에 저장해야 함
    return preferences;
  }

  /**
   * Push 알림 구독 (현재는 로그만 출력)
   */
  async subscribeToPushNotifications(
    userId: string,
    deviceToken: string,
    platform?: string
  ): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Push 알림 구독: userId=${userId}, deviceToken=${deviceToken}, platform=${platform}`
      );

      // User 엔티티에 deviceToken 저장
      await this.userRepo.update(userId, {
        deviceToken,
        devicePlatform: platform,
        tokenUpdatedAt: new Date(),
      });

      this.logger.log(`✅ Device Token 저장 완료: ${userId}`);

      return { message: 'Push 알림 구독이 완료되었습니다.' };
    } catch (error) {
      this.logger.error(`Push 알림 구독 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * Push 알림 구독 해제
   */
  async unsubscribeFromPushNotifications(
    userId: string,
    deviceToken: string
  ): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Push 알림 구독 해제: userId=${userId}, deviceToken=${deviceToken}`
      );

      // User 엔티티에서 deviceToken 제거
      await this.userRepo.update(userId, {
        deviceToken: null,
        devicePlatform: null,
        tokenUpdatedAt: new Date(),
      });

      this.logger.log(`✅ Device Token 제거 완료: ${userId}`);

      return { message: 'Push 알림 구독이 해제되었습니다.' };
    } catch (error) {
      this.logger.error(`Push 알림 구독 해제 실패: ${error.message}`);
      throw error;
    }
  }
}
