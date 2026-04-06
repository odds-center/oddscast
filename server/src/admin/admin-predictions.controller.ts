import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/db-enums';
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

  @Get('stats/today')
  @ApiOperation({ summary: '[Admin] 오늘 생성된 예측 건수 (KST)' })
  getTodayCount() {
    return this.predictionsService.getTodayCreatedCount();
  }

  /** [Admin] 전체 예측 목록 (페이지네이션, 최대 100건/페이지) */
  @Get('list')
  @ApiOperation({ summary: '[Admin] 전체 예측 목록' })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('raceId') raceId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(limit ?? '20'), 10) || 20),
    );
    const raceIdNum = raceId ? parseInt(raceId, 10) : undefined;
    return this.predictionsService.findAllForAdmin({
      page: pageNum,
      limit: limitNum,
      status: status || undefined,
      raceId: Number.isNaN(raceIdNum as number) ? undefined : raceIdNum,
    });
  }

  /** [Admin] 경주별 예측 이력 전체 (해당 경주의 모든 COMPLETED 예측) */
  @Get('race/:raceId/history')
  @ApiOperation({ summary: '[Admin] 경주별 예측 이력 전체' })
  getByRaceHistory(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getByRaceHistory(raceId);
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '[Admin] 경주별 예측 정보 조회 (최신 1건)' })
  getByRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.getByRace(raceId);
  }

  @Post('generate/:raceId')
  @ApiOperation({ summary: '[Admin] 해당 경주 AI 예측 수동 생성' })
  generateForRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.predictionsService.generatePrediction(raceId);
  }

  /**
   * [Admin] 특정 날짜의 모든 경주 예측을 한번에 생성 (종합 매트릭스 배치용).
   * date: YYYYMMDD, meet: 서울|제주|부산경남 (선택)
   * generateBatch와 달리 기존 예측을 덮어씀, 경주 간 지연 없음.
   */
  @Post('generate-for-date')
  @ApiOperation({
    summary: '[Admin] 특정 날짜 전체 경주 예측 일괄 생성 (매트릭스 배치)',
  })
  generateForDate(
    @Body()
    body: {
      date: string;
      meet?: string;
    },
  ) {
    return this.predictionsService.generatePredictionsForDate(
      body.date,
      body.meet,
    );
  }

  /**
   * [Admin] 미생성 예측 일괄 생성 — 기간 내 예측이 없는 경주를 rcDate·경주순으로 순차 생성.
   * dateFrom/dateTo: YYYYMMDD (미입력 시 최근 30일 ~ 오늘+7일). 경주 간 지연·429 재시도 적용.
   */
  @Post('generate-batch')
  @ApiOperation({ summary: '[Admin] 미생성 예측 일괄 생성' })
  generateBatch(
    @Body()
    body: {
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    return this.predictionsService.generateBatch({
      dateFrom: body?.dateFrom,
      dateTo: body?.dateTo,
    });
  }

  /**
   * [Admin] 미생성 예측 일괄 생성 (SSE 진행률 스트림).
   * GET ?dateFrom=YYYYMMDD&dateTo=YYYYMMDD — 이벤트: { requested, current, generated, failed, lastRace?, retryAfter? }, 완료 시 { done: true, ...result }.
   */
  @Get('generate-batch-stream')
  @ApiOperation({ summary: '[Admin] 미생성 예측 일괄 생성 (진행률 스트리밍)' })
  async generateBatchStream(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res({ passthrough: false }) res?: Response,
  ) {
    if (!res) return;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const write = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    try {
      const result = await this.predictionsService.generateBatchWithProgress(
        { dateFrom, dateTo },
        (event) => write(event),
      );
      write({ done: true, ...result });
    } catch (e) {
      write({
        done: true,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      res.end();
    }
  }
}
