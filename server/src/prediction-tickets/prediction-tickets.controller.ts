import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PredictionTicketsService } from './prediction-tickets.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';
import { todayKstDash } from '../common/utils/kst';

@ApiTags('Prediction Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prediction-tickets')
export class PredictionTicketsController {
  constructor(private ticketsService: PredictionTicketsService) {}

  @Post('use')
  @ApiOperation({ summary: '예측권 사용' })
  async useTicket(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UseTicketDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.ticketsService.useTicket(user.sub, dto);
    if (result.status === 'PREPARING') {
      res.status(202);
    }
    return result;
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
      date || todayKstDash(),
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
      body.date || todayKstDash(),
    );
  }

  @Get('matrix/balance')
  @ApiOperation({ summary: '종합 예측권 잔액' })
  getMatrixBalance(@CurrentUser() user: JwtPayload) {
    return this.ticketsService.getMatrixBalance(user.sub);
  }

  @Get('matrix/price')
  @ApiOperation({ summary: '종합 예측권 가격 정보' })
  getMatrixPrice() {
    return this.ticketsService.getMatrixTicketPrice();
  }

  @Get('check-race/:raceId')
  @ApiOperation({ summary: 'Check if ticket was used for a specific race' })
  checkRace(
    @CurrentUser() user: JwtPayload,
    @Param('raceId', ParseIntPipe) raceId: number,
  ) {
    return this.ticketsService.hasUsedForRace(user.sub, raceId).then((used) => ({ used }));
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
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.findOne(id, user.sub);
  }
}
