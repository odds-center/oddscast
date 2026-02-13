import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelPerformance, Prediction } from '../entities';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { AVAILABLE_MODELS, MODEL_STRATEGY } from '../config/model-config';

/**
 * AI 비용 최적화 전략
 * - 초기 예측: GPT-4 (정확)
 * - 업데이트: GPT-3.5 (저렴)
 * - 중요 경주: GPT-4 유지
 * - 일반 경주: GPT-3.5 사용
 */
@Injectable()
export class CostOptimizerService {
  private readonly logger = new Logger(CostOptimizerService.name);

  // 모델별 비용 (config에서 가져옴)
  private readonly MODEL_COSTS = _.mapValues(AVAILABLE_MODELS, 'cost');

  constructor(
    @InjectRepository(ModelPerformance)
    private readonly performanceRepo: Repository<ModelPerformance>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>
  ) {}

  /**
   * 최적 모델 선택 (단일 모델 + 폴백)
   * - GPT-4 Turbo 기본 사용
   * - 실패 시 다른 GPT 모델로 폴백
   */
  async selectOptimalModel(context: {
    raceId: string;
    raceGrade?: number;
    racePrize?: number;
    isUpdate?: boolean;
    currentBudget?: number;
  }): Promise<string> {
    // 단일 모델 전략: GPT-4 Turbo
    // 일관성 유지, 복잡도 최소화

    this.logger.debug(`모델 선택: ${MODEL_STRATEGY.PRIMARY}`);
    return MODEL_STRATEGY.PRIMARY;
  }

  /**
   * 폴백 모델 조회
   * GPT-4 Turbo 실패 시 순차적으로 시도
   */
  getFallbackModels(): string[] {
    return [...MODEL_STRATEGY.FALLBACK];
  }

  /**
   * 최고 성과 모델 조회
   */
  async getBestPerformingModel(): Promise<{
    modelVersion: string;
    accuracy: number;
    cost: number;
    costEfficiency: number;
  }> {
    const models = await this.performanceRepo.find({
      where: { isActive: true },
    });

    if (models.length === 0) {
      return {
        modelVersion: 'gpt-4-turbo',
        accuracy: 0,
        cost: 54,
        costEfficiency: 0,
      };
    }

    // 비용 대비 정확도 계산
    const withEfficiency = models.map(m => ({
      modelVersion: m.modelVersion,
      accuracy: m.accuracy || 0,
      cost: m.avgCostPerPrediction || this.MODEL_COSTS[m.modelVersion] || 54,
      costEfficiency:
        (m.accuracy || 0) /
        (m.avgCostPerPrediction || this.MODEL_COSTS[m.modelVersion] || 54),
    }));

    // 효율성 가장 높은 모델
    const best = withEfficiency.sort(
      (a, b) => b.costEfficiency - a.costEfficiency
    )[0];

    return best;
  }

  /**
   * 일일 예산 체크
   */
  async getDailyBudgetRemaining(date: Date = new Date()): Promise<number> {
    const dateStr = moment(date).tz('Asia/Seoul').format('YYYY-MM-DD');

    // 일일 예산: ₩5,000
    const DAILY_BUDGET = 5000;

    // 오늘 사용한 비용 조회
    const used = await this.predictionRepo
      .createQueryBuilder('prediction')
      .select('SUM(prediction.cost)', 'totalCost')
      .where('DATE(prediction.predicted_at) = :date', { date: dateStr })
      .getRawOne();

    const totalCost = _.toNumber(used?.totalCost) || 0;
    const remaining = _.max([0, DAILY_BUDGET - totalCost]) || 0;

    this.logger.debug(`일일 예산: 사용 ₩${totalCost} / 남음 ₩${remaining}`);

    return remaining;
  }

  /**
   * 월간 비용 예측
   */
  async predictMonthlyCost(averageDailyRaces = 12): Promise<{
    estimatedMonthlyCost: number;
    breakdown: {
      batchPredictions: number;
      updates: number;
      total: number;
    };
  }> {
    // 배치 예측 비용
    const batchCost = averageDailyRaces * this.MODEL_COSTS['gpt-4-turbo']; // ₩648/일

    // 업데이트 비용 (경주당 6회, 50%만 업데이트)
    const updateCount = averageDailyRaces * 6 * 0.5;
    const updateCost = updateCount * this.MODEL_COSTS['gpt-3.5-turbo']; // ₩360/일

    const dailyTotal = batchCost + updateCost;
    const monthlyTotal = dailyTotal * 30;

    return {
      estimatedMonthlyCost: monthlyTotal,
      breakdown: {
        batchPredictions: batchCost * 30,
        updates: updateCost * 30,
        total: monthlyTotal,
      },
    };
  }

  /**
   * 비용 대비 효과 분석
   */
  async analyzeCostEffectiveness(): Promise<{
    totalCost: number;
    totalPredictions: number;
    avgCostPerPrediction: number;
    avgAccuracy: number;
    costPerAccuratePrediction: number;
    recommendation: string;
  }> {
    // 전체 통계 조회
    const stats = await this.predictionRepo
      .createQueryBuilder('prediction')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(prediction.cost)', 'totalCost')
      .addSelect('AVG(prediction.cost)', 'avgCost')
      .addSelect('AVG(prediction.accuracy_score)', 'avgAccuracy')
      .addSelect(
        'SUM(CASE WHEN prediction.first_correct = 1 THEN 1 ELSE 0 END)',
        'correctCount'
      )
      .where('prediction.verified_at IS NOT NULL')
      .getRawOne();

    const total = _.toInteger(stats?.total) || 0;
    const totalCost = _.toNumber(stats?.totalCost) || 0;
    const avgCost = _.toNumber(stats?.avgCost) || 0;
    const avgAccuracy = _.toNumber(stats?.avgAccuracy) || 0;
    const correctCount = _.toInteger(stats?.correctCount) || 0;

    const costPerAccurate =
      correctCount > 0 ? _.round(totalCost / correctCount, 2) : 0;

    // 권장 사항
    let recommendation = '';
    if (avgCost > 50) {
      recommendation = 'GPT-3.5 사용 비율 증가 권장';
    } else if (avgAccuracy < 25) {
      recommendation = 'GPT-4 사용 비율 증가 권장 (정확도 향상)';
    } else {
      recommendation = '현재 모델 믹스 유지';
    }

    return {
      totalCost: _.round(totalCost, 2),
      totalPredictions: total,
      avgCostPerPrediction: _.round(avgCost, 2),
      avgAccuracy: _.round(avgAccuracy, 2),
      costPerAccuratePrediction: costPerAccurate,
      recommendation,
    };
  }
}
