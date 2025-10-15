import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Prediction } from '../entities/prediction.entity';
import {
  PredictionUpdate,
  UpdateReason,
} from '../entities/prediction-update.entity';
import { Race } from '../../races/entities/race.entity';
import { PredictionsService } from '../predictions.service';
import * as moment from 'moment-timezone';

/**
 * AI 배치 예측 서비스
 * - 매일 오전 9시: 오늘 경주 사전 예측
 * - 10분마다: 임박 경주 업데이트
 * - 1시간마다: 캐시 정리
 * - 자정: 어제 예측 검증
 */
@Injectable()
export class AIBatchService {
  private readonly logger = new Logger(AIBatchService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(PredictionUpdate)
    private readonly updateRepo: Repository<PredictionUpdate>,
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    private readonly predictionsService: PredictionsService
  ) {}

  /**
   * 매일 오전 9시 - 오늘 경주 사전 예측
   */
  @Cron('0 9 * * *', {
    name: 'daily-batch-prediction',
    timeZone: 'Asia/Seoul',
  })
  async batchPredictTodayRaces() {
    this.logger.log('🤖 [배치 예측] 시작');

    const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');

    // 오늘 경주 목록 조회
    const races = await this.raceRepo.find({
      where: {
        rcDate: today as any,
      },
      order: { rcNo: 'ASC' },
    });

    if (races.length === 0) {
      this.logger.warn(`[배치 예측] 오늘 경주 없음: ${today}`);
      return;
    }

    this.logger.log(`[배치 예측] ${races.length}개 경주 발견`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const race of races) {
      try {
        // 이미 예측이 있으면 스킵
        const existing = await this.predictionRepo.findOne({
          where: { raceId: race.id },
        });

        if (existing) {
          this.logger.debug(`⏭️ 스킵: ${race.id} (이미 예측 존재)`);
          skipCount++;
          continue;
        }

        // AI 예측 생성 (여기서 실제 LLM 호출)
        const prediction = await this.predictionsService.generatePrediction({
          raceId: race.id,
        });

        successCount++;
        this.logger.log(
          `✅ 예측 완료: ${race.id} | 1위: ${prediction.predictedFirst}번 | 신뢰도: ${prediction.confidence}%`
        );

        // API Rate Limit 방지 (1초 대기)
        await this.sleep(1000);
      } catch (error) {
        failCount++;
        this.logger.error(`❌ 예측 실패: ${race.id}`, error.stack);
      }
    }

    this.logger.log(
      `🎉 [배치 예측] 완료 | 성공: ${successCount}, 스킵: ${skipCount}, 실패: ${failCount}`
    );
  }

  /**
   * 10분마다 - 경주 시작 전 예측 업데이트
   *
   * ✅ 비즈니스 로직:
   * - 예측이 업데이트되면 사용자는 새 예측권으로 다시 봐야 함
   * - 예측권 소비 증가 → 수익 증가
   */
  @Cron('*/10 * * * *', {
    name: 'update-upcoming-predictions',
    timeZone: 'Asia/Seoul',
  })
  async updateUpcomingRacePredictions() {
    this.logger.log('🔄 [예측 업데이트] 시작');

    const now = moment().tz('Asia/Seoul');

    // 지금부터 1시간 이내 시작하는 경주
    const oneHourLater = moment(now).add(1, 'hour');

    const upcomingRaces = await this.raceRepo
      .createQueryBuilder('race')
      .where('race.rcDate = :date', { date: now.format('YYYY-MM-DD') })
      .andWhere('race.rcTime BETWEEN :now AND :later', {
        now: now.format('HH:mm:ss'),
        later: oneHourLater.format('HH:mm:ss'),
      })
      .getMany();

    if (upcomingRaces.length === 0) {
      this.logger.debug('[예측 업데이트] 1시간 이내 경주 없음');
      return;
    }

    this.logger.log(
      `[예측 업데이트] ${upcomingRaces.length}개 경주 업데이트 대상`
    );

    let updateCount = 0;

    for (const race of upcomingRaces) {
      try {
        // 기존 예측 조회
        const existing = await this.predictionRepo.findOne({
          where: { raceId: race.id },
        });

        if (!existing) {
          this.logger.debug(`⏭️ 스킵: ${race.id} (예측 없음)`);
          continue;
        }

        // 경주 시작했으면 업데이트 중단
        if (existing.isFinalized) {
          this.logger.debug(`⏭️ 스킵: ${race.id} (이미 경주 시작)`);
          continue;
        }

        // 새로운 예측 생성
        const newPrediction = await this.predictionsService.generatePrediction({
          raceId: race.id,
          llmProvider: 'openai',
        });

        // 기존 예측과 다른지 확인
        const hasChanged =
          existing.predictedFirst !== newPrediction.predictedFirst ||
          existing.predictedSecond !== newPrediction.predictedSecond ||
          existing.predictedThird !== newPrediction.predictedThird;

        if (!hasChanged) {
          this.logger.debug(`⏭️ 변경 없음: ${race.id}`);
          continue;
        }

        // 업데이트 이력 저장
        const update = this.updateRepo.create({
          predictionId: existing.id,
          oldFirst: existing.predictedFirst,
          newFirst: newPrediction.predictedFirst,
          oldSecond: existing.predictedSecond,
          newSecond: newPrediction.predictedSecond,
          oldThird: existing.predictedThird,
          newThird: newPrediction.predictedThird,
          oldConfidence: existing.confidence,
          newConfidence: newPrediction.confidence,
          updateReason: UpdateReason.SCHEDULED,
          cost: newPrediction.cost,
        });

        await this.updateRepo.save(update);

        // 기존 예측 업데이트 (덮어쓰기)
        existing.predictedFirst = newPrediction.predictedFirst;
        existing.predictedSecond = newPrediction.predictedSecond;
        existing.predictedThird = newPrediction.predictedThird;
        existing.confidence = newPrediction.confidence;
        existing.analysis = newPrediction.analysis;
        existing.warnings = newPrediction.warnings;
        existing.factors = newPrediction.factors;
        existing.updatedAt = new Date(); // 중요: 업데이트 시각 갱신

        await this.predictionRepo.save(existing);

        updateCount++;
        this.logger.log(
          `🔄 업데이트: ${race.id} | ${existing.predictedFirst}번 → ${newPrediction.predictedFirst}번`
        );

        // API Rate Limit 방지
        await this.sleep(1000);
      } catch (error) {
        this.logger.error(`❌ 업데이트 실패: ${race.id}`, error.stack);
      }
    }

    this.logger.log(`🎉 [예측 업데이트] 완료 | 업데이트: ${updateCount}개`);
  }

  /**
   * 1분마다 - 경주 시작된 것 finalize 처리
   */
  @Cron('*/1 * * * *', {
    name: 'finalize-started-races',
    timeZone: 'Asia/Seoul',
  })
  async finalizeStartedRaces() {
    const now = moment().tz('Asia/Seoul');
    const currentTime = now.format('HH:mm:ss');

    // 경주 시작 시간 지난 것
    const startedRaces = await this.raceRepo
      .createQueryBuilder('race')
      .where('race.rcDate = :date', { date: now.format('YYYY-MM-DD') })
      .andWhere('race.rcTime < :time', { time: currentTime })
      .getMany();

    if (startedRaces.length === 0) {
      return;
    }

    // 해당 경주의 예측을 finalize
    for (const race of startedRaces) {
      await this.predictionRepo.update(
        { raceId: race.id },
        { isFinalized: true }
      );
    }

    this.logger.debug(
      `🏁 [경주 시작] ${startedRaces.length}개 경주 finalize 처리`
    );
  }

  /**
   * 매일 자정 - 어제 예측 검증
   */
  @Cron('0 0 * * *', {
    name: 'verify-yesterday-predictions',
    timeZone: 'Asia/Seoul',
  })
  async verifyYesterdayPredictions() {
    this.logger.log('✅ [예측 검증] 시작');

    const yesterday = moment()
      .tz('Asia/Seoul')
      .subtract(1, 'day')
      .format('YYYY-MM-DD');

    // 어제 경주 목록
    const races = await this.raceRepo.find({
      where: {
        rcDate: yesterday as any,
      },
      relations: ['results'],
    });

    this.logger.log(`[예측 검증] ${races.length}개 경주 검증 대상`);

    let verifiedCount = 0;

    for (const race of races) {
      try {
        // 예측 조회
        const prediction = await this.predictionRepo.findOne({
          where: { raceId: race.id },
        });

        if (!prediction || prediction.verifiedAt) {
          continue; // 예측 없거나 이미 검증됨
        }

        // 결과 조회
        const results = race.results;
        if (!results || results.length === 0) {
          this.logger.warn(`결과 없음: ${race.id}`);
          continue;
        }

        // 1,2,3위 찾기
        const sorted = results.sort((a, b) => {
          const ordA = typeof a.ord === 'string' ? parseInt(a.ord) : a.ord;
          const ordB = typeof b.ord === 'string' ? parseInt(b.ord) : b.ord;
          return ordA - ordB;
        });
        const first = parseInt(sorted[0]?.hrNo);
        const second = parseInt(sorted[1]?.hrNo);
        const third = parseInt(sorted[2]?.hrNo);

        if (!first || !second || !third) {
          continue;
        }

        // 검증
        prediction.verifyPrediction(first, second, third);
        await this.predictionRepo.save(prediction);

        verifiedCount++;
        this.logger.log(
          `✅ 검증: ${race.id} | 정확도: ${prediction.accuracyScore}점`
        );
      } catch (error) {
        this.logger.error(`❌ 검증 실패: ${race.id}`, error.stack);
      }
    }

    this.logger.log(`🎉 [예측 검증] 완료 | 검증: ${verifiedCount}개`);
  }

  /**
   * Sleep 유틸리티
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
