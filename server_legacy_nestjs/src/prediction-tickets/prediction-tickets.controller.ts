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
import { PredictionTicketsService } from './prediction-tickets.service';
import { IssueTicketDto, UseTicketDto, TicketBalanceDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 예측권 API 컨트롤러
 */
@Controller('prediction-tickets')
@UseGuards(JwtAuthGuard)
export class PredictionTicketsController {
  constructor(
    private readonly predictionTicketsService: PredictionTicketsService
  ) {}

  /**
   * 예측권 발급
   * POST /api/prediction-tickets/issue
   */
  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  async issueTickets(@Body() dto: IssueTicketDto) {
    return this.predictionTicketsService.issueTickets(dto);
  }

  /**
   * 예측권 사용 (AI 예측 요청)
   * POST /api/prediction-tickets/use
   */
  @Post('use')
  @HttpCode(HttpStatus.OK)
  async useTicket(@Req() req: any, @Body() dto: UseTicketDto) {
    const userId = req.user.id;
    return this.predictionTicketsService.useTicket(userId, dto);
  }

  /**
   * 예측권 잔액 조회
   * GET /api/prediction-tickets/balance
   */
  @Get('balance')
  async getBalance(@Req() req: any): Promise<TicketBalanceDto> {
    const userId = req.user.id;
    return this.predictionTicketsService.getBalance(userId);
  }

  /**
   * 사용 내역 조회
   * GET /api/prediction-tickets/history
   */
  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    const userId = req.user.id;
    return this.predictionTicketsService.getHistory(
      userId,
      Number(limit),
      Number(offset)
    );
  }

  /**
   * 예측권 상세 조회
   * GET /api/prediction-tickets/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.predictionTicketsService.findOne(id);
  }

  /**
   * 만료 처리 (관리자용)
   * POST /api/prediction-tickets/expire
   */
  @Post('expire')
  @HttpCode(HttpStatus.OK)
  async expireTickets() {
    const count = await this.predictionTicketsService.expireTickets();
    return { expiredCount: count };
  }
}
