import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationPreferencesDto,
  PushSubscriptionDto,
  BulkSendNotificationDto,
  UnreadCountResponseDto,
} from './dto/index';

/**
 * 알림 API 컨트롤러
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiQuery({ name: 'type', required: false, description: '알림 타입' })
  @ApiQuery({ name: 'category', required: false, description: '알림 카테고리' })
  @ApiQuery({ name: 'isRead', required: false, description: '읽음 여부' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '알림 목록 반환',
    type: NotificationListResponseDto,
  })
  async getNotifications(
    @Request() req,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('isRead') isRead?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<NotificationListResponseDto> {
    const userId = req.user.userId;
    return await this.notificationsService.getNotifications(userId, {
      type,
      category,
      isRead,
      page,
      limit,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 개수 조회' })
  @ApiResponse({
    status: 200,
    description: '읽지 않은 알림 개수 반환',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(@Request() req): Promise<UnreadCountResponseDto> {
    const userId = req.user.userId;
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: '알림 설정 조회' })
  @ApiResponse({
    status: 200,
    description: '알림 설정 반환',
    type: NotificationPreferencesDto,
  })
  async getNotificationPreferences(
    @Request() req
  ): Promise<NotificationPreferencesDto> {
    const userId = req.user.userId;
    return await this.notificationsService.getNotificationPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: '알림 설정 업데이트' })
  @ApiBody({ type: NotificationPreferencesDto })
  @ApiResponse({
    status: 200,
    description: '알림 설정 업데이트 성공',
    type: NotificationPreferencesDto,
  })
  async updateNotificationPreferences(
    @Request() req,
    @Body() preferences: NotificationPreferencesDto
  ): Promise<NotificationPreferencesDto> {
    const userId = req.user.userId;
    return await this.notificationsService.updateNotificationPreferences(
      userId,
      preferences
    );
  }

  @Post('push-subscribe')
  @ApiOperation({ summary: 'Push 알림 구독' })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Push 알림 구독 성공',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  async subscribeToPushNotifications(
    @Request() req,
    @Body() subscriptionDto: PushSubscriptionDto
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    return await this.notificationsService.subscribeToPushNotifications(
      userId,
      subscriptionDto.deviceToken,
      subscriptionDto.platform
    );
  }

  @Post('push-unsubscribe')
  @ApiOperation({ summary: 'Push 알림 구독 해제' })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Push 알림 구독 해제 성공',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  async unsubscribeFromPushNotifications(
    @Request() req,
    @Body() subscriptionDto: PushSubscriptionDto
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    return await this.notificationsService.unsubscribeFromPushNotifications(
      userId,
      subscriptionDto.deviceToken
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '알림 상세 조회' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({
    status: 200,
    description: '알림 상세 정보 반환',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '알림을 찾을 수 없음',
  })
  async getNotification(
    @Request() req,
    @Param('id') id: string
  ): Promise<NotificationResponseDto> {
    const userId = req.user.userId;
    return await this.notificationsService.getNotification(userId, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({
    status: 200,
    description: '알림 읽음 처리 성공',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '알림을 찾을 수 없음',
  })
  async markAsRead(
    @Request() req,
    @Param('id') id: string
  ): Promise<NotificationResponseDto> {
    const userId = req.user.userId;
    return await this.notificationsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @ApiResponse({
    status: 200,
    description: '모든 알림 읽음 처리 성공',
    schema: {
      type: 'object',
      properties: { updatedCount: { type: 'number' } },
    },
  })
  async markAllAsRead(@Request() req): Promise<{ updatedCount: number }> {
    const userId = req.user.userId;
    return await this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({
    status: 200,
    description: '알림 삭제 성공',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: 404,
    description: '알림을 찾을 수 없음',
  })
  async deleteNotification(
    @Request() req,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    return await this.notificationsService.deleteNotification(userId, id);
  }
}
