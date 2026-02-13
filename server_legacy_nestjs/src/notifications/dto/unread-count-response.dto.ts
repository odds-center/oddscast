import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({ description: '읽지 않은 알림 개수', example: 5 })
  count: number;
}
