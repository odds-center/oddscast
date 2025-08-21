import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * 알림을 생성합니다.
   */
  async createNotification(
    userId: string,
    message: string,
    type: string
  ): Promise<void> {
    this.logger.log(
      `알림 생성: 사용자 ${userId}, 메시지 ${message}, 타입 ${type}`
    );
    // TODO: 실제 알림 생성 로직 구현
  }

  /**
   * 사용자의 읽지 않은 알림 수를 조회합니다.
   */
  async getUnreadCount(userId: string): Promise<number> {
    // TODO: 실제 알림 수 조회 로직 구현
    return 0;
  }

  /**
   * 알림을 읽음 처리합니다.
   */
  async markAsRead(notificationId: string): Promise<void> {
    this.logger.log(`알림 읽음 처리: ${notificationId}`);
    // TODO: 실제 알림 읽음 처리 로직 구현
  }
}
