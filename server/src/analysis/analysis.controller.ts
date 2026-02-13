import { Controller, Get, Param } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

/**
 * KRA 분석 API (기수 점수, 2단계 필터링)
 */
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * 경주별 기수·말 통합 분석 (마칠기삼)
   * GET /api/analysis/race/:raceId/jockey
   */
  @Get('race/:raceId/jockey')
  async getJockeyAnalysis(@Param('raceId') raceId: string) {
    return this.analysisService.analyzeJockey(raceId);
  }
}
