import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KraApiService } from '../external-apis/kra/kra-api.service';
import { RacePlan } from '../races/entities/race-plan.entity';
import { RaceHorseResult } from '../results/entities/race-horse-result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import * as moment from 'moment';
import BigNumber from 'bignumber.js';
import { isEmpty, isArray, get } from 'lodash';

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);

  constructor(
    @InjectRepository(RacePlan)
    private readonly racePlanRepository: Repository<RacePlan>,
    @InjectRepository(RaceHorseResult)
    private readonly raceHorseResultRepository: Repository<RaceHorseResult>,
    @InjectRepository(DividendRate)
    private readonly dividendRateRepository: Repository<DividendRate>,
    @InjectRepository(EntryDetail)
    private readonly entryDetailRepository: Repository<EntryDetail>,
    private readonly kraApiService: KraApiService
  ) {}

  /**
   * 경주계획 데이터 조회 (로컬 DB 우선, 없으면 KRA API)
   */
  async getRacePlans(
    date?: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    try {
      // 1. 로컬 DB에서 먼저 조회
      const localData = await this.getRacePlansFromLocal(
        date,
        meet,
        pageNo,
        numOfRows
      );

      if (localData && localData.length > 0) {
        this.logger.log(
          `로컬 DB에서 경주계획 데이터 조회: ${localData.length}건`
        );
        return {
          success: true,
          data: localData,
          source: 'local',
          timestamp: new Date().toISOString(),
        };
      }

      // 2. 로컬 DB에 데이터가 없으면 KRA API에서 조회
      this.logger.log('로컬 DB에 데이터가 없어 KRA API에서 조회');
      const kraData = await this.kraApiService.getRacePlans(
        date,
        meet,
        pageNo.toString(),
        numOfRows.toString()
      );

      if (kraData.success && kraData.data) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveRacePlansToLocal(kraData.data);

        return {
          ...kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return kraData;
    } catch (error) {
      this.logger.error('경주계획 데이터 조회 실패:', error);
      return {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: '데이터 조회에 실패했습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 경주 결과 데이터 조회 (로컬 DB 우선, 없으면 KRA API)
   */
  async getRaceResults(
    date?: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    try {
      // 1. 로컬 DB에서 먼저 조회
      const localData = await this.getRaceResultsFromLocal(
        date,
        meet,
        pageNo,
        numOfRows
      );

      if (localData && localData.length > 0) {
        this.logger.log(
          `로컬 DB에서 경주 결과 데이터 조회: ${localData.length}건`
        );
        return {
          success: true,
          data: localData,
          source: 'local',
          timestamp: new Date().toISOString(),
        };
      }

      // 2. 로컬 DB에 데이터가 없으면 KRA API에서 조회
      this.logger.log('로컬 DB에 데이터가 없어 KRA API에서 조회');
      const kraData = await this.kraApiService.getRaceRecords(
        date,
        meet,
        undefined,
        pageNo.toString(),
        numOfRows.toString()
      );

      if (kraData.success && kraData.data) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveRaceResultsToLocal(kraData.data);

        return {
          ...kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return kraData;
    } catch (error) {
      this.logger.error('경주 결과 데이터 조회 실패:', error);
      return {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: '데이터 조회에 실패했습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 확정배당율 데이터 조회 (로컬 DB 우선, 없으면 KRA API)
   */
  async getDividendRates(
    date?: string,
    meet?: string,
    pool?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    try {
      // 1. 로컬 DB에서 먼저 조회
      const localData = await this.getDividendRatesFromLocal(
        date,
        meet,
        pool,
        pageNo,
        numOfRows
      );

      if (localData && localData.length > 0) {
        this.logger.log(
          `로컬 DB에서 확정배당율 데이터 조회: ${localData.length}건`
        );
        return {
          success: true,
          data: localData,
          source: 'local',
          timestamp: new Date().toISOString(),
        };
      }

      // 2. 로컬 DB에 데이터가 없으면 KRA API에서 조회
      this.logger.log('로컬 DB에 데이터가 없어 KRA API에서 조회');
      const kraData = await this.kraApiService.getDividendRates(
        date,
        meet,
        pool,
        pageNo.toString(),
        numOfRows.toString()
      );

      if (kraData.success && kraData.data) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveDividendRatesToLocal(kraData.data);

        return {
          ...kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return kraData;
    } catch (error) {
      this.logger.error('확정배당율 데이터 조회 실패:', error);
      return {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: '데이터 조회에 실패했습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 출마표 상세정보 조회 (로컬 DB 우선, 없으면 KRA API)
   */
  async getEntryDetails(date?: string, meet?: string) {
    try {
      // 1. 로컬 DB에서 먼저 조회
      const localData = await this.getEntryDetailsFromLocal(date, meet);

      if (localData && localData.length > 0) {
        this.logger.log(
          `로컬 DB에서 출마표 상세정보 조회: ${localData.length}건`
        );
        return {
          success: true,
          data: localData,
          source: 'local',
          timestamp: new Date().toISOString(),
        };
      }

      // 2. 로컬 DB에 데이터가 없으면 KRA API에서 조회
      this.logger.log('로컬 DB에 데이터가 없어 KRA API에서 조회');
      const kraData = await this.kraApiService.getEntryDetails(date, meet);

      if (
        kraData.success &&
        'data' in kraData &&
        isArray(kraData.data) &&
        !isEmpty(kraData.data)
      ) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        const dataArray = kraData.data as any[];
        await this.saveEntryDetailsToLocal(dataArray);

        return {
          ...kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      // 데이터가 없거나 실패한 경우
      return {
        success: false,
        error: {
          code: 'NO_DATA_AVAILABLE',
          message: '데이터를 찾을 수 없습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('출마표 상세정보 조회 실패:', error);
      return {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: '데이터 조회에 실패했습니다.',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 로컬 DB 조회 메서드들
  private async getRacePlansFromLocal(
    date?: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    const queryBuilder = this.racePlanRepository.createQueryBuilder('racePlan');

    if (date) {
      queryBuilder.andWhere('racePlan.rcDate = :date', { date });
    }

    if (meet) {
      queryBuilder.andWhere('racePlan.meet = :meet', { meet });
    }

    return await queryBuilder
      .skip((pageNo - 1) * numOfRows)
      .take(numOfRows)
      .orderBy('racePlan.rcDate', 'DESC')
      .addOrderBy('racePlan.rcNo', 'ASC')
      .getMany();
  }

  private async getRaceResultsFromLocal(
    date?: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    const queryBuilder =
      this.raceHorseResultRepository.createQueryBuilder('result');

    if (date) {
      queryBuilder.andWhere('result.rcDate = :date', { date });
    }

    if (meet) {
      queryBuilder.andWhere('result.meet = :meet', { meet });
    }

    return await queryBuilder
      .skip((pageNo - 1) * numOfRows)
      .take(numOfRows)
      .orderBy('result.rcDate', 'DESC')
      .addOrderBy('result.rcNo', 'ASC')
      .addOrderBy('result.finishRank', 'ASC')
      .getMany();
  }

  private async getDividendRatesFromLocal(
    date?: string,
    meet?: string,
    pool?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    const queryBuilder =
      this.dividendRateRepository.createQueryBuilder('dividend');

    if (date) {
      queryBuilder.andWhere('dividend.rcDate = :date', { date });
    }

    if (meet) {
      queryBuilder.andWhere('dividend.meet = :meet', { meet });
    }

    if (pool) {
      queryBuilder.andWhere('dividend.pool = :pool', { pool });
    }

    return await queryBuilder
      .skip((pageNo - 1) * numOfRows)
      .take(numOfRows)
      .orderBy('dividend.rcDate', 'DESC')
      .addOrderBy('dividend.rcNo', 'ASC')
      .getMany();
  }

  private async getEntryDetailsFromLocal(date?: string, meet?: string) {
    const queryBuilder = this.entryDetailRepository.createQueryBuilder('entry');

    if (date) {
      queryBuilder.andWhere('entry.rcDate = :date', { date });
    }

    if (meet) {
      queryBuilder.andWhere('entry.meet = :meet', { meet });
    }

    return await queryBuilder
      .orderBy('entry.rcDate', 'DESC')
      .addOrderBy('entry.rcNo', 'ASC')
      .addOrderBy('entry.horseNo', 'ASC')
      .getMany();
  }

  // 로컬 DB 저장 메서드들
  private async saveRacePlansToLocal(racePlans: any[]) {
    for (const plan of racePlans) {
      const existingPlan = await this.racePlanRepository.findOne({
        where: {
          rcDate: plan.rc_date,
          meet: plan.meet,
          rcNo: plan.rc_no,
        },
      });

      if (existingPlan) {
        // 기존 데이터 업데이트
        await this.racePlanRepository.update(existingPlan.planId, {
          rcName: plan.rc_name,
          rcDist: plan.rc_dist,
          rcGrade: plan.rc_grade,
          rcPrize: new BigNumber(plan.rc_prize).toNumber() || 0,
          rcAgeCondition: plan.rc_age_condition,
          rcSexCondition: plan.rc_sex_condition,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newPlan = this.racePlanRepository.create({
          planId: `${plan.rc_date}_${plan.meet}_${plan.rc_no}`,
          meet: plan.meet,
          meetName: plan.meet_name,
          rcDate: plan.rc_date,
          rcNo: plan.rc_no,
          rcName: plan.rc_name,
          rcDist: plan.rc_dist,
          rcGrade: plan.rc_grade,
          rcPrize: new BigNumber(plan.rc_prize).toNumber() || 0,
          rcAgeCondition: plan.rc_age_condition,
          rcSexCondition: plan.rc_sex_condition,
          rcCondition: plan.rc_condition,
          apiVersion: 'API72_2',
          dataSource: 'KRA',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.racePlanRepository.save(newPlan);
      }
    }
  }

  private async saveRaceResultsToLocal(raceResults: any[]) {
    for (const result of raceResults) {
      const existingResult = await this.raceHorseResultRepository.findOne({
        where: {
          rcDate: result.rc_date,
          meet: result.meet,
          rcNo: result.rc_no,
          hrNumber: result.hr_no,
        },
      });

      if (existingResult) {
        // 기존 데이터 업데이트
        await this.raceHorseResultRepository.update(existingResult.result_id, {
          rcTime: result.rc_time,
          rcRank: result.ord,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newResult = this.raceHorseResultRepository.create({
          result_id: `${result.rc_date}_${result.meet}_${result.rc_no}_${result.hr_no}`,
          meet: result.meet,
          meetName: result.meet_name,
          hrName: result.hr_name,
          hrNumber: result.hr_no,
          rcDate: result.rc_date,
          rcNo: result.rc_no,
          rcRank: result.ord,
          rcTime: result.rc_time,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.raceHorseResultRepository.save(newResult);
      }
    }
  }

  private async saveDividendRatesToLocal(dividends: any[]) {
    for (const dividend of dividends) {
      const existingDividend = await this.dividendRateRepository.findOne({
        where: {
          rcDate: dividend.rcDate,
          meet: dividend.meet,
          rcNo: dividend.rcNo,
          pool: dividend.pool,
        },
      });

      if (existingDividend) {
        // 기존 데이터 업데이트
        await this.dividendRateRepository.update(existingDividend.dividend_id, {
          odds: new BigNumber(dividend.odds).toNumber() || 0,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newDividend = this.dividendRateRepository.create({
          dividend_id: `${dividend.rcDate}_${dividend.meet}_${dividend.rcNo}_${dividend.pool}`,
          meet: dividend.meet,
          meetName: 'Unknown',
          rcDate: dividend.rcDate,
          rcNo: dividend.rcNo,
          pool: dividend.pool,
          odds: new BigNumber(dividend.odds).toNumber() || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.dividendRateRepository.save(newDividend);
      }
    }
  }

  private async saveEntryDetailsToLocal(entries: any[]) {
    for (const entry of entries) {
      const existingEntry = await this.entryDetailRepository.findOne({
        where: {
          rcDate: entry.rc_date,
          meet: entry.meet,
          rcNo: entry.rc_no,
          hrNo: entry.hr_no,
        },
      });

      if (existingEntry) {
        // 기존 데이터 업데이트
        await this.entryDetailRepository.update(existingEntry.entry_id, {
          hrName: entry.hr_name,
          hrWeight: entry.hr_weight,
          hrRating: entry.hr_rating,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newEntry = this.entryDetailRepository.create({
          entry_id: `${entry.rc_date}_${entry.meet}_${entry.rc_no}_${entry.hr_no}`,
          raceId: `${entry.rc_date}_${entry.meet}_${entry.rc_no}`,
          meet: entry.meet,
          meetName: entry.meet_name || 'Unknown',
          rcDate: entry.rc_date,
          rcNo: entry.rc_no,
          rcName: entry.rc_name || 'Unknown',
          hrNo: entry.hr_no,
          hrName: entry.hr_name,
          hrWeight: entry.hr_weight,
          hrRating: entry.hr_rating,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.entryDetailRepository.save(newEntry);
      }
    }
  }
}
