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
import { PredictionTicketsService } from './prediction-tickets.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';

@ApiTags('Prediction Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prediction-tickets')
export class PredictionTicketsController {
  constructor(private ticketsService: PredictionTicketsService) {}

  @Post('use')
  @ApiOperation({ summary: '예측권 사용' })
  useTicket(@CurrentUser() user: JwtPayload, @Body() dto: UseTicketDto) {
    return this.ticketsService.useTicket(user.sub, dto);
  }

  @Get('balance')
  @ApiOperation({ summary: '예측권 잔여 수량' })
  getBalance(@CurrentUser() user: JwtPayload) {
    return this.ticketsService.getBalance(user.sub);
  }

  @Get('matrix/access')
  @ApiOperation({ summary: '종합 예측권 접근 권한 확인' })
  checkMatrixAccess(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
  ) {
    return this.ticketsService.checkMatrixAccess(
      user.sub,
      date || new Date().toISOString().slice(0, 10),
    );
  }

  @Post('matrix/use')
  @ApiOperation({ summary: '종합 예측권 사용' })
  useMatrixTicket(
    @CurrentUser() user: JwtPayload,
    @Body() body: { date?: string },
  ) {
    return this.ticketsService.useMatrixTicket(
      user.sub,
      body.date || new Date().toISOString().slice(0, 10),
    );
  }

  @Get('matrix/balance')
  @ApiOperation({ summary: '종합 예측권 잔액' })
  getMatrixBalance(@CurrentUser() user: JwtPayload) {
    return this.ticketsService.getMatrixBalance(user.sub);
  }

  @Post('matrix/purchase')
  @ApiOperation({ summary: '종합 예측권 개별 구매 (1,000원/장)' })
  purchaseMatrixTicket(
    @CurrentUser() user: JwtPayload,
    @Body() body: { count?: number },
  ) {
    const count = Math.min(10, Math.max(1, Number(body.count) || 1));
    return this.ticketsService.purchaseMatrixTickets(user.sub, count);
  }

  @Get('matrix/price')
  @ApiOperation({ summary: '종합 예측권 가격 정보' })
  getMatrixPrice() {
    return { pricePerTicket: 1000, currency: 'KRW', maxPerPurchase: 10 };
  }

  @Get('history')
  @ApiOperation({ summary: '예측권 사용 이력' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.getHistory(user.sub, page, limit);
  }

  @Get('my-predictions')
  @ApiOperation({ summary: '내가 본 예측 목록 (예측권 사용 이력)' })
  getMyPredictions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.getMyPredictionsHistory(user.sub, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '예측권 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }
}
