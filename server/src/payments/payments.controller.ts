import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import {
  PaymentSubscribeDto,
  PaymentPurchaseDto,
  BillingKeyDto,
} from '../common/dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('billing-key')
  @ApiOperation({
    summary: '빌링키 발급 및 첫 결제',
    description:
      '결제창 성공 리다이렉트 후 customerKey, authKey로 빌링키 발급 후 첫 결제 실행 및 구독 활성화',
  })
  issueBillingKeyAndConfirm(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BillingKeyDto,
  ) {
    return this.paymentsService.issueBillingKeyAndConfirmSubscription(
      user.sub,
      dto,
    );
  }

  @Post('subscribe')
  @ApiOperation({ summary: '구독 결제 (레거시/목업)' })
  processSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PaymentSubscribeDto,
  ) {
    return this.paymentsService.processSubscription(user.sub, dto);
  }

  @Post('purchase')
  @ApiOperation({ summary: '단건 결제' })
  processPurchase(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PaymentPurchaseDto,
  ) {
    return this.paymentsService.processPurchase(user.sub, dto);
  }

  @Get('history')
  @ApiOperation({ summary: '결제 이력 조회' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getHistory(user.sub);
  }
}
