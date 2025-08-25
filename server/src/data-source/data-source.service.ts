import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KraApiService } from '../external-apis/kra/kra-api.service';
import { RacePlan } from '../entities/race-plan.entity';
import { RaceHorseResult } from '../entities/race-horse-result.entity';
import { DividendRate } from '../entities/dividend-rate.entity';
import { EntryDetail } from '../entities/entry-detail.entity';
import * as moment from 'moment';

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

      if (kraData.success && kraData.data) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveEntryDetailsToLocal(kraData.data);

        return {
          ...kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return kraData;
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
  }

  private async saveRaceResultsToLocal(raceResults: any[]) {
    for (const result of raceResults) {
      const existingResult = await this.raceHorseResultRepository.findOne({
        where: {
          rcDate: result.rc_date,
          meet: result.meet,
          rcNo: result.rc_no,
          horseNo: result.horse_no,
        },
      });

      if (existingResult) {
        await this.raceHorseResultRepository.update(existingResult.id, {
          finishTime: result.finish_time,
          finishRank: result.finish_rank,
          finishLength: result.finish_length,
          jockey: result.jockey,
          trainer: result.trainer,
          updatedAt: new Date(),
        });
      } else {
        const newResult = this.raceHorseResultRepository.create({
          rcDate: result.rc_date,
          meet: result.meet,
          rcNo: result.rc_no,
          horseNo: result.horse_no,
          horseName: result.horse_name,
          finishTime: result.finish_time,
          finishRank: result.finish_rank,
          finishLength: result.finish_length,
          jockey: result.jockey,
          trainer: result.trainer,
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
          rcDate: dividend.rc_date,
          meet: dividend.meet,
          rcNo: dividend.rc_no,
          pool: dividend.pool,
        },
      });

      if (existingDividend) {
        await this.dividendRateRepository.update(existingDividend.id, {
          dividendRate: dividend.dividend_rate,
          updatedAt: new Date(),
        });
      } else {
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
  }

  private async saveEntryDetailsToLocal(entries: any[]) {
    for (const entry of entries) {
      const existingEntry = await this.entryDetailRepository.findOne({
        where: {
          rcDate: entry.rc_date,
          meet: entry.meet,
          rcNo: entry.rc_no,
          horseNo: entry.horse_no,
        },
      });

      if (existingEntry) {
        await this.entryDetailRepository.update(existingEntry.id, {
          horseName: entry.horse_name,
          jockey: entry.jockey,
          trainer: entry.trainer,
          weight: entry.weight,
          rating: entry.rating,
          updatedAt: new Date(),
        });
      } else {
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
  }
}
