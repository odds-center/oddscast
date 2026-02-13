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
} from '../common/dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: '구독 결제' })
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
