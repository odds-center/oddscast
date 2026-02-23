import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePredictionDto,
  UpdatePredictionStatusDto,
  PredictionFilterDto,
  AccuracyHistoryFilterDto,
} from './dto/prediction.dto';

@ApiTags('Predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get()
  @ApiOperation({ summary: '예측 목록 조회' })
  findAll(@Query() filters: PredictionFilterDto) {
    return this.predictionsService.findAll(filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '예측 대시보드' })
  getDashboard() {
    return this.predictionsService.getDashboard();
  }

  @Get('accuracy-history')
  @ApiOperation({ summary: '예측 정확도 이력' })
  getAccuracyHistory(@Query() filters: AccuracyHistoryFilterDto) {
    return this.predictionsService.getAccuracyHistory(filters);
  }

  @Get('stats/accuracy')
  @ApiOperation({ summary: '평균 정확도 통계' })
  getAccuracyStats() {
    return this.predictionsService.getDashboard();
  }

  @Get('analytics/dashboard')
  @ApiOperation({ summary: '분석 대시보드' })
  getAnalyticsDashboard() {
    return this.predictionsService.getAnalyticsDashboard();
  }

  @Get('stats/cost')
  @ApiOperation({ summary: 'AI 호출 비용 (누적)' })
  getCost() {
    return this.predictionsService.getCostStats();
  }

  @Get('analytics/failures')
  @ApiOperation({ summary: '실패 원인 분석' })
  getAnalyticsFailures(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.predictionsService.getAnalyticsFailures({ startDate, endDate });
  }

  @Get('preview/:raceId')
  @ApiOperation({ summary: '예측 미리보기 (무료)' })
  getPreview(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getPreview(raceId);
  }

  @Get('race/:raceId/preview')
  @ApiOperation({ summary: '예측 미리보기 (무료) — alias' })
  getPreviewAlias(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getPreview(raceId);
  }

  @Get('race/:raceId/history')
  @ApiOperation({ summary: '경주별 예측 기록 목록' })
  getByRaceHistory(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getByRaceHistory(raceId);
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '경주별 예측 조회 (최신 1건)' })
  getByRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getByRace(raceId);
  }

  @Get('matrix')
  @ApiOperation({ summary: '종합 예상 매트릭스 (용산종합지 스타일)' })
  getMatrix(@Query('date') date?: string, @Query('meet') meet?: string) {
    return this.predictionsService.getMatrix(date, meet);
  }

  @Get('commentary')
  @ApiOperation({ summary: '전문가 코멘트 피드' })
  getCommentary(
    @Query('date') date?: string,
    @Query('meet') meet?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.predictionsService.getCommentary(
      date,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
      meet,
    );
  }

  @Get('hit-record')
  @ApiOperation({ summary: '적중 내역 배너' })
  getHitRecords(@Query('limit') limit?: string) {
    return this.predictionsService.getHitRecords(
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get('accuracy-stats')
  @ApiOperation({ summary: '예측 정확도 대시보드용 통계 (전체/월별/경마장별)' })
  getAccuracyStatsDashboard() {
    return this.predictionsService.getAccuracyStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '예측 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.predictionsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '예측 생성' })
  create(@Body() dto: CreatePredictionDto) {
    return this.predictionsService.create(dto);
  }

  @Post('analytics/daily-stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '일일 통계 계산' })
  calculateDailyStats() {
    return this.predictionsService.getDashboard();
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '예측 상태 업데이트' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePredictionStatusDto,
  ) {
    return this.predictionsService.updateStatus(id, dto);
  }

  @Post('generate/:raceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '예측 생성 (AI)' })
  generate(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.generatePrediction(raceId);
  }
}
