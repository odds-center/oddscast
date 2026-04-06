import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AnalyticsService,
  type TrackConditionStat,
  type PostPositionStat,
  type JockeyTrainerComboStat,
  type PredictionAccuracyByMeet,
  type DistanceWinRate,
} from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('track-condition')
  @ApiOperation({ summary: 'Win rates by track surface condition (public)' })
  @ApiQuery({ name: 'meet', required: false, description: '서울 | 제주 | 부산경남' })
  async getTrackConditionStats(
    @Query('meet') meet?: string,
  ): Promise<TrackConditionStat[]> {
    return this.analyticsService.getTrackConditionStats(meet);
  }

  @Get('post-position')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Win rates by starting gate number (auth required)' })
  @ApiQuery({ name: 'meet', required: false, description: '서울 | 제주 | 부산경남' })
  async getPostPositionStats(
    @Query('meet') meet?: string,
  ): Promise<PostPositionStat[]> {
    return this.analyticsService.getPostPositionStats(meet);
  }

  @Get('jockey-trainer-combos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top 20 jockey-trainer combinations by win rate (auth required)' })
  @ApiQuery({ name: 'meet', required: false, description: '서울 | 제주 | 부산경남' })
  async getJockeyTrainerComboStats(
    @Query('meet') meet?: string,
  ): Promise<JockeyTrainerComboStat[]> {
    return this.analyticsService.getJockeyTrainerComboStats(meet);
  }

  @Get('prediction-accuracy')
  @ApiOperation({ summary: 'AI prediction accuracy grouped by race meet (public)' })
  async getPredictionAccuracyByMeet(): Promise<PredictionAccuracyByMeet[]> {
    return this.analyticsService.getPredictionAccuracyByMeet();
  }

  @Get('distance-win-rates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Win rates by distance range bucket (auth required)' })
  @ApiQuery({ name: 'meet', required: false, description: '서울 | 제주 | 부산경남' })
  async getDistanceWinRates(
    @Query('meet') meet?: string,
  ): Promise<DistanceWinRate[]> {
    return this.analyticsService.getDistanceWinRates(meet);
  }
}
