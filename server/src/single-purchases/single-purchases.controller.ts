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
import { SinglePurchasesService } from './single-purchases.service';
import { PurchaseTicketDto, PurchaseResultDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 개별 구매 API 컨트롤러
 */
@Controller('single-purchases')
@UseGuards(JwtAuthGuard)
export class SinglePurchasesController {
  constructor(
    private readonly singlePurchasesService: SinglePurchasesService
  ) {}

  /**
   * 예측권 구매 (1,000원/장)
   * POST /api/single-purchases/purchase
   */
  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  async purchase(
    @Req() req: any,
    @Body() dto: PurchaseTicketDto
  ): Promise<PurchaseResultDto> {
    const userId = req.user.id;
    return this.singlePurchasesService.purchaseTickets(userId, dto);
  }

  /**
   * 가격 계산 (할인 적용)
   * GET /api/single-purchases/calculate-price?quantity=5
   */
  @Get('calculate-price')
  async calculatePrice(
    @Query('quantity') quantity = 1
  ): Promise<{ quantity: number; totalPrice: number }> {
    const totalPrice = this.singlePurchasesService.calculateTotalPrice(
      Number(quantity)
    );
    return {
      quantity: Number(quantity),
      totalPrice,
    };
  }

  /**
   * 구매 내역 조회
   * GET /api/single-purchases/history
   */
  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    const userId = req.user.id;
    return this.singlePurchasesService.getPurchaseHistory(
      userId,
      Number(limit),
      Number(offset)
    );
  }

  /**
   * 총 구매액 조회
   * GET /api/single-purchases/total-spent
   */
  @Get('total-spent')
  async getTotalSpent(@Req() req: any): Promise<{ totalSpent: number }> {
    const userId = req.user.id;
    const totalSpent = await this.singlePurchasesService.getTotalSpent(userId);
    return { totalSpent };
  }

  /**
   * 환불 처리 (관리자용)
   * POST /api/single-purchases/:id/refund
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refund(@Param('id') id: string) {
    return this.singlePurchasesService.refundPurchase(id);
  }
}
