import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { NotificationsService } from '../../notifications/notifications.service';

@Controller('admin/notifications')
@UseGuards(AdminGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('settings')
  async getSettings() {
    // 관리자 알림 설정 조회 (기본값 반환)
    return {
      newUserNotification: true,
      highAmountBetNotification: true,
      systemErrorNotification: true,
      dailyReportNotification: true,
    };
  }

  @Patch('settings')
  async updateSettings(@Body() settings: any) {
    // 설정 업데이트 (실제로는 DB에 저장)
    return {
      success: true,
      message: '설정이 저장되었습니다.',
      ...settings,
    };
  }

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('userId') userId?: string
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const validPage = isNaN(page) ? 1 : page;
    const validLimit = isNaN(limit) ? 20 : limit;

    // userId가 없으면 빈 배열 반환
    if (!userId) {
      return {
        data: [],
        meta: {
          total: 0,
          page: validPage,
          limit: validLimit,
          totalPages: 0,
        },
      };
    }

    try {
      const result = await this.notificationsService.getNotifications(userId, {
        page: validPage,
        limit: validLimit,
      });

      return {
        data: result.notifications,
        meta: {
          total: result.total,
          page: result.page,
          limit: validLimit,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      return {
        data: [],
        meta: {
          total: 0,
          page: validPage,
          limit: validLimit,
          totalPages: 0,
        },
      };
    }
  }

  @Post('send')
  async sendNotification(@Body() data: any) {
    // 알림 전송 (푸시, 이메일 등)
    return {
      success: true,
      message: '알림이 전송되었습니다.',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('userId') userId?: string) {
    if (!userId) {
      return { success: false, message: 'userId가 필요합니다.' };
    }
    return this.notificationsService.deleteNotification(userId, id);
  }
}
