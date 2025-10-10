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
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto, PredictionResultDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 예측 API 컨트롤러
 */
@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

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
   * 경주별 예측 조회
   * GET /api/predictions/race/:raceId
   */
  @Get('race/:raceId')
  async findByRace(
    @Param('raceId') raceId: string
  ): Promise<PredictionResultDto | null> {
    const prediction = await this.predictionsService.findByRaceId(raceId);
    return prediction ? this.predictionsService.findOne(prediction.id) : null;
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
}
