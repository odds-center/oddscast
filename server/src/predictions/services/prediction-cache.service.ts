import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from '../entities/prediction.entity';
import { CacheService } from '../../cache/cache.service';
import { PredictionResultDto } from '../dto';

/**
 * AI 예측 캐싱 서비스
 * - 3단계 캐시: Redis → DB → AI
 * - 응답 속도 최적화
 * - 비용 최소화
 */
@Injectable()
export class PredictionCacheService {
  private readonly logger = new Logger(PredictionCacheService.name);
  private readonly CACHE_PREFIX = 'ai:prediction:';
  private readonly CACHE_TTL = 3600; // 1시간

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    private readonly cacheService: CacheService
  ) {}

  /**
   * 예측 조회 (캐시 우선)
   * 1단계: Redis 캐시
   * 2단계: DB 조회
   * 3단계: null 반환 (AI 생성은 별도 처리)
   */
  async getPrediction(raceId: string): Promise<PredictionResultDto | null> {
    const cacheKey = `${this.CACHE_PREFIX}${raceId}`;

    // 1단계: Redis 캐시 확인
    const cached = await this.cacheService.get<PredictionResultDto>(cacheKey);
    if (cached) {
      this.logger.debug(`🚀 캐시 히트: ${raceId} (Redis)`);
      return {
        ...cached,
        source: 'cache',
      } as any;
    }

    // 2단계: DB 조회
    const fromDB = await this.predictionRepo.findOne({
      where: { raceId },
      order: { predictedAt: 'DESC' },
    });

    if (fromDB) {
      this.logger.debug(`💾 캐시 미스 (DB 조회): ${raceId}`);

      const dto = this.toDto(fromDB);

      // Redis에 캐시
      await this.cacheService.set(cacheKey, dto, this.CACHE_TTL);

      return {
        ...dto,
        source: 'database',
      } as any;
    }

    // 3단계: 없음
    this.logger.debug(`❌ 예측 없음: ${raceId}`);
    return null;
  }

  /**
   * 예측 캐시 저장
   */
  async cachePrediction(prediction: Prediction): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${prediction.raceId}`;
    const dto = this.toDto(prediction);

    await this.cacheService.set(cacheKey, dto, this.CACHE_TTL);
    this.logger.debug(`💾 캐시 저장: ${prediction.raceId}`);
  }

  /**
   * 예측 캐시 무효화
   */
  async invalidatePrediction(raceId: string, reason?: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${raceId}`;
    await this.cacheService.del(cacheKey);

    this.logger.log(`🗑️ 캐시 무효화: ${raceId}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * 경주 시작 후 TTL 연장
   */
  async extendCacheForFinishedRace(raceId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${raceId}`;
    await this.cacheService.expire(cacheKey, 86400); // 24시간
    this.logger.debug(`⏰ TTL 연장: ${raceId} (24시간)`);
  }

  /**
   * Entity → DTO
   */
  private toDto(prediction: Prediction): PredictionResultDto {
    return {
      id: prediction.id,
      raceId: prediction.raceId,
      predictedFirst: prediction.predictedFirst,
      predictedSecond: prediction.predictedSecond,
      predictedThird: prediction.predictedThird,
      analysis: prediction.analysis,
      confidence: prediction.confidence,
      warnings: prediction.warnings,
      factors: prediction.factors,
      modelVersion: prediction.modelVersion,
      llmProvider: prediction.llmProvider,
      cost: prediction.cost,
      responseTime: prediction.responseTime,
      firstCorrect: prediction.firstCorrect,
      inTop3: prediction.inTop3,
      exactOrder: prediction.exactOrder,
      accuracyScore: prediction.accuracyScore,
      predictedAt: prediction.predictedAt,
      updatedAt: prediction.updatedAt,
      verifiedAt: prediction.verifiedAt,
    };
  }
}
