import { ApiProperty } from '@nestjs/swagger';
import {
  Notification,
  NotificationType,
  NotificationCategory,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ description: '알림 ID', example: 'notification-123' })
  id: string;

  @ApiProperty({ description: '사용자 ID', example: 'user-123' })
  userId: string;

  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.BET_RESULT,
  })
  type: NotificationType;

  @ApiProperty({
    description: '알림 카테고리',
    enum: NotificationCategory,
    example: NotificationCategory.BETTING,
  })
  category: NotificationCategory;

  @ApiProperty({ description: '알림 제목', example: '베팅 결과 알림' })
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: '천리마가 1착으로 들어왔습니다! 축하드립니다.',
  })
  message: string;

  @ApiProperty({
    description: '관련 대상 ID',
    example: 'bet-123',
    required: false,
  })
  targetId?: string;

  @ApiProperty({
    description: '관련 대상 타입',
    example: 'bet',
    required: false,
  })
  targetType?: string;

  @ApiProperty({
    description: '추가 대상 데이터',
    example: { raceId: 'race-123', horseName: '천리마' },
    required: false,
  })
  targetData?: Record<string, any>;

  @ApiProperty({ description: '읽음 여부', example: false })
  isRead: boolean;

  @ApiProperty({ description: '읽은 시간', required: false })
  readAt?: Date;

  @ApiProperty({ description: '발송 여부', example: true })
  isSent: boolean;

  @ApiProperty({ description: '발송 시간', required: false })
  sentAt?: Date;

  @ApiProperty({ description: '예약 발송 시간', required: false })
  scheduledAt?: Date;

  @ApiProperty({
    description: '알림 우선순위',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'NORMAL',
  })
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.userId = notification.userId;
    this.type = notification.type;
    this.category = notification.category;
    this.title = notification.title;
    this.message = notification.message;
    this.targetId = notification.targetId;
    this.targetType = notification.targetType;
    this.targetData = notification.targetData;
    this.isRead = notification.isRead;
    this.readAt = notification.readAt;
    this.isSent = notification.isSent;
    this.sentAt = notification.sentAt;
    this.scheduledAt = notification.scheduledAt;
    this.priority = notification.priority;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
  }
}
