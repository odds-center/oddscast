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
import {
  PredictionTicket,
  TicketStatus,
} from '../prediction-tickets/entities/prediction-ticket.entity';

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
   * 경주별 AI 예측 열람 (예측권 필수)
   * GET /api/predictions/race/:raceId
   *
   * ✅ 올바른 플로우:
   * 1. TicketRequiredGuard가 예측권 확인
   * 2. AI 예측이 배치로 생성되어 있는지 확인
   * 3. 예측권 소비 후 AI 예측 반환
   */
  @Get('race/:raceId')
  @UseGuards(TicketRequiredGuard)
  async findByRace(
    @Param('raceId') raceId: string,
    @Req() req: any,
    @UseTicket() ticket: PredictionTicket
  ): Promise<PredictionResultDto | PredictionStatusDto> {
    try {
      // 1. AI 예측 확인 (배치로 미리 생성되어 있어야 함)
      const prediction = await this.predictionsService.findByRaceId(raceId);

      if (!prediction) {
        // 예측이 없으면 → 아직 배치 작업 전
        this.logger.warn(`AI 예측 없음: ${raceId} → pending 상태`);
        return {
          status: 'pending',
          message:
            '해당 경주에 대한 AI 예측이 아직 생성되지 않았습니다. 경주 시작 1시간 전에 확인해주세요.',
          raceId,
          estimatedTime: 60, // 1시간 후
        };
      }

      // 2. 예측권 사용 처리 (열람 권한 소비)
      ticket.use(raceId, prediction.id);
      await this.ticketsService['ticketRepo'].save(ticket);

      this.logger.log(`✅ 예측권 사용: ${ticket.id} → Race ${raceId}`);

      // 3. AI 예측 전체 정보 반환
      const predictionDto = await this.predictionsService.findOne(
        prediction.id
      );

      return {
        ...predictionDto,
        ticketUsed: true,
        ticketId: ticket.id,
        message: 'AI 예측 열람 완료',
      } as any;
    } catch (error) {
      this.logger.error(`AI 예측 열람 실패: ${raceId}`, error.stack);

      return {
        status: 'failed',
        message: 'AI 예측을 불러오는 데 실패했습니다.',
        raceId,
      };
    }
  }

  /**
   * AI 예측 미리보기 (예측권 불필요, 블러 처리용)
   * GET /api/predictions/race/:raceId/preview
   *
   * 사용자에게 "AI 예측이 있다"는 것만 알려주고
   * 실제 내용은 예측권을 사용해야 볼 수 있음
   */
  @Get('race/:raceId/preview')
  async getPreview(@Param('raceId') raceId: string, @Req() req: any) {
    const prediction = await this.predictionsService.findByRaceId(raceId);

    if (!prediction) {
      return {
        hasPrediction: false,
        status: 'pending',
        message: '해당 경주에 대한 AI 예측이 아직 생성되지 않았습니다.',
        raceId,
      };
    }

    const userId = req.user?.userId;

    // 사용자가 이미 이 경주 예측을 봤는지 확인
    let hasViewed = false;
    let isUpdated = false;
    let lastViewedAt: Date | null = null;

    if (userId) {
      const usedTicket = await this.ticketsService['ticketRepo'].findOne({
        where: {
          userId,
          raceId,
          status: TicketStatus.USED,
        },
        order: { usedAt: 'DESC' },
      });

      if (usedTicket) {
        hasViewed = true;
        lastViewedAt = usedTicket.viewedAt;

        // 예측이 업데이트되었는지 확인
        if (usedTicket.viewedAt && prediction.updatedAt) {
          isUpdated =
            new Date(prediction.updatedAt) > new Date(usedTicket.viewedAt);
        }
      }
    }

    // 일부 정보만 반환 (실제 예측 내용은 숨김)
    return {
      hasPrediction: true,
      raceId: prediction.raceId,
      confidence: prediction.confidence, // 신뢰도만 보여줌
      predictedAt: prediction.predictedAt,
      updatedAt: prediction.updatedAt,
      requiresTicket: true,
      hasViewed, // 이미 봤는지
      isUpdated, // 업데이트 되었는지
      lastViewedAt,
      message: isUpdated
        ? '🆕 AI 예측이 업데이트되었습니다! 최신 예측을 확인하세요'
        : hasViewed
          ? '이미 확인한 예측입니다. 최신 업데이트를 보려면 예측권을 다시 사용하세요'
          : '🎫 예측권을 사용하여 AI 예측 전체를 확인하세요',
      previewText: `이 경주에 대한 AI 예측이 준비되었습니다. (신뢰도: ${(prediction.confidence * 100).toFixed(1)}%)`,
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
