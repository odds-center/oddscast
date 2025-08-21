import { Injectable, Logger } from '@nestjs/common';
import { KraDividendService } from './services/kra-dividend.service';
import { KraRaceRecordsService } from './services/kra-race-records.service';
import { KraRacePlansService } from './services/kra-race-plans.service';

@Injectable()
export class KraApiService {
  private readonly logger = new Logger(KraApiService.name);

  constructor(
    private readonly dividendService: KraDividendService,
    private readonly raceRecordsService: KraRaceRecordsService,
    private readonly racePlansService: KraRacePlansService
  ) {}

  /**
   * 경주기록 정보 조회 (API4_3)
   */
  async getRaceRecords(
    date?: string,
    meet?: string,
    rcNo?: string,
    pageNo?: string,
    numOfRows?: string
  ) {
    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    let rcDate: string | undefined;
    if (date) {
      const dateObj = new Date(date);
      rcDate =
        dateObj.getFullYear().toString() +
        String(dateObj.getMonth() + 1).padStart(2, '0') +
        String(dateObj.getDate()).padStart(2, '0');
    }

    const query = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo || '1',
      numOfRows: numOfRows || '100',
      ...(meet && { meet }),
      ...(rcDate && { rc_date: rcDate }),
      ...(rcNo && { rc_no: rcNo }),
    };

    return this.raceRecordsService.getRaceRecords(query);
  }

  /**
   * 특정 경마장의 경주기록 조회
   */
  async getRaceRecordsByMeet(
    meet: string,
    rcDate?: string,
    rcNo?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.raceRecordsService.getRaceRecordsByMeet(
      meet,
      rcDate,
      rcNo,
      pageNo,
      numOfRows
    );
  }

  /**
   * 특정 경주의 기록 조회
   */
  async getRaceRecordsByRace(rcNo: string, rcDate: string, meet: string) {
    return this.raceRecordsService.getRaceRecordsByRace(rcNo, rcDate, meet);
  }

  /**
   * 특정 날짜의 경주기록 조회
   */
  async getRaceRecordsByDate(
    rcDate: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.raceRecordsService.getRaceRecordsByDate(
      rcDate,
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 월별 경주기록 조회
   */
  async getRaceRecordsByMonth(
    rcMonth: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.raceRecordsService.getRaceRecordsByMonth(
      rcMonth,
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 최근 경주기록 조회
   */
  async getLatestRaceRecords(
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.raceRecordsService.getLatestRaceRecords(
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 경주 통계 정보 생성
   */
  async getRaceStatistics(records: any[]) {
    return this.raceRecordsService.getRaceStatistics(records);
  }

  /**
   * 경주 결과 요약 생성
   */
  async getRaceSummary(records: any[]) {
    return this.raceRecordsService.getRaceSummary(records);
  }

  /**
   * 확정배당율 정보 조회 (API160_1)
   */
  async getDividendRates(
    date?: string,
    meet?: string,
    pool?: string,
    pageNo?: string,
    numOfRows?: string
  ) {
    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    let rcDate: string | undefined;
    if (date) {
      const dateObj = new Date(date);
      rcDate =
        dateObj.getFullYear().toString() +
        String(dateObj.getMonth() + 1).padStart(2, '0') +
        String(dateObj.getDate()).padStart(2, '0');
    }

    const query = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo || '1',
      numOfRows: numOfRows || '100',
      ...(meet && { meet }),
      ...(rcDate && { rc_date: rcDate }),
      ...(pool && { pool }),
    };

    return this.dividendService.getDividendRates(query);
  }

  /**
   * 특정 경마장의 확정배당율 조회
   */
  async getDividendRatesByMeet(meet: string, rcDate?: string, pool?: string) {
    return this.dividendService.getDividendRatesByMeet(meet, rcDate, pool);
  }

  /**
   * 특정 경주의 확정배당율 조회
   */
  async getDividendRatesByRace(
    rcNo: string,
    rcDate: string,
    meet: string,
    pool?: string
  ) {
    return this.dividendService.getDividendRatesByRace(
      rcNo,
      rcDate,
      meet,
      pool
    );
  }

  /**
   * 출마표 상세정보 조회 (API26_2)
   */
  async getEntryDetails(date?: string, meet?: string) {
    // TODO: 출마표 API 구현
    this.logger.log('Entry details API not yet implemented');
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '출마표 API가 아직 구현되지 않았습니다.',
      },
      timestamp: new Date().toISOString(),
      responseTime: 0,
    };
  }

  /**
   * 경주계획표 조회 (API72_2)
   */
  async getRacePlans(
    date?: string,
    meet?: string,
    pageNo?: string,
    numOfRows?: string
  ) {
    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    let rcDate: string | undefined;
    if (date) {
      const dateObj = new Date(date);
      rcDate =
        dateObj.getFullYear().toString() +
        String(dateObj.getMonth() + 1).padStart(2, '0') +
        String(dateObj.getDate()).padStart(2, '0');
    }

    const query = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo || '1',
      numOfRows: numOfRows || '100',
      ...(meet && { meet }),
      ...(rcDate && { rc_date: rcDate }),
    };

    return this.racePlansService.getRacePlans(query);
  }

  /**
   * 특정 경마장의 경주계획 조회
   */
  async getRacePlansByMeet(
    meet: string,
    rcDate?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.getRacePlansByMeet(
      meet,
      rcDate,
      pageNo,
      numOfRows
    );
  }

  /**
   * 특정 날짜의 경주계획 조회
   */
  async getRacePlansByDate(
    rcDate: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.getRacePlansByDate(
      rcDate,
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 월별 경주계획 조회
   */
  async getRacePlansByMonth(
    rcMonth: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.getRacePlansByMonth(
      rcMonth,
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 연도별 경주계획 조회
   */
  async getRacePlansByYear(
    rcYear: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.getRacePlansByYear(
      rcYear,
      meet,
      pageNo,
      numOfRows
    );
  }

  /**
   * 최근 경주계획 조회
   */
  async getLatestRacePlans(
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.getLatestRacePlans(meet, pageNo, numOfRows);
  }

  /**
   * 경주계획 통계 정보 생성
   */
  async getRacePlanStatistics(plans: any[]) {
    return this.racePlansService.getRacePlanStatistics(plans);
  }

  /**
   * 경주계획 요약 생성
   */
  async getRacePlanSummary(plans: any[]) {
    return this.racePlansService.getRacePlanSummary(plans);
  }

  /**
   * 경주계획 검색 (고급 검색)
   */
  async searchRacePlans(
    searchCriteria: {
      meet?: string;
      rcDate?: string;
      rcNo?: string;
      rcName?: string;
      minDistance?: number;
      maxDistance?: number;
      grade?: string;
      minPrize?: number;
      maxPrize?: number;
      minRating?: number;
      maxRating?: number;
      ageCondition?: string;
      sexCondition?: string;
    },
    pageNo: number = 1,
    numOfRows: number = 100
  ) {
    return this.racePlansService.searchRacePlans(
      searchCriteria,
      pageNo,
      numOfRows
    );
  }

  /**
   * 경주계획 일정 캘린더 생성
   */
  async getRacePlanCalendar(startDate: string, endDate: string, meet?: string) {
    return this.racePlansService.getRacePlanCalendar(startDate, endDate, meet);
  }
}
