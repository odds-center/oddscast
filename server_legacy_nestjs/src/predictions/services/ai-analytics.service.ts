import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Prediction,
  DailyPredictionStats,
  ModelPerformance,
  PredictionFailure,
  FailureType,
} from '../entities';
import * as moment from 'moment-timezone';

/**
 * AI 예측 분석 서비스
 */
@Injectable()
export class AIAnalyticsService {
  private readonly logger = new Logger(AIAnalyticsService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(DailyPredictionStats)
    private readonly statsRepo: Repository<DailyPredictionStats>,
    @InjectRepository(ModelPerformance)
    private readonly performanceRepo: Repository<ModelPerformance>,
    @InjectRepository(PredictionFailure)
    private readonly failureRepo: Repository<PredictionFailure>
  ) {}

  /**
   * 일일 통계 계산
   */
  async calculateDailyStats(date: Date): Promise<DailyPredictionStats> {
    const dateStr = moment(date).format('YYYY-MM-DD');
    this.logger.log(`📊 일일 통계 계산: ${dateStr}`);

    // 해당 날짜의 예측 조회
    const startOfDay = moment(dateStr).startOf('day').toDate();
    const endOfDay = moment(dateStr).endOf('day').toDate();

    const predictions = await this.predictionRepo.find({
      where: {
        predictedAt: Between(startOfDay, endOfDay),
        verifiedAt: Not(null) as any, // 검증된 것만
      },
    });

    if (predictions.length === 0) {
      this.logger.warn(`통계 계산 불가: ${dateStr} (검증된 예측 없음)`);
      return null;
    }

    const total = predictions.length;
    const firstCorrect = predictions.filter(p => p.firstCorrect).length;
    const top3Correct = predictions.filter(p => p.inTop3).length;
    const exactOrder = predictions.filter(p => p.exactOrder).length;

    const avgConfidence =
      predictions.reduce((sum, p) => sum + Number(p.confidence), 0) / total;
    const avgAccuracyScore =
      predictions.reduce((sum, p) => sum + Number(p.accuracyScore || 0), 0) /
      total;

    const totalCost = predictions.reduce(
      (sum, p) => sum + Number(p.cost || 0),
      0
    );

    // 통계 저장
    const stats = this.statsRepo.create({
      date: dateStr as any,
      totalPredictions: total,
      firstCorrect,
      top3Correct,
      exactOrderCorrect: exactOrder,
      accuracy: (firstCorrect / total) * 100,
      top3Accuracy: (top3Correct / total) * 100,
      exactOrderAccuracy: (exactOrder / total) * 100,
      avgConfidence,
      avgAccuracyScore,
      totalCost,
    });

    await this.statsRepo.save(stats);

    this.logger.log(
      `📊 통계 저장: ${dateStr} | 정확도: ${stats.accuracy.toFixed(1)}% | 비용: ₩${totalCost.toFixed(0)}`
    );

    return stats;
  }

  /**
   * 실패 원인 분석
   */
  async analyzeFailures(startDate: Date, endDate: Date) {
    const failures = await this.predictionRepo.find({
      where: {
        firstCorrect: false,
        predictedAt: Between(startDate, endDate),
        verifiedAt: Not(null) as any,
      },
      relations: ['race'],
    });

    this.logger.log(`🔍 실패 분석: ${failures.length}건`);

    // 실패 유형 분류
    for (const prediction of failures) {
      try {
        const failureType = this.classifyFailure(prediction);
        const reason = this.generateFailureReason(prediction);

        // 실패 분석 저장
        const failure = this.failureRepo.create({
          predictionId: prediction.id,
          raceId: prediction.raceId,
          predictedFirst: prediction.predictedFirst,
          actualFirst: prediction.actualFirst,
          predictionConfidence: prediction.confidence,
          failureType,
          failureReason: reason,
          raceGrade: prediction.race?.rcGrade
            ? parseInt(String(prediction.race.rcGrade))
            : null,
          raceDistance: prediction.race?.rcDist
            ? parseInt(String(prediction.race.rcDist))
            : null,
          trackCondition: prediction.race?.rcTrackCondition,
          weather: prediction.race?.rcWeather,
        });

        await this.failureRepo.save(failure);
      } catch (error) {
        this.logger.error(`실패 분석 오류: ${prediction.id}`, error.stack);
      }
    }

    // 실패 패턴 집계
    const patterns = await this.failureRepo
      .createQueryBuilder('failure')
      .select('failure.failureType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('failure.analyzedAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('failure.failureType')
      .getRawMany();

    return {
      totalFailures: failures.length,
      patterns: patterns.map(p => ({
        type: p.type,
        count: parseInt(p.count),
        percentage: (parseInt(p.count) / failures.length) * 100,
      })),
    };
  }

  /**
   * 실패 유형 분류
   */
  private classifyFailure(prediction: Prediction): FailureType {
    // 과신: 신뢰도 85% 이상이었지만 틀림
    if (prediction.confidence >= 85) {
      return FailureType.OVERCONFIDENCE;
    }

    // 이변: 실제 우승마가 7번 이하 (인기 낮음)
    // TODO: 배당률 데이터와 연결 필요
    if (prediction.actualFirst > 6) {
      return FailureType.UPSET;
    }

    // 날씨 영향
    if (
      prediction.race?.rcWeather === '비' ||
      prediction.race?.rcWeather === '눈'
    ) {
      return FailureType.WEATHER;
    }

    // 주로 상태
    if (
      prediction.race?.rcTrackCondition === '불량' ||
      prediction.race?.rcTrackCondition === '습윤'
    ) {
      return FailureType.TRACK_CONDITION;
    }

    return FailureType.OTHER;
  }

  /**
   * 실패 이유 생성
   */
  private generateFailureReason(prediction: Prediction): string {
    const reasons: string[] = [];

    if (prediction.confidence >= 85) {
      reasons.push(`높은 신뢰도(${prediction.confidence}%)에도 불구하고 실패`);
    }

    if (prediction.actualFirst > 6) {
      reasons.push(`${prediction.actualFirst}번 말 우승 (인기 낮음)`);
    }

    if (prediction.race?.rcWeather) {
      reasons.push(`날씨: ${prediction.race.rcWeather}`);
    }

    if (prediction.race?.rcTrackCondition) {
      reasons.push(`주로 상태: ${prediction.race.rcTrackCondition}`);
    }

    return reasons.join(', ') || '원인 미상';
  }

  /**
   * 모델 성과 업데이트
   */
  async updateModelPerformance(modelVersion: string) {
    const predictions = await this.predictionRepo.find({
      where: {
        modelVersion,
        verifiedAt: Not(null) as any,
      },
    });

    if (predictions.length === 0) {
      return;
    }

    const total = predictions.length;
    const firstCorrect = predictions.filter(p => p.firstCorrect).length;
    const top3Correct = predictions.filter(p => p.inTop3).length;
    const avgConfidence =
      predictions.reduce((sum, p) => sum + Number(p.confidence), 0) / total;
    const totalCost = predictions.reduce(
      (sum, p) => sum + Number(p.cost || 0),
      0
    );

    // 모델 성과 저장/업데이트
    let performance = await this.performanceRepo.findOne({
      where: { modelVersion },
    });

    if (!performance) {
      performance = this.performanceRepo.create({
        modelVersion,
        llmProvider: predictions[0]?.llmProvider,
      });
    }

    performance.totalPredictions = total;
    performance.firstCorrect = firstCorrect;
    performance.top3Correct = top3Correct;
    performance.accuracy = (firstCorrect / total) * 100;
    performance.top3Accuracy = (top3Correct / total) * 100;
    performance.avgConfidence = avgConfidence;
    performance.totalCost = totalCost;
    performance.avgCostPerPrediction = totalCost / total;

    await this.performanceRepo.save(performance);

    this.logger.log(
      `📊 모델 성과 업데이트: ${modelVersion} | 정확도: ${performance.accuracy.toFixed(1)}%`
    );
  }

  /**
   * 정확도 대시보드 데이터
   */
  async getAccuracyDashboard() {
    // 전체 통계
    const overall = await this.predictionRepo
      .createQueryBuilder('prediction')
      .select('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN first_correct = 1 THEN 1 ELSE 0 END)',
        'firstCorrect'
      )
      .addSelect('SUM(CASE WHEN in_top3 = 1 THEN 1 ELSE 0 END)', 'top3Correct')
      .where('verified_at IS NOT NULL')
      .getRawOne();

    const total = parseInt(overall.total) || 0;
    const firstCorrect = parseInt(overall.firstCorrect) || 0;
    const top3Correct = parseInt(overall.top3Correct) || 0;

    // 최근 30일 통계
    const daily = await this.statsRepo.find({
      order: { date: 'DESC' },
      take: 30,
    });

    return {
      overall: {
        totalPredictions: total,
        accuracy: total > 0 ? (firstCorrect / total) * 100 : 0,
        top3Accuracy: total > 0 ? (top3Correct / total) * 100 : 0,
      },
      daily: daily.reverse(),
    };
  }
}

// Not helper (TypeORM)
function Not(value: any) {
  return { $ne: value };
}
