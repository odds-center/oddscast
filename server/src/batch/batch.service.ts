import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KraApiService } from '../external-apis/kra/kra-api.service';
import { RacePlan } from '../races/entities/race-plan.entity';
import { Race } from '../races/entities/race.entity';
import { RaceHorseResult } from '../results/entities/race-horse-result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import {
  mapKraRacePlanToRacePlan,
  mapKraRaceRecordToRaceHorseResult,
  mapKraDividendToDividendRate,
  mapKraEntryToEntryDetail,
} from './kra-data-mapper';
import * as moment from 'moment-timezone';
import { isEmpty, isArray } from 'lodash';

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
    if (!this.configService.get('BATCH_ENABLED', true)) {
      this.logger.log('배치 작업이 비활성화되어 있습니다.');
      return;
    }

    this.logger.log('일일 KRA 데이터 동기화 시작');
    const startTime = Date.now();

    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

      // 순차적으로 실행하여 에러 발생 시 다음 단계 진행
      await this.syncRacePlans(yesterday);
      await this.syncRaceResults(yesterday);
      await this.syncDividendRates(yesterday);
      await this.syncEntryDetails(yesterday);

      const duration = Date.now() - startTime;
      this.logger.log(
        `일일 KRA 데이터 동기화 완료: ${yesterday} (소요시간: ${duration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `일일 KRA 데이터 동기화 실패 (소요시간: ${duration}ms):`,
        error
      );

      // 에러 발생 시에도 로깅만 수행
      this.logger.error('동기화 실패로 인한 상태 업데이트 생략');
    }
  }

  /**
   * 경주계획 데이터 동기화
   */
  async syncRacePlans(date: string) {
    try {
      this.logger.log(`경주계획 데이터 동기화 시작: ${date}`);
      const racePlansResponse = await this.kraApiService.getRacePlans(date);

      if (
        racePlansResponse.success &&
        racePlansResponse.data &&
        isArray(racePlansResponse.data) &&
        !isEmpty(racePlansResponse.data)
      ) {
        const racePlans = racePlansResponse.data;
        for (const plan of racePlans) {
          const existingPlan = await this.racePlanRepository.findOne({
            where: {
              rcDate: plan.rc_date,
              meet: plan.meet,
              rcNo: plan.rc_no,
            },
          });
          if (existingPlan) {
            const mappedData = mapKraRacePlanToRacePlan(plan);
            await this.racePlanRepository.update(existingPlan.planId, {
              ...mappedData,
              updatedAt: new Date(),
            });
          } else {
            const mappedData = mapKraRacePlanToRacePlan(plan);
            const newPlan = this.racePlanRepository.create({
              ...mappedData,
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
      const raceRecordsResponse = await this.kraApiService.getRaceRecords(date);

      if (
        raceRecordsResponse.success &&
        raceRecordsResponse.data &&
        isArray(raceRecordsResponse.data) &&
        !isEmpty(raceRecordsResponse.data)
      ) {
        const raceRecords = raceRecordsResponse.data;
        for (const record of raceRecords) {
          const existingResult = await this.raceHorseResultRepository.findOne({
            where: {
              rcDate: record.rc_date,
              meet: record.meet,
              rcNo: record.rc_no,
              hrNumber: record.hr_no,
            },
          });
          if (existingResult) {
            const mappedData = mapKraRaceRecordToRaceHorseResult(record);
            await this.raceHorseResultRepository.update(
              existingResult.result_id,
              {
                ...mappedData,
                updatedAt: new Date(),
              }
            );
          } else {
            const mappedData = mapKraRaceRecordToRaceHorseResult(record);
            const newResult = this.raceHorseResultRepository.create({
              ...mappedData,
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

      if (
        dividendResponse.success &&
        dividendResponse.data &&
        isArray(dividendResponse.data) &&
        !isEmpty(dividendResponse.data)
      ) {
        const dividends = dividendResponse.data;

        for (const dividend of dividends) {
          // 기존 배당율 확인
          const existingDividend = await this.dividendRateRepository.findOne({
            where: {
              rcDate: dividend.rcDate,
              meet: dividend.meet,
              rcNo: dividend.rcNo,
              pool: dividend.pool,
            },
          });

          if (existingDividend) {
            // 기존 데이터 업데이트 - 매핑된 데이터 사용
            const mappedData = mapKraDividendToDividendRate(dividend);
            await this.dividendRateRepository.update(
              existingDividend.dividend_id,
              {
                ...mappedData,
                updatedAt: new Date(),
              }
            );
          } else {
            // 새 데이터 생성 - 매핑된 데이터 사용
            const mappedData = mapKraDividendToDividendRate(dividend);
            const newDividend = this.dividendRateRepository.create({
              dividend_id: `${dividend.rcDate}_${dividend.meet}_${dividend.rcNo}_${dividend.pool}`,
              ...mappedData,
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

      // KRA API에서 출마표 조회 (경주기록에서 출전마 정보 추출)
      const raceRecordsResponse = await this.kraApiService.getRaceRecords(date);

      if (
        raceRecordsResponse.success &&
        raceRecordsResponse.data &&
        isArray(raceRecordsResponse.data) &&
        !isEmpty(raceRecordsResponse.data)
      ) {
        const raceRecords = raceRecordsResponse.data;

        for (const record of raceRecords) {
          // 기존 출마표 확인
          const existingEntry = await this.entryDetailRepository.findOne({
            where: {
              rcDate: record.rc_date,
              meet: record.meet,
              rcNo: record.rc_no,
              hrNo: record.hr_no,
            },
          });

          if (existingEntry) {
            // 기존 데이터 업데이트 - 매핑된 데이터 사용
            const mappedData = mapKraEntryToEntryDetail(record);
            await this.entryDetailRepository.update(existingEntry.entry_id, {
              ...mappedData,
              updatedAt: new Date(),
            });
          } else {
            // 새 데이터 생성 - 매핑된 데이터 사용
            const mappedData = mapKraEntryToEntryDetail(record);
            const newEntry = this.entryDetailRepository.create({
              entry_id: `${record.rc_date}_${record.meet}_${record.rc_no}_${record.hr_no}`,
              raceId: `${record.rc_date}_${record.meet}_${record.rc_no}`,
              ...mappedData,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await this.entryDetailRepository.save(newEntry);
          }
        }

        this.logger.log(`출마표 상세정보 동기화 완료: ${raceRecords.length}건`);
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
   * 동기화 상태 조회
   */
  async getSyncStatus() {
    try {
      const lastSyncTime = await this.getLastSyncTime();
      const isEnabled = this.configService.get('BATCH_ENABLED', true);
      const timezone = this.configService.get('BATCH_TIMEZONE', 'Asia/Seoul');
      const dailySyncTime = this.configService.get(
        'BATCH_DAILY_SYNC_TIME',
        '06:00'
      );

      return {
        success: true,
        data: {
          isEnabled,
          timezone,
          dailySyncTime,
          lastSyncTime,
          nextSyncTime: this.getNextSyncTime(dailySyncTime, timezone),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('동기화 상태 조회 실패:', error);
      return {
        success: false,
        error: {
          code: 'STATUS_FETCH_ERROR',
          message: '동기화 상태 조회에 실패했습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 마지막 동기화 시간 조회
   */
  private async getLastSyncTime(): Promise<Date | null> {
    try {
      // 가장 최근에 업데이트된 데이터의 시간을 기준으로 함
      const latestRacePlan = await this.racePlanRepository.findOne({
        order: { updatedAt: 'DESC' },
        select: ['updatedAt'],
      });

      const latestRaceResult = await this.raceHorseResultRepository.findOne({
        order: { updatedAt: 'DESC' },
        select: ['updatedAt'],
      });

      const latestDividend = await this.dividendRateRepository.findOne({
        order: { updatedAt: 'DESC' },
        select: ['updatedAt'],
      });

      const latestEntry = await this.entryDetailRepository.findOne({
        order: { updatedAt: 'DESC' },
        select: ['updatedAt'],
      });

      const times = [
        latestRacePlan?.updatedAt,
        latestRaceResult?.updatedAt,
        latestDividend?.updatedAt,
        latestEntry?.updatedAt,
      ].filter(Boolean);

      return times.length > 0
        ? new Date(Math.max(...times.map(t => t.getTime())))
        : null;
    } catch (error) {
      this.logger.error('마지막 동기화 시간 조회 실패:', error);
      return null;
    }
  }

  /**
   * 다음 동기화 시간 계산
   */
  private getNextSyncTime(dailySyncTime: string, timezone: string): string {
    try {
      const [hours, minutes] = dailySyncTime.split(':').map(Number);
      const now = moment().tz(timezone);
      let nextSync = moment()
        .tz(timezone)
        .set({ hours, minutes, seconds: 0, milliseconds: 0 });

      // 오늘 이미 지났으면 내일로 설정
      if (nextSync.isBefore(now)) {
        nextSync = nextSync.add(1, 'day');
      }

      return nextSync.format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
      this.logger.error('다음 동기화 시간 계산 실패:', error);
      return '계산 불가';
    }
  }
}
