import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import {
  SubscribeDto,
  ActivateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: '구독 플랜 목록' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 상태 조회' })
  getStatus(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getStatus(user.sub);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 이력 조회 (page/limit 또는 offset/limit)' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    const hasOffset = offset !== undefined && String(offset).trim() !== '';
    const pg = hasOffset
      ? Math.floor(Number(offset) / lim) + 1
      : Math.max(1, Number(page) || 1);
    return this.subscriptionsService.getHistory(user.sub, pg, lim);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 신청' })
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(user.sub, dto);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 신청 (alias)' })
  subscribeAlias(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(user.sub, dto);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 취소 (현재 유저 활성 구독)' })
  cancelPost(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancelByUserId(user.sub, dto.reason);
  }

  @Patch(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 활성화 (결제 성공 후)' })
  activate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActivateSubscriptionDto,
  ) {
    return this.subscriptionsService.activate(id, user.sub, dto);
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 활성화 (alias)' })
  activatePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActivateSubscriptionDto,
  ) {
    return this.subscriptionsService.activate(id, user.sub, dto);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 취소 (ID 지정)' })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancel(id, user.sub, dto);
  }
}
