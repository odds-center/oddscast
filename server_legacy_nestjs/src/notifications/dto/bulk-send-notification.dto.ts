import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class BulkSendNotificationDto {
  @ApiProperty({
    description: '알림 템플릿 ID',
    example: 'template-bet-result',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: '수신자 사용자 ID 목록',
    example: ['user-1', 'user-2', 'user-3'],
  })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({
    description: '템플릿 변수',
    example: { horseName: '천리마', raceName: '제주 스프린트 챔피언십' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}
