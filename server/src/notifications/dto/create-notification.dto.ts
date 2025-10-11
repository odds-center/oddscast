import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';
import {
  NotificationType,
  NotificationCategory,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.BET_RESULT,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '알림 카테고리',
    enum: NotificationCategory,
    example: NotificationCategory.BETTING,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    description: '알림 제목',
    example: '베팅 결과 알림',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: '천리마가 1착으로 들어왔습니다! 축하드립니다.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: '관련 대상 ID',
    example: 'bet-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiProperty({
    description: '관련 대상 타입',
    example: 'bet',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiProperty({
    description: '추가 대상 데이터',
    example: { raceId: 'race-123', horseName: '천리마' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  targetData?: Record<string, any>;

  @ApiProperty({
    description: '예약 발송 시간',
    example: '2025-01-11T10:45:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: '알림 우선순위',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'NORMAL',
    required: false,
  })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
