import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

export class NotificationListResponseDto {
  @ApiProperty({ description: '알림 목록', type: [NotificationResponseDto] })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: '총 개수', example: 25 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '총 페이지 수', example: 3 })
  totalPages: number;
}
