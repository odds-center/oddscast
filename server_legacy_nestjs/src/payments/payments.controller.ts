import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  PaymentsService,
  SubscribeRequest,
  SinglePurchaseRequest,
} from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 결제 API Controller
 */
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 구독 시작 (빌링키 발급 + 첫 결제)
   * POST /api/payments/subscribe
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() body: SubscribeRequest, @Req() req: any) {
    const userId = req.user.id;

    return this.paymentsService.startSubscription({
      ...body,
      userId,
    });
  }

  /**
   * 개별 예측권 구매 (즉시 결제)
   * POST /api/payments/purchase
   */
  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  async purchaseTickets(@Body() body: SinglePurchaseRequest, @Req() req: any) {
    const userId = req.user.id;

    return this.paymentsService.purchaseSingleTickets({
      ...body,
      userId,
    });
  }

  /**
   * 결제 내역 조회
   * GET /api/payments/history
   */
  @Get('history')
  async getHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.paymentsService.getBillingHistory(userId);
  }
}
