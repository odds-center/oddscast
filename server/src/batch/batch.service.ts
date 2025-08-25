import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KraApiService } from '../external-apis/kra/kra-api.service';
import { RacePlan } from '../entities/race-plan.entity';
import { Race } from '../entities/race.entity';
import { RaceHorseResult } from '../entities/race-horse-result.entity';
import { DividendRate } from '../entities/dividend-rate.entity';
import { EntryDetail } from '../entities/entry-detail.entity';
import * as moment from 'moment';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectRepository(RacePlan)
    private readonly racePlanRepository: Repository<RacePlan>,
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
    @InjectRepository(RaceHorseResult)
    private readonly raceHorseResultRepository: Repository<RaceHorseResult>,
    @InjectRepository(DividendRate)
    private readonly dividendRateRepository: Repository<DividendRate>,
    @InjectRepository(EntryDetail)
    private readonly entryDetailRepository: Repository<EntryDetail>,
    private readonly kraApiService: KraApiService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 매일 오전 6시에 실행되는 배치 작업
   * 전날의 경주 데이터를 KRA API에서 수집하여 로컬 DB에 저장
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    name: 'daily-kra-data-sync',
    timeZone: 'Asia/Seoul',
  })
  async dailyKraDataSync() {
    // 배치 작업이 비활성화되어 있으면 실행하지 않음
    if (!this.configService.get('BATCH_ENABLED', true)) {
      this.logger.log('배치 작업이 비활성화되어 있습니다.');
      return;
    }

    this.logger.log('일일 KRA 데이터 동기화 시작');

    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      await this.syncRacePlans(yesterday);
      await this.syncRaceResults(yesterday);
      await this.syncDividendRates(yesterday);
      await this.syncEntryDetails(yesterday);

      this.logger.log(`일일 KRA 데이터 동기화 완료: ${yesterday}`);
    } catch (error) {
      this.logger.error('일일 KRA 데이터 동기화 실패:', error);
    }
  }

  /**
   * 경주계획 데이터 동기화
   */
  async syncRacePlans(date: string) {
    try {
      this.logger.log(`경주계획 데이터 동기화 시작: ${date}`);

      // KRA API에서 경주계획 조회
      const racePlansResponse = await this.kraApiService.getRacePlans(date);

      if (racePlansResponse.success && racePlansResponse.data) {
        const racePlans = racePlansResponse.data;

        for (const plan of racePlans) {
          // 기존 데이터 확인
          const existingPlan = await this.racePlanRepository.findOne({
            where: {
              rcDate: plan.rc_date,
              meet: plan.meet,
              rcNo: plan.rc_no,
            },
          });

          if (existingPlan) {
            // 기존 데이터 업데이트
            await this.racePlanRepository.update(existingPlan.id, {
              rcName: plan.rc_name,
              distance: plan.distance,
              grade: plan.grade,
              prize: plan.prize,
              rating: plan.rating,
              ageCondition: plan.age_condition,
              sexCondition: plan.sex_condition,
              updatedAt: new Date(),
            });
          } else {
            // 새 데이터 생성
            const newPlan = this.racePlanRepository.create({
              rcDate: plan.rc_date,
              meet: plan.meet,
              rcNo: plan.rc_no,
              rcName: plan.rc_name,
              distance: plan.distance,
              grade: plan.grade,
              prize: plan.prize,
              rating: plan.rating,
              ageCondition: plan.age_condition,
              sexCondition: plan.sex_condition,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await this.racePlanRepository.save(newPlan);
          }
        }

        this.logger.log(`경주계획 데이터 동기화 완료: ${racePlans.length}건`);
      }
    } catch (error) {
      this.logger.error(`경주계획 데이터 동기화 실패: ${date}`, error);
    }
  }

  /**
   * 경주 결과 데이터 동기화
   */
  async syncRaceResults(date: string) {
    try {
      this.logger.log(`경주 결과 데이터 동기화 시작: ${date}`);

      // KRA API에서 경주기록 조회
      const raceRecordsResponse = await this.kraApiService.getRaceRecords(date);

      if (raceRecordsResponse.success && raceRecordsResponse.data) {
        const raceRecords = raceRecordsResponse.data;

        for (const record of raceRecords) {
          // 기존 결과 확인
          const existingResult = await this.raceHorseResultRepository.findOne({
            where: {
              rcDate: record.rc_date,
              meet: record.meet,
              rcNo: record.rc_no,
              horseNo: record.horse_no,
            },
          });

          if (existingResult) {
            // 기존 데이터 업데이트
            await this.raceHorseResultRepository.update(existingResult.id, {
              finishTime: record.finish_time,
              finishRank: record.finish_rank,
              finishLength: record.finish_length,
              jockey: record.jockey,
              trainer: record.trainer,
              updatedAt: new Date(),
            });
          } else {
            // 새 데이터 생성
            const newResult = this.raceHorseResultRepository.create({
              rcDate: record.rc_date,
              meet: record.meet,
              rcNo: record.rc_no,
              horseNo: record.horse_no,
              horseName: record.horse_name,
              finishTime: record.finish_time,
              finishRank: record.finish_rank,
              finishLength: record.finish_length,
              jockey: record.jockey,
              trainer: record.trainer,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await this.raceHorseResultRepository.save(newResult);
          }
        }

        this.logger.log(
          `경주 결과 데이터 동기화 완료: ${raceRecords.length}건`
        );
      }
    } catch (error) {
      this.logger.error(`경주 결과 데이터 동기화 실패: ${date}`, error);
    }
  }

  /**
   * 확정배당율 데이터 동기화
   */
  async syncDividendRates(date: string) {
    try {
      this.logger.log(`확정배당율 데이터 동기화 시작: ${date}`);

      // KRA API에서 확정배당율 조회
      const dividendResponse = await this.kraApiService.getDividendRates(date);

      if (dividendResponse.success && dividendResponse.data) {
        const dividends = dividendResponse.data;

        for (const dividend of dividends) {
          // 기존 배당율 확인
          const existingDividend = await this.dividendRateRepository.findOne({
            where: {
              rcDate: dividend.rc_date,
              meet: dividend.meet,
              rcNo: dividend.rc_no,
              pool: dividend.pool,
            },
          });

          if (existingDividend) {
            // 기존 데이터 업데이트
            await this.dividendRateRepository.update(existingDividend.id, {
              dividendRate: dividend.dividend_rate,
              updatedAt: new Date(),
            });
          } else {
            // 새 데이터 생성
            const newDividend = this.dividendRateRepository.create({
              rcDate: dividend.rc_date,
              meet: dividend.meet,
              rcNo: dividend.rc_no,
              pool: dividend.pool,
              dividendRate: dividend.dividend_rate,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await this.dividendRateRepository.save(newDividend);
          }
        }

        this.logger.log(`확정배당율 데이터 동기화 완료: ${dividends.length}건`);
      }
    } catch (error) {
      this.logger.error(`확정배당율 데이터 동기화 실패: ${date}`, error);
    }
  }

  /**
   * 출마표 상세정보 동기화
   */
  async syncEntryDetails(date: string) {
    try {
      this.logger.log(`출마표 상세정보 동기화 시작: ${date}`);

      // KRA API에서 출마표 조회
      const entryResponse = await this.kraApiService.getEntryDetails(date);

      if (entryResponse.success && entryResponse.data) {
        const entries = entryResponse.data;

        for (const entry of entries) {
          // 기존 출마표 확인
          const existingEntry = await this.entryDetailRepository.findOne({
            where: {
              rcDate: entry.rc_date,
              meet: entry.meet,
              rcNo: entry.rc_no,
              horseNo: entry.horse_no,
            },
          });

          if (existingEntry) {
            // 기존 데이터 업데이트
            await this.entryDetailRepository.update(existingEntry.id, {
              horseName: entry.horse_name,
              jockey: entry.jockey,
              trainer: entry.trainer,
              weight: entry.weight,
              rating: entry.rating,
              updatedAt: new Date(),
            });
          } else {
            // 새 데이터 생성
            const newEntry = this.entryDetailRepository.create({
              rcDate: entry.rc_date,
              meet: entry.meet,
              rcNo: entry.rc_no,
              horseNo: entry.horse_no,
              horseName: entry.horse_name,
              jockey: entry.jockey,
              trainer: entry.trainer,
              weight: entry.weight,
              rating: entry.rating,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await this.entryDetailRepository.save(newEntry);
          }
        }

        this.logger.log(`출마표 상세정보 동기화 완료: ${entries.length}건`);
      }
    } catch (error) {
      this.logger.error(`출마표 상세정보 동기화 실패: ${date}`, error);
    }
  }

  /**
   * 수동으로 특정 날짜의 데이터 동기화 실행
   */
  async manualSync(date: string) {
    this.logger.log(`수동 데이터 동기화 시작: ${date}`);

    try {
      await this.syncRacePlans(date);
      await this.syncRaceResults(date);
      await this.syncDividendRates(date);
      await this.syncEntryDetails(date);

      this.logger.log(`수동 데이터 동기화 완료: ${date}`);
      return {
        success: true,
        message: `데이터 동기화가 완료되었습니다: ${date}`,
      };
    } catch (error) {
      this.logger.error(`수동 데이터 동기화 실패: ${date}`, error);
      return {
        success: false,
        message: `데이터 동기화에 실패했습니다: ${error.message}`,
      };
    }
  }

  /**
   * 데이터 동기화 상태 확인
   */
  async getSyncStatus() {
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

    const todayRacePlans = await this.racePlanRepository.count({
      where: { rcDate: today },
    });

    const yesterdayRacePlans = await this.racePlanRepository.count({
      where: { rcDate: yesterday },
    });

    const todayResults = await this.raceHorseResultRepository.count({
      where: { rcDate: today },
    });

    const yesterdayResults = await this.raceHorseResultRepository.count({
      where: { rcDate: yesterday },
    });

    return {
      today: {
        date: today,
        racePlans: todayRacePlans,
        results: todayResults,
      },
      yesterday: {
        date: yesterday,
        racePlans: yesterdayRacePlans,
        results: yesterdayResults,
      },
      lastSync: await this.getLastSyncTime(),
    };
  }

  /**
   * 마지막 동기화 시간 조회
   */
  private async getLastSyncTime() {
    const lastRacePlan = await this.racePlanRepository.findOne({
      order: { updatedAt: 'DESC' },
    });

    const lastResult = await this.raceHorseResultRepository.findOne({
      order: { updatedAt: 'DESC' },
    });

    return {
      racePlans: lastRacePlan?.updatedAt,
      results: lastResult?.updatedAt,
    };
  }
}
