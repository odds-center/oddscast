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
  Logger,
  Req,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { AIAnalyticsService } from './services';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { CreatePredictionDto, PredictionResultDto } from './dto';
import {
  PredictionStatusDto,
  PREDICTION_STATUS_MESSAGES,
} from './dto/prediction-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketRequiredGuard } from './guards/ticket-required.guard';
import { UseTicket } from './decorators/use-ticket.decorator';
import { PredictionTicket } from '../prediction-tickets/entities/prediction-ticket.entity';

/**
 * 예측 API 컨트롤러 (AI 캐싱 최적화)
 */
@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  private readonly logger = new Logger(PredictionsController.name);

  constructor(
    private readonly predictionsService: PredictionsService,
    private readonly analyticsService: AIAnalyticsService,
    private readonly ticketsService: PredictionTicketsService
  ) {}

  /**
   * AI 예측 생성
   * POST /api/predictions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePredictionDto): Promise<PredictionResultDto> {
    return this.predictionsService.generatePrediction(dto);
  }

  /**
   * 예측 조회 (ID)
   * GET /api/predictions/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PredictionResultDto> {
    return this.predictionsService.findOne(id);
  }

  /**
   * 모든 예측 조회
   * GET /api/predictions
   */
  @Get()
  async findAll(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ): Promise<PredictionResultDto[]> {
    return this.predictionsService.findAll(Number(limit), Number(offset));
  }

  /**
   * 경주별 예측 조회 (예측권 필수)
   * GET /api/predictions/race/:raceId
   */
  @Get('race/:raceId')
  @UseGuards(TicketRequiredGuard)
  async findByRace(
    @Param('raceId') raceId: string,
    @Req() req: any,
    @UseTicket() ticket: PredictionTicket
  ): Promise<PredictionResultDto | PredictionStatusDto> {
    try {
      const prediction = await this.predictionsService.findByRaceId(raceId);

      if (!prediction) {
        // 예측 없으면 생성 중 상태
        this.logger.log(`예측 없음: ${raceId} → pending 반환`);
        return {
          status: 'pending',
          message: PREDICTION_STATUS_MESSAGES.PENDING,
          raceId,
          estimatedTime: 5,
        };
      }

      // 예측권 사용 처리 (ticket.use()는 Entity 메서드)
      ticket.use(raceId, prediction.id);
      await this.ticketsService['ticketRepo'].save(ticket);

      this.logger.log(`예측권 사용: ${ticket.id} → Race ${raceId}`);

      // 예측 반환
      const predictionDto = await this.predictionsService.findOne(
        prediction.id
      );
      return {
        ...predictionDto,
        ticketUsed: true,
        ticketId: ticket.id,
      } as any;
    } catch (error) {
      this.logger.error(`예측 조회 실패: ${raceId}`, error.stack);

      // 에러 발생 시
      return {
        status: 'failed',
        message: PREDICTION_STATUS_MESSAGES.FAILED,
        raceId,
      };
    }
  }

  /**
   * 예측 미리보기 (예측권 없어도 가능, 블러 처리용)
   * GET /api/predictions/race/:raceId/preview
   */
  @Get('race/:raceId/preview')
  async getPreview(@Param('raceId') raceId: string) {
    const prediction = await this.predictionsService.findByRaceId(raceId);

    if (!prediction) {
      return {
        status: 'pending',
        message: PREDICTION_STATUS_MESSAGES.PENDING,
        raceId,
      };
    }

    // 일부 정보만 반환 (블러 처리용)
    return {
      raceId: prediction.raceId,
      confidence: prediction.confidence,
      hasPrediction: true,
      requiresTicket: true,
      message: '예측권을 사용하여 전체 예측을 확인하세요',
    };
  }

  /**
   * 평균 정확도 조회
   * GET /api/predictions/stats/accuracy
   */
  @Get('stats/accuracy')
  async getAccuracy(): Promise<{ averageAccuracy: number }> {
    const averageAccuracy = await this.predictionsService.getAverageAccuracy();
    return { averageAccuracy };
  }

  /**
   * 총 비용 조회
   * GET /api/predictions/stats/cost
   */
  @Get('stats/cost')
  async getCost(): Promise<{ totalCost: number }> {
    const totalCost = await this.predictionsService.getTotalCost();
    return { totalCost };
  }

  /**
   * AI 분석 대시보드
   * GET /api/predictions/analytics/dashboard
   */
  @Get('analytics/dashboard')
  async getAnalyticsDashboard() {
    return this.analyticsService.getAccuracyDashboard();
  }

  /**
   * 일일 통계 계산
   * POST /api/predictions/analytics/daily-stats
   */
  @Post('analytics/daily-stats')
  async calculateDailyStats(@Body('date') date: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.analyticsService.calculateDailyStats(targetDate);
  }

  /**
   * 실패 원인 분석
   * GET /api/predictions/analytics/failures
   */
  @Get('analytics/failures')
  async analyzeFailures(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    return this.analyticsService.analyzeFailures(start, end);
  }
}
