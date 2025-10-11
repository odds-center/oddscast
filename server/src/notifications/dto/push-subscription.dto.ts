import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PushSubscriptionDto {
  @ApiProperty({
    description: '디바이스 토큰',
    example: 'fcm_token_123456789',
  })
  @IsString()
  deviceToken: string;
}
