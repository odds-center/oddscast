import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction, PredictionUpdate, UpdateReason } from '../entities';
import { DividendRate } from '../../results/entities/dividend-rate.entity';
import * as moment from 'moment-timezone';

/**
 * 스마트 업데이트 서비스
 * - 배당률 변화 감지
 * - 조건부 업데이트
 * - 비용 최적화
 */
@Injectable()
export class SmartUpdateService {
  private readonly logger = new Logger(SmartUpdateService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(DividendRate)
    private readonly dividendRepo: Repository<DividendRate>
  ) {}

  /**
   * 업데이트 필요 여부 판단
   */
  async shouldUpdate(raceId: string): Promise<boolean> {
    const prediction = await this.predictionRepo.findOne({
      where: { raceId },
      relations: ['race'],
    });

    if (!prediction) {
      return false; // 예측 없음
    }

    // 1. 경주 시작 후면 업데이트 불필요
    if (prediction.isFinalized) {
      return false;
    }

    // 2. 최근 10분 이내 업데이트했으면 스킵
    if (prediction.updatedAt) {
      const diffMinutes = moment().diff(
        moment(prediction.updatedAt),
        'minutes'
      );
      if (diffMinutes < 10) {
        this.logger.debug(`⏭️ 최근 업데이트: ${raceId} (${diffMinutes}분 전)`);
        return false;
      }
    }

    // 3. 배당률 큰 변화 확인
    const oddsChange = await this.calculateOddsChange(
      raceId,
      prediction.predictedFirst
    );
    if (oddsChange > 0.15) {
      // 15% 이상 변화
      this.logger.log(
        `⚡ 배당률 급변 감지: ${raceId} (${(oddsChange * 100).toFixed(1)}%)`
      );
      return true;
    }

    // 4. 날씨 변화 확인 (TODO: 실시간 날씨 API 연동 시)
    // const weatherChanged = await this.checkWeatherChange(raceId);
    // if (weatherChanged) return true;

    // 5. 정기 업데이트 (10분마다)
    return true;
  }

  /**
   * 배당률 변화 계산
   */
  async calculateOddsChange(raceId: string, horseNo: number): Promise<number> {
    try {
      // 최신 배당률 조회
      const latestOdds = await this.dividendRepo
        .createQueryBuilder('dividend')
        .where('dividend.race_id = :raceId', { raceId })
        .andWhere('dividend.pool = :pool', { pool: '단승식' })
        .andWhere('dividend.chul_no = :hrNo', { hrNo: horseNo })
        .orderBy('dividend.created_at', 'DESC')
        .getOne();

      if (!latestOdds) {
        return 0;
      }

      // 10분 전 배당률 조회
      const tenMinutesAgo = moment().subtract(10, 'minutes').toDate();
      const oldOdds = await this.dividendRepo
        .createQueryBuilder('dividend')
        .where('dividend.race_id = :raceId', { raceId })
        .andWhere('dividend.pool = :pool', { pool: '단승식' })
        .andWhere('dividend.chul_no = :hrNo', { hrNo: horseNo })
        .andWhere('dividend.created_at < :time', { time: tenMinutesAgo })
        .orderBy('dividend.created_at', 'DESC')
        .getOne();

      if (!oldOdds) {
        return 0;
      }

      // 변화율 계산
      const change =
        Math.abs(Number(latestOdds.odds) - Number(oldOdds.odds)) /
        Number(oldOdds.odds);

      return change;
    } catch (error) {
      this.logger.error(`배당률 변화 계산 오류: ${raceId}`, error.stack);
      return 0;
    }
  }

  /**
   * 업데이트 우선순위 결정
   */
  async getUpdatePriority(raceId: string): Promise<number> {
    // TODO: 구현
    // - HORSE_WITHDRAWN: 우선순위 1
    // - ODDS_CHANGED (15%+): 우선순위 2
    // - WEATHER_CHANGED: 우선순위 3
    // - SCHEDULED: 우선순위 4

    return 4; // 기본: 정기 업데이트
  }
}

// Not helper
function Not(value: any) {
  return { $ne: value };
}
