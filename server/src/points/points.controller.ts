import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import {
  CreatePointTransactionDto,
  PointTransferDto,
  PurchaseTicketDto,
} from './dto/point.dto';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('promotions')
  @ApiOperation({ summary: '프로모션 목록 조회' })
  getPromotions(@Query() filters: any) {
    return this.pointsService.getPromotions(filters);
  }

  @Get('expiry-settings')
  @ApiOperation({ summary: '포인트 만료 설정 조회' })
  getExpirySettings() {
    return this.pointsService.getExpirySettings();
  }

  @Get('ticket-price')
  @ApiOperation({ summary: '포인트 예측권 가격 조회' })
  getTicketPrice() {
    return this.pointsService.getTicketPrice();
  }

  @Get('me/balance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 포인트 잔액 조회' })
  getMyBalance(@CurrentUser() user: JwtPayload) {
    return this.pointsService.getBalance(user.sub);
  }

  @Get('me/transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 포인트 거래 내역 조회' })
  getMyTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.pointsService.getTransactions(user.sub, {
      page: page || 1,
      limit: limit || 20,
      type,
    });
  }

  @Post('purchase-ticket')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '포인트로 예측권 구매' })
  purchaseTicket(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PurchaseTicketDto,
  ) {
    return this.pointsService.purchaseTicket(user.sub, dto);
  }

  @Post('transfer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '포인트 이체' })
  transfer(@CurrentUser() user: JwtPayload, @Body() dto: PointTransferDto) {
    return this.pointsService.transfer(user.sub, dto);
  }

  @Get(':userId/balance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '포인트 잔액 조회' })
  getBalance(@Param('userId', ParseIntPipe) userId: number) {
    return this.pointsService.getBalance(userId);
  }

  @Get(':userId/transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '포인트 트랜잭션 조회' })
  getTransactions(@Param('userId', ParseIntPipe) userId: number, @Query() filters: any) {
    return this.pointsService.getTransactions(userId, filters);
  }

  @Post(':userId/transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '포인트 트랜잭션 생성 (관리자용?)' })
  createTransaction(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreatePointTransactionDto,
  ) {
    return this.pointsService.createTransaction(userId, dto);
  }

  @Post(':userId/promotions/:promotionId/apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '프로모션 적용' })
  applyPromotion(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('promotionId', ParseIntPipe) promotionId: number,
  ) {
    return this.pointsService.applyPromotion(userId, promotionId);
  }
}
