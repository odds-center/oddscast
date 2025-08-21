import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 개수 조회' })
  @ApiResponse({
    status: 200,
    description: '읽지 않은 알림 개수',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  async getUnreadCount() {
    // 임시로 0 반환 (실제로는 데이터베이스에서 조회)
    return { count: 0 };
  }
}
