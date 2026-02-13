import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
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
  @ApiOperation({ summary: '구독 이력 조회' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getHistory(user.sub);
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
  cancelPost(@CurrentUser() user: JwtPayload, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelByUserId(user.sub, dto.reason);
  }

  @Patch(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 활성화' })
  activate(@Param('id') id: string, @Body() dto: ActivateSubscriptionDto) {
    return this.subscriptionsService.activate(id, dto);
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 활성화 (alias)' })
  activatePost(@Param('id') id: string, @Body() dto: ActivateSubscriptionDto) {
    return this.subscriptionsService.activate(id, dto);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '구독 취소' })
  cancel(@Param('id') id: string, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancel(id, dto);
  }
}
