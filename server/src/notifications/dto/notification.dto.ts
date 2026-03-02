import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({
    enum: ['SYSTEM', 'RACE', 'PREDICTION', 'PROMOTION', 'SUBSCRIPTION'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['GENERAL', 'URGENT', 'INFO', 'MARKETING'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class BulkSendDto {
  @ApiProperty()
  @IsString()
  templateId: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  recipients: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}

export class PushSubscribeDto {
  @ApiProperty({ description: 'FCM registration token (from @react-native-firebase/messaging)' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: '기기 식별자 (중복 등록 방지)' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class PushUnsubscribeDto {
  @ApiProperty({ description: 'FCM registration token' })
  @IsString()
  token: string;
}

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional({ description: '푸시 알림' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: '경주 알림 (시작/결과)' })
  @IsOptional()
  @IsBoolean()
  raceEnabled?: boolean;

  @ApiPropertyOptional({ description: 'AI 예측 관련 알림' })
  @IsOptional()
  @IsBoolean()
  predictionEnabled?: boolean;

  @ApiPropertyOptional({ description: '구독 관련 알림' })
  @IsOptional()
  @IsBoolean()
  subscriptionEnabled?: boolean;

  @ApiPropertyOptional({ description: '시스템 공지' })
  @IsOptional()
  @IsBoolean()
  systemEnabled?: boolean;

  @ApiPropertyOptional({ description: '프로모션/마케팅' })
  @IsOptional()
  @IsBoolean()
  promotionEnabled?: boolean;
}
