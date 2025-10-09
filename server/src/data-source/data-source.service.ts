import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KraApiIntegratedService } from '../kra-api/kra-api-integrated.service';
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
    private readonly kraApiService: KraApiIntegratedService
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
      const dateStr = date ? date.replace(/-/g, '') : undefined;
      const kraData = await this.kraApiService.getDailyRacePlans(dateStr, meet);

      if (kraData && kraData.length > 0) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveRacePlansToLocal(kraData);

        return {
          success: true,
          data: kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: { code: 'NO_DATA', message: '데이터가 없습니다' },
        timestamp: new Date().toISOString(),
      };
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
      const dateStr = date ? date.replace(/-/g, '') : undefined;
      const kraData = await this.kraApiService.getDailyRaceRecords(
        dateStr,
        meet
      );

      if (kraData && kraData.length > 0) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveRaceResultsToLocal(kraData);

        return {
          success: true,
          data: kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: { code: 'NO_DATA', message: '데이터가 없습니다' },
        timestamp: new Date().toISOString(),
      };
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
      const dateStr = date ? date.replace(/-/g, '') : undefined;
      const kraData = await this.kraApiService.getDailyDividendRates(
        dateStr,
        meet
      );

      if (kraData && kraData.length > 0) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveDividendRatesToLocal(kraData);

        return {
          success: true,
          data: kraData,
          source: 'kra_api',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: { code: 'NO_DATA', message: '데이터가 없습니다' },
        timestamp: new Date().toISOString(),
      };
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
      const dateStr = date ? date.replace(/-/g, '') : undefined;
      const kraData = await this.kraApiService.getDailyEntrySheets(
        dateStr,
        meet
      );

      if (kraData && kraData.length > 0) {
        // 3. KRA API에서 받은 데이터를 로컬 DB에 저장
        await this.saveEntryDetailsToLocal(kraData);

        return {
          success: true,
          data: kraData,
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
          rcDate: plan.rcDate,
          meet: plan.meet,
          rcNo: String(plan.rcNo),
        },
      });

      if (existingPlan) {
        // 기존 데이터 업데이트
        await this.racePlanRepository.update(existingPlan.planId, {
          rcName: plan.rcName,
          rcDist: String(plan.rcDist),
          rcGrade: plan.rcGrade,
          rcPrize: plan.rcPrize,
          rcAgeCondition: plan.rcAge,
          rcSexCondition: plan.rcClass,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newPlan = this.racePlanRepository.create({
          planId: plan.planId,
          meet: plan.meet,
          meetName: plan.meetName,
          rcDate: plan.rcDate,
          rcNo: String(plan.rcNo),
          rcName: plan.rcName,
          rcDist: String(plan.rcDist),
          rcGrade: plan.rcGrade,
          rcPrize: plan.rcPrize,
          rcAgeCondition: plan.rcAge,
          rcSexCondition: plan.rcClass,
          rcCondition: plan.rcCondition,
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
          rcDate: result.rcDate,
          meet: result.meet,
          rcNo: String(result.rcNo),
          hrNumber: result.hrNo,
        },
      });

      if (existingResult) {
        // 기존 데이터 업데이트
        await this.raceHorseResultRepository.update(existingResult.result_id, {
          rcTime: String(result.rcTime),
          rcRank: String(result.ord),
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newResult = this.raceHorseResultRepository.create({
          result_id: result.resultId,
          meet: result.meet,
          meetName: result.meetName,
          hrName: result.hrName,
          hrNumber: result.hrNo,
          rcDate: result.rcDate,
          rcNo: String(result.rcNo),
          rcRank: String(result.ord),
          rcTime: String(result.rcTime),
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
          rcNo: String(dividend.rcNo),
          pool: dividend.winType,
        },
      });

      if (existingDividend) {
        // 기존 데이터 업데이트
        await this.dividendRateRepository.update(existingDividend.dividend_id, {
          odds: dividend.dividendRate,
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newDividend = this.dividendRateRepository.create({
          dividend_id: dividend.dividendId,
          meet: dividend.meet,
          meetName: dividend.meetName,
          rcDate: dividend.rcDate,
          rcNo: String(dividend.rcNo),
          pool: dividend.winType,
          poolName: dividend.winTypeName,
          odds: dividend.dividendRate,
          chulNo: String(dividend.firstHorseNo),
          chulNo2: String(dividend.secondHorseNo || ''),
          chulNo3: String(dividend.thirdHorseNo || ''),
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
          rcDate: entry.rcDate,
          meet: entry.meet,
          rcNo: String(entry.rcNo),
          hrNo: entry.hrNo,
        },
      });

      if (existingEntry) {
        // 기존 데이터 업데이트
        await this.entryDetailRepository.update(existingEntry.entry_id, {
          hrName: entry.hrName,
          hrWeight: String(entry.wgBudam || 0),
          hrRating: String(entry.rating || 0),
          updatedAt: new Date(),
        });
      } else {
        // 새 데이터 생성
        const newEntry = this.entryDetailRepository.create({
          entry_id: entry.entryId,
          raceId: entry.raceId,
          meet: entry.meet,
          meetName: entry.meetName,
          rcDate: entry.rcDate,
          rcNo: String(entry.rcNo),
          rcName: entry.rcName,
          hrNo: entry.hrNo,
          hrName: entry.hrName,
          jkName: entry.jkName,
          jkNo: entry.jkNo,
          trName: entry.trName,
          trNo: entry.trNo,
          owName: entry.owName,
          owNo: entry.owNo,
          entryNumber: String(entry.gateNo || 0),
          hrWeight: String(entry.wgBudam || 0),
          hrRating: String(entry.rating || 0),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.entryDetailRepository.save(newEntry);
      }
    }
  }
}
