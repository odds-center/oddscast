import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({
    description: '알림 제목',
    example: '베팅 결과 알림 (수정)',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '알림 내용',
    example: '천리마가 1착으로 들어왔습니다! 축하드립니다. (수정)',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: '추가 대상 데이터',
    example: { raceId: 'race-123', horseName: '천리마', updated: true },
    required: false,
  })
  @IsOptional()
  @IsObject()
  targetData?: Record<string, any>;

  @ApiProperty({
    description: '읽음 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
