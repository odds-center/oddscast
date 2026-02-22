import { Controller, Get, Post, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PredictionsService } from '../predictions/predictions.service';

/**
 * Admin 전용 Predictions API — /api/admin/predictions/*
 * Admin 클라이언트 baseURL이 /api/admin 이므로 경로: /predictions/analytics/dashboard 등
 */
@ApiTags('Admin Predictions')
@Controller('admin/predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get('analytics/dashboard')
  @ApiOperation({ summary: '[Admin] 예측 분석 대시보드' })
  getAnalyticsDashboard() {
    return this.predictionsService.getAnalyticsDashboard();
  }

  @Post('analytics/daily-stats')
  @ApiOperation({ summary: '[Admin] 일일 통계 계산' })
  calculateDailyStats() {
    return this.predictionsService.getDashboard();
  }

  @Get('analytics/failures')
  @ApiOperation({ summary: '[Admin] 실패 원인 분석' })
  getAnalyticsFailures(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.predictionsService.getAnalyticsFailures({ startDate, endDate });
  }

  @Get('stats/accuracy')
  @ApiOperation({ summary: '[Admin] 평균 정확도 통계' })
  getAccuracyStats() {
    return this.predictionsService.getDashboard();
  }

  @Get('stats/cost')
  @ApiOperation({ summary: '[Admin] AI 호출 비용' })
  getCost() {
    return this.predictionsService.getCostStats();
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '[Admin] 경주별 예측 정보 조회' })
  getByRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getByRace(raceId);
  }

  @Post('generate/:raceId')
  @ApiOperation({ summary: '[Admin] 해당 경주 AI 예측 수동 생성' })
  generateForRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.generatePrediction(raceId);
  }
}
