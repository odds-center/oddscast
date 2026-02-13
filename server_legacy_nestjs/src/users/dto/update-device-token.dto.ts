import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * 디바이스 토큰 업데이트 DTO
 */
export class UpdateDeviceTokenDto {
  @ApiProperty({
    description: 'Expo Push Token',
    example: 'ExponentPushToken[xxx]',
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
  devicePlatform?: string;
}
