import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SinglePurchasesService } from './single-purchases.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { PurchaseDto } from '../common/dto/payment.dto';

@ApiTags('Single Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('single-purchases')
export class SinglePurchasesController {
  constructor(private singlePurchasesService: SinglePurchasesService) {}

  @Post()
  @ApiOperation({ summary: '예측권 개별 구매' })
  purchase(@CurrentUser() user: JwtPayload, @Body() dto: PurchaseDto) {
    return this.singlePurchasesService.purchase(user.sub, dto);
  }

  @Post('purchase')
  @ApiOperation({ summary: '예측권 개별 구매 (alias)' })
  purchaseAlias(@CurrentUser() user: JwtPayload, @Body() dto: PurchaseDto) {
    return this.singlePurchasesService.purchase(user.sub, dto);
  }

  @Get('config')
  @ApiOperation({ summary: '구매 설정 조회' })
  getConfig() {
    return this.singlePurchasesService.getConfig();
  }

  @Get('price')
  @ApiOperation({ summary: '가격 계산' })
  calculatePrice(@Query('quantity') quantity: number = 1) {
    return this.singlePurchasesService.calculatePrice(Number(quantity));
  }

  @Get('calculate-price')
  @ApiOperation({ summary: '가격 계산 (alias)' })
  calculatePriceAlias(@Query('quantity') quantity: number = 1) {
    return this.singlePurchasesService.calculatePrice(Number(quantity));
  }

  @Get('history')
  @ApiOperation({ summary: '구매 이력' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.singlePurchasesService.getHistory(user.sub, page, limit);
  }

  @Get('total-spent')
  @ApiOperation({ summary: '총 지출 금액' })
  getTotalSpent(@CurrentUser() user: JwtPayload) {
    return this.singlePurchasesService.getTotalSpent(user.sub);
  }
}
