/**
 * KRA 경주계획표 서비스
 * API72_2 - 한국마사회 경주계획표 API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { KRA_API_ENDPOINTS, KRA_API_CONFIG } from '../constants/kra.constants';
import {
  getCurrentDate,
  getYear,
  getYearMonth,
  getDay,
  getMeetName,
  getRaceGradeName,
  getWeatherName,
  getTrackConditionName,
  extractItems,
  isSuccessResponse,
  getErrorMessage,
  generateRaceId,
  formatRequestLog,
  formatResponseLog,
} from '../utils/kra.utils';

/**
 * 경주계획표 요청 파라미터
 */
export interface RacePlansParams {
  /** 경주일 (YYYYMMDD) */
  rcDate?: string;
  /** 시행경마장구분 (1:서울, 2:부산경남, 3:제주) */
  meet?: string;
  /** 경주번호 */
  rcNo?: string | number;
  /** 페이지 번호 */
  pageNo?: number;
  /** 한 페이지 결과 수 */
  numOfRows?: number;
}

/**
 * 경주계획표 응답 데이터
 */
export interface RacePlanItem {
  // 경주 정보
  meet: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDay: string; // 경주일
  rcWeekday: string; // 경주요일

  // 경주 상세
  rcDist: string; // 경주거리
  rcGrade: string; // 부담구분
  rcPrize: string; // 상금
  rcCondition?: string; // 경주조건
  rcAge?: string; // 출전연령
  rcClass?: string; // 경주등급

  // 시간 정보
  rcStartTime: string; // 발주시각
  rcEndTime?: string; // 종료시각
  rcTime?: string; // 경주시간

  // 환경 정보
  weather?: string; // 날씨
  track?: string; // 주로
  trackCondition?: string; // 주로상태

  // 출전 정보
  hrCount?: string; // 출전두수
  hrEntry?: string; // 출전마정보

  // 기타
  notice?: string; // 특기사항
  remark?: string; // 비고
}

/**
 * 경주계획표 처리된 데이터
 */
export interface ProcessedRacePlan {
  // ID
  planId: string;
  raceId: string;

  // 경주 정보
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;
  rcDay: string;
  rcWeekday: string;

  // 경주 상세
  rcDist: number;
  rcGrade: string;
  rcGradeName: string;
  rcPrize: number;
  rcCondition: string;
  rcAge: string;
  rcClass: string;

  // 시간 정보
  rcStartTime: string;
  rcEndTime: string;
  rcTime: number;

  // 환경 정보
  weather: string;
  weatherName: string;
  track: string;
  trackCondition: string;
  trackConditionName: string;

  // 출전 정보
  hrCount: number;
  hrEntry: string;

  // 기타
  notice: string;
  remark: string;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 경주 일정 정보
 */
export interface RaceSchedule {
  rcDate: string;
  meets: {
    meet: string;
    meetName: string;
    raceCount: number;
    races: ProcessedRacePlan[];
  }[];
}

@Injectable()
export class KraRacePlansService {
  private readonly logger = new Logger(KraRacePlansService.name);
  private readonly endpoint = KRA_API_ENDPOINTS.RACE_PLANS;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KRA_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('KRA API key not configured');
    }

    this.logger.log(`${this.endpoint.name} Service initialized`);
  }

  /**
   * 경주계획표 정보 조회
   */
  async getRacePlans(
    params: RacePlansParams = {}
  ): Promise<ProcessedRacePlan[]> {
    const startTime = Date.now();

    try {
      const {
        rcDate = getCurrentDate(),
        meet = '1',
        rcNo,
        pageNo = 1,
        numOfRows = KRA_API_CONFIG.DEFAULT_PAGE_SIZE,
      } = params;

      // 요청 파라미터 구성
      const requestParams: Record<string, any> = {
        ServiceKey: this.apiKey,
        pageNo,
        numOfRows,
        _type: KRA_API_CONFIG.RESPONSE_TYPE,
        meet,
        rc_year: getYear(rcDate),
        rc_month: getYearMonth(rcDate),
        rc_day: getDay(rcDate),
      };

      // 경주번호가 지정된 경우만 추가
      if (rcNo) {
        requestParams.rc_no = rcNo;
      }

      this.logger.log(formatRequestLog(this.endpoint.name, requestParams));

      // API 호출
      const response: AxiosResponse = await axios.get(this.endpoint.fullUrl, {
        params: requestParams,
        timeout: KRA_API_CONFIG.DEFAULT_TIMEOUT,
      });

      // 응답 검증
      if (!response.data?.response) {
        throw new Error('Invalid API response structure');
      }

      const { header, body } = response.data.response;

      // 에러 체크
      if (!isSuccessResponse(header.resultCode)) {
        throw new Error(`API Error: ${getErrorMessage(header.resultCode)}`);
      }

      // 데이터 추출
      const items: RacePlanItem[] = extractItems(response.data);

      // 데이터 처리
      const processedPlans = items.map(item => this.processRacePlan(item));

      const duration = Date.now() - startTime;
      this.logger.log(
        formatResponseLog(this.endpoint.name, processedPlans.length, duration)
      );

      return processedPlans;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to fetch race plans: ${error.message}`, {
        params,
        duration,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 특정 경주의 계획 조회
   */
  async getRacePlan(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedRacePlan | null> {
    const plans = await this.getRacePlans({
      rcDate,
      meet,
      rcNo,
    });

    return plans.length > 0 ? plans[0] : null;
  }

  /**
   * 특정 날짜의 모든 경주계획 조회
   */
  async getDailyRacePlans(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedRacePlan[]> {
    return this.getRacePlans({
      rcDate,
      meet,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 경주 일정 정보 조회 (경마장별 그룹화)
   */
  async getRaceSchedule(rcDate: string): Promise<RaceSchedule> {
    // 모든 경마장의 경주계획 조회
    const allMeets = ['1', '2', '3'];
    const allPlans: ProcessedRacePlan[] = [];

    for (const meet of allMeets) {
      try {
        const plans = await this.getDailyRacePlans(rcDate, meet);
        allPlans.push(...plans);
      } catch (error) {
        this.logger.warn(`No plans found for meet ${meet} on ${rcDate}`);
      }
    }

    // 경마장별로 그룹화
    const meetPlans = new Map<string, ProcessedRacePlan[]>();

    for (const plan of allPlans) {
      if (!meetPlans.has(plan.meet)) {
        meetPlans.set(plan.meet, []);
      }
      meetPlans.get(plan.meet)!.push(plan);
    }

    // RaceSchedule 형식으로 변환
    const meets = Array.from(meetPlans.entries()).map(([meet, races]) => ({
      meet,
      meetName: getMeetName(meet),
      raceCount: races.length,
      races: races.sort((a, b) => a.rcNo - b.rcNo),
    }));

    return {
      rcDate,
      meets,
    };
  }

  /**
   * 향후 N일간의 경주 일정 조회
   */
  async getUpcomingRacePlans(days: number = 7): Promise<RaceSchedule[]> {
    const schedules: RaceSchedule[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

      try {
        const schedule = await this.getRaceSchedule(dateStr);
        if (schedule.meets.length > 0) {
          schedules.push(schedule);
        }
      } catch (error) {
        this.logger.warn(`No schedule found for ${dateStr}`);
      }
    }

    return schedules;
  }

  /**
   * 경주계획표 데이터 처리
   */
  private processRacePlan(item: RacePlanItem): ProcessedRacePlan {
    const processedPlan: ProcessedRacePlan = {
      // ID 생성
      planId: `plan_${generateRaceId(item.meet, item.rcDate, item.rcNo)}`,
      raceId: generateRaceId(item.meet, item.rcDate, item.rcNo),

      // 경주 정보
      meet: item.meet,
      meetName: getMeetName(item.meet),
      rcDate: item.rcDate,
      rcNo: parseInt(item.rcNo) || 0,
      rcName: item.rcName || '',
      rcDay: item.rcDay || '',
      rcWeekday: item.rcWeekday || '',

      // 경주 상세
      rcDist: parseInt(item.rcDist) || 0,
      rcGrade: item.rcGrade || '',
      rcGradeName: getRaceGradeName(item.rcGrade || ''),
      rcPrize: parseInt(item.rcPrize) || 0,
      rcCondition: item.rcCondition || '',
      rcAge: item.rcAge || '',
      rcClass: item.rcClass || '',

      // 시간 정보
      rcStartTime: item.rcStartTime || '',
      rcEndTime: item.rcEndTime || '',
      rcTime: parseFloat(item.rcTime || '0'),

      // 환경 정보
      weather: item.weather || '',
      weatherName: getWeatherName(item.weather || ''),
      track: item.track || '',
      trackCondition: item.trackCondition || '',
      trackConditionName: getTrackConditionName(item.trackCondition || ''),

      // 출전 정보
      hrCount: parseInt(item.hrCount || '0'),
      hrEntry: item.hrEntry || '',

      // 기타
      notice: item.notice || '',
      remark: item.remark || '',

      // 타임스탬프
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return processedPlan;
  }

  /**
   * 경주 통계 조회
   */
  async getRaceStatistics(rcDate: string): Promise<{
    totalRaces: number;
    byMeet: {
      [meet: string]: {
        meetName: string;
        raceCount: number;
        totalPrize: number;
        avgDistance: number;
      };
    };
    byGrade: {
      [grade: string]: {
        count: number;
        totalPrize: number;
      };
    };
  }> {
    const schedule = await this.getRaceSchedule(rcDate);

    const stats = {
      totalRaces: 0,
      byMeet: {} as any,
      byGrade: {} as any,
    };

    for (const meet of schedule.meets) {
      stats.totalRaces += meet.raceCount;

      const totalPrize = meet.races.reduce(
        (sum, race) => sum + race.rcPrize,
        0
      );
      const avgDistance =
        meet.races.reduce((sum, race) => sum + race.rcDist, 0) / meet.raceCount;

      stats.byMeet[meet.meet] = {
        meetName: meet.meetName,
        raceCount: meet.raceCount,
        totalPrize,
        avgDistance,
      };

      // 등급별 통계
      for (const race of meet.races) {
        if (!stats.byGrade[race.rcGrade]) {
          stats.byGrade[race.rcGrade] = {
            count: 0,
            totalPrize: 0,
          };
        }
        stats.byGrade[race.rcGrade].count++;
        stats.byGrade[race.rcGrade].totalPrize += race.rcPrize;
      }
    }

    return stats;
  }

  /**
   * API 상태 확인
   */
  async checkApiStatus(): Promise<{
    isAvailable: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.getRacePlans({
        numOfRows: 1,
      });

      return {
        isAvailable: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        isAvailable: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
