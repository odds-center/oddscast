import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PredictionStatus } from '../database/db-enums';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionsService } from './predictions.service';
import { GlobalConfigService } from '../config/config.service';
import { kst } from '../common/utils/kst';

/**
 * 예측 자동 생성 Cron (BUSINESS_LOGIC 1.1)
 * - 경기일 금/토/일 09:00 실행 (syncRaceDayMorning 08:00 이후)
 * - Admin ai_config.enableBatchPrediction = false 시 스킵
 * - 당일 경기 중 예측이 없는 경기에 대해 generatePrediction 호출
 */
@Injectable()
export class PredictionsScheduler {
  private readonly logger = new Logger(PredictionsScheduler.name);

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    private readonly predictionsService: PredictionsService,
    private readonly configService: GlobalConfigService,
  ) {}

  @Cron('0 9 * * 5,6,0', { timeZone: 'Asia/Seoul' })
  async generatePredictionsForToday() {
    const raw = await this.configService.get('ai_config');
    let config: Record<string, unknown> = {};
    try {
      config = raw ? JSON.parse(raw) : {};
    } catch {
      this.logger.warn('Failed to parse ai_config, using defaults');
    }
    if (config.enableBatchPrediction === false) {
      this.logger.log(
        '[Cron] Batch prediction disabled in ai_config, skipping',
      );
      return;
    }
    const today = kst().format('YYYYMMDD');
    this.logger.log(`[Cron] Generate predictions for ${today}`);

    const qbToday = this.raceRepo
      .createQueryBuilder('r')
      .select(['r.id', 'r.rcNo', 'r.meet'])
      .where('r.rcDate = :today', { today })
      .andWhere('r.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'IN_PROGRESS'],
      });
    const noPredictionSubQuery = qbToday
      .subQuery()
      .select('1')
      .from(Prediction, 'p')
      .where('p.raceId = r.id')
      .andWhere('p.status = :noPredStatus')
      .getQuery();
    const races = await qbToday
      .andWhere(`NOT EXISTS ${noPredictionSubQuery}`)
      .setParameter('noPredStatus', PredictionStatus.COMPLETED)
      .orderBy('r.id')
      .getMany();

    if (!races.length) {
      this.logger.log(`[Cron] No races to predict for ${today}`);
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const race of races) {
      try {
        await this.predictionsService.generatePrediction(race.id);
        ok++;
        this.logger.log(
          `[Cron] Prediction generated: ${race.meet} R${race.rcNo}`,
        );
      } catch (err) {
        fail++;
        this.logger.error(
          `[Cron] Failed ${race.meet} R${race.rcNo}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`[Cron] Done: ${ok} ok, ${fail} fail`);
  }

  /**
   * Generate predictions for COMPLETED races that have results but no COMPLETED prediction.
   * Run after results sync (e.g. 18:30) so users can see AI analysis on race detail without a ticket.
   */
  @Cron('30 18 * * 5,6,0', { timeZone: 'Asia/Seoul' })
  async generatePredictionsForCompletedRaces() {
    const raw = await this.configService.get('ai_config');
    let config: Record<string, unknown> = {};
    try {
      config = raw ? JSON.parse(raw) : {};
    } catch {
      this.logger.warn('Failed to parse ai_config, using defaults');
    }
    if (config.enableBatchPrediction === false) {
      this.logger.log(
        '[Cron] Batch prediction disabled, skipping completed-races batch',
      );
      return;
    }
    const today = kst();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(today.subtract(i, 'day').format('YYYYMMDD'));
    }
    const qb = this.raceRepo
      .createQueryBuilder('r')
      .select(['r.id', 'r.rcNo', 'r.meet', 'r.rcDate'])
      .where('r.rcDate IN (:...dates)', { dates })
      .andWhere('r.status = :status', { status: 'COMPLETED' });

    const hasResultSubQuery = qb
      .subQuery()
      .select('1')
      .from(RaceResult, 'rr')
      .where('rr.raceId = r.id')
      .andWhere(
        new Brackets((sq) => {
          sq.where('rr.ordInt IS NOT NULL').orWhere('rr.ordType IS NOT NULL');
        }),
      )
      .getQuery();
    qb.andWhere(`EXISTS ${hasResultSubQuery}`);

    const hasPredictionSubQuery = qb
      .subQuery()
      .select('1')
      .from(Prediction, 'p')
      .where('p.raceId = r.id')
      .andWhere('p.status = :predStatus')
      .getQuery();
    qb.andWhere(`NOT EXISTS ${hasPredictionSubQuery}`).setParameter(
      'predStatus',
      PredictionStatus.COMPLETED,
    );

    const races = await qb.orderBy('r.id').getMany();
    if (!races.length) {
      this.logger.log('[Cron] No completed races missing predictions');
      return;
    }
    this.logger.log(
      `[Cron] Generate predictions for ${races.length} completed race(s)`,
    );
    let ok = 0;
    let fail = 0;
    for (const race of races) {
      try {
        await this.predictionsService.generatePrediction(race.id);
        ok++;
        this.logger.log(
          `[Cron] Completed-race prediction: ${race.meet} R${race.rcNo} (${race.rcDate})`,
        );
      } catch (err) {
        fail++;
        this.logger.error(
          `[Cron] Failed ${race.meet} R${race.rcNo}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`[Cron] Completed-race batch: ${ok} ok, ${fail} fail`);
  }
}
