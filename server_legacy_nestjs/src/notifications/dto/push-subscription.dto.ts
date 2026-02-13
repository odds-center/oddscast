import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class PushSubscriptionDto {
  @ApiProperty({
    description: '디바이스 토큰 (Expo Push Token)',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  deviceToken: string;

  @ApiProperty({
    description: '디바이스 플랫폼',
    example: 'ios',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;
}
