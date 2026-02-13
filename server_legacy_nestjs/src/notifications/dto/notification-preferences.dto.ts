import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationPreferencesDto {
  @ApiProperty({
    description: '베팅 결과 알림 활성화',
    example: true,
  })
  @IsBoolean()
  betResult: boolean;

  @ApiProperty({
    description: '경주 시작 알림 활성화',
    example: true,
  })
  @IsBoolean()
  raceStart: boolean;

  @ApiProperty({
    description: '경주 결과 알림 활성화',
    example: true,
  })
  @IsBoolean()
  raceResult: boolean;

  @ApiProperty({
    description: 'AI 예측 알림 활성화',
    example: false,
  })
  @IsBoolean()
  prediction: boolean;

  @ApiProperty({
    description: '구독 관련 알림 활성화',
    example: true,
  })
  @IsBoolean()
  subscription: boolean;

  @ApiProperty({
    description: '시스템 알림 활성화',
    example: true,
  })
  @IsBoolean()
  system: boolean;

  @ApiProperty({
    description: '프로모션 알림 활성화',
    example: false,
  })
  @IsBoolean()
  promotion: boolean;

  @ApiProperty({
    description: 'Push 알림 활성화',
    example: true,
  })
  @IsBoolean()
  pushNotification: boolean;

  @ApiProperty({
    description: '이메일 알림 활성화',
    example: false,
  })
  @IsBoolean()
  emailNotification: boolean;

  @ApiProperty({
    description: 'SMS 알림 활성화',
    example: false,
  })
  @IsBoolean()
  smsNotification: boolean;
}
