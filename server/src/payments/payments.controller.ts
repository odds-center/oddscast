import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { TossPaymentService } from './services/toss-payment.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import {
  ConfirmPaymentDto,
  IssueBillingKeyDto,
  BillingPaymentDto,
  CancelPaymentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 결제 API 컨트롤러
 */
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly tossPaymentService: TossPaymentService,
    private readonly webhookService: PaymentWebhookService,
  ) {}

  /**
   * 결제 승인 (즉시 결제)
   * POST /api/payments/confirm
   */
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmPayment(@Req() req: any, @Body() dto: ConfirmPaymentDto) {
    const userId = req.user.id;
    return this.tossPaymentService.confirmPayment(userId, dto);
  }

  /**
   * 빌링키 발급 (정기 결제용)
   * POST /api/payments/billing-key
   */
  @Post('billing-key')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async issueBillingKey(@Req() req: any, @Body() dto: IssueBillingKeyDto) {
    const userId = req.user.id;
    return this.tossPaymentService.issueBillingKey(userId, dto);
  }

  /**
   * 빌링키로 결제 (정기 결제 실행)
   * POST /api/payments/billing-pay
   */
  @Post('billing-pay')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async payWithBillingKey(@Req() req: any, @Body() dto: BillingPaymentDto) {
    const userId = req.user.id;
    return this.tossPaymentService.payWithBillingKey(
      userId,
      dto.billingKey,
      dto.amount,
      dto.orderName,
    );
  }

  /**
   * 결제 취소
   * POST /api/payments/cancel
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelPayment(@Body() dto: CancelPaymentDto) {
    return this.tossPaymentService.cancelPayment(dto);
  }

  /**
   * Toss Payments 웹훅
   * POST /api/payments/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: any) {
    await this.webhookService.handleTossWebhook(webhookData);
    return { success: true };
  }
}

