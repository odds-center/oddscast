import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import {
  Prediction,
  PredictionUpdate,
  PredictionFailure,
  DailyPredictionStats,
  ModelPerformance,
  UserPredictionFeedback,
} from './entities';
import { Race } from '../races/entities/race.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { PredictionTicket } from '../prediction-tickets/entities/prediction-ticket.entity';
import { LlmModule } from '../llm/llm.module';
import { CacheModule } from '../cache/cache.module';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';
import {
  AIBatchService,
  AIAnalyticsService,
  SmartUpdateService,
  PredictionCacheService,
  CostOptimizerService,
  PromptManagerService,
} from './services';

/**
 * 예측 모듈 (AI 캐싱 최적화)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 예측 관련 Entity
      Prediction,
      PredictionUpdate,
      PredictionFailure,
      DailyPredictionStats,
      ModelPerformance,
      UserPredictionFeedback,
      // 관련 Entity
      Race,
      EntryDetail,
      DividendRate,
      PredictionTicket,
    ]),
    LlmModule,
    CacheModule, // Redis 캐싱
    PredictionTicketsModule, // 예측권
  ],
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    AIBatchService, // 배치 예측
    AIAnalyticsService, // 분석
    SmartUpdateService, // 스마트 업데이트
    PredictionCacheService, // 캐싱 레이어
    CostOptimizerService, // 비용 최적화
    PromptManagerService, // 프롬프트 관리
  ],
  exports: [
    PredictionsService,
    AIBatchService,
    AIAnalyticsService,
    PredictionCacheService,
    CostOptimizerService,
  ],
})
export class PredictionsModule {}
