import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 구독 API 컨트롤러
 */
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * 구독 신청
   * POST /api/subscriptions/subscribe
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  /**
   * 구독 활성화 (결제 완료 후)
   * POST /api/subscriptions/:id/activate
   */
  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @Body('billingKey') billingKey: string
  ) {
    return this.subscriptionsService.activateSubscription(id, billingKey);
  }

  /**
   * 구독 갱신 (관리자/배치용)
   * POST /api/subscriptions/:id/renew
   */
  @Post(':id/renew')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async renew(@Param('id') id: string) {
    return this.subscriptionsService.renewSubscription(id);
  }

  /**
   * 구독 취소
   * POST /api/subscriptions/cancel
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancel(@Req() req: any, @Body() dto: CancelSubscriptionDto) {
    if (!req.user || !req.user.id) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = req.user.id;
    return this.subscriptionsService.cancelSubscription(userId, dto);
  }

  /**
   * 구독 플랜 목록 조회 (인증 불필요)
   * GET /api/subscriptions/plans
   */
  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  /**
   * 구독 상태 조회
   * GET /api/subscriptions/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any): Promise<SubscriptionStatusDto | null> {
    if (!req.user || !req.user.id) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = req.user.id;
    return this.subscriptionsService.getStatus(userId);
  }

  /**
   * 구독 내역 조회
   * GET /api/subscriptions/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: any,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = req.user.id;
    return this.subscriptionsService.getHistory(
      userId,
      Number(limit),
      Number(offset)
    );
  }

  /**
   * 구독 상세 조회
   * GET /api/subscriptions/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  /**
   * 갱신 필요 구독 조회 (배치용)
   * GET /api/subscriptions/renewables
   */
  @Get('admin/renewables')
  @UseGuards(JwtAuthGuard)
  async findRenewables() {
    return this.subscriptionsService.findRenewableSubscriptions();
  }
}
