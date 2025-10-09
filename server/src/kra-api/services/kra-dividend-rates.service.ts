/**
 * KRA 확정배당율 서비스
 * API160 - 한국마사회 확정배당율 통합 정보 API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  KRA_API_ENDPOINTS,
  KRA_API_CONFIG,
  KRA_BET_TYPES,
} from '../constants/kra.constants';
import {
  getCurrentDate,
  getYear,
  getMonth,
  getYearMonth,
  getDay,
  getMeetName,
  getBetTypeName,
  extractItems,
  isSuccessResponse,
  getErrorMessage,
  generateRaceId,
  generateDividendId,
  formatRequestLog,
  formatResponseLog,
} from '../utils/kra.utils';

/**
 * 확정배당율 요청 파라미터
 */
export interface DividendRatesParams {
  /** 경주일 (YYYYMMDD) */
  rcDate?: string;
  /** 시행경마장구분 (1:서울, 2:부산경남, 3:제주) */
  meet?: string;
  /** 경주번호 */
  rcNo?: string | number;
  /** 승식구분 (WIN,PLC,QNL,EXA,QPL,TLA,TRI) */
  winType?: string;
  /** 페이지 번호 */
  pageNo?: number;
  /** 한 페이지 결과 수 */
  numOfRows?: number;
}

/**
 * 확정배당율 응답 데이터
 */
export interface DividendRateItem {
  // 경주 정보
  meet: string;
  rcDate: string;
  rcNo: string;
  rcName?: string;

  // 승식 정보
  winType: string; // WIN, PLC, QNL, EXA, QPL, TLA, TRI

  // 마번 정보
  firstHorseNo: string; // 1착마 출주번호
  secondHorseNo?: string; // 2착마 출주번호
  thirdHorseNo?: string; // 3착마 출주번호

  // 배당율
  dividendRate: string; // 확정배당율

  // 추가 정보
  plcRate1?: string; // 복승식 배당율1
  plcRate2?: string; // 복승식 배당율2
  plcRate3?: string; // 복승식 배당율3
}

/**
 * 확정배당율 처리된 데이터
 */
export interface ProcessedDividendRate {
  // ID
  dividendId: string;
  raceId: string;

  // 경주 정보
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;

  // 승식 정보
  winType: string;
  winTypeName: string;

  // 마번 정보
  firstHorseNo: number;
  secondHorseNo: number;
  thirdHorseNo: number;

  // 배당율
  dividendRate: number;

  // 복승식 배당율 (연승식의 경우)
  plcRates: number[];

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 경주별 배당율 그룹
 */
export interface RaceDividends {
  raceId: string;
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  dividends: {
    [winType: string]: ProcessedDividendRate[];
  };
}

@Injectable()
export class KraDividendRatesService {
  private readonly logger = new Logger(KraDividendRatesService.name);
  private readonly endpoint = KRA_API_ENDPOINTS.DIVIDEND_RATES;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KRA_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('KRA API key not configured');
    }

    this.logger.log(`${this.endpoint.name} Service initialized`);
  }

  /**
   * 확정배당율 정보 조회
   */
  async getDividendRates(
    params: DividendRatesParams = {}
  ): Promise<ProcessedDividendRate[]> {
    const startTime = Date.now();

    try {
      const {
        rcDate = getCurrentDate(),
        meet = '1',
        rcNo,
        winType,
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
        rc_month: getYearMonth(rcDate), // YYYYMM 형식 (예: 202509)
        rc_day: getDay(rcDate),
      };

      // 경주번호가 지정된 경우만 추가
      if (rcNo) {
        requestParams.rc_no = rcNo;
      }

      // 승식구분이 지정된 경우만 추가
      if (winType) {
        requestParams.win_type = winType;
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
      const items: DividendRateItem[] = extractItems(response.data);

      // 데이터 처리
      const processedDividends = items.map(item =>
        this.processDividendRate(item)
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        formatResponseLog(
          this.endpoint.name,
          processedDividends.length,
          duration
        )
      );

      return processedDividends;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to fetch dividend rates: ${error.message}`, {
        params,
        duration,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 특정 경주의 배당율 조회
   */
  async getRaceDividends(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedDividendRate[]> {
    return this.getDividendRates({
      rcDate,
      meet,
      rcNo,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 특정 날짜의 모든 배당율 조회
   */
  async getDailyDividendRates(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedDividendRate[]> {
    return this.getDividendRates({
      rcDate,
      meet,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 특정 승식의 배당율 조회
   */
  async getDividendsByWinType(
    rcDate: string,
    meet: string,
    winType: string
  ): Promise<ProcessedDividendRate[]> {
    return this.getDividendRates({
      rcDate,
      meet,
      winType,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 경주별로 배당율 그룹화
   */
  async getGroupedDividends(
    rcDate: string,
    meet?: string
  ): Promise<RaceDividends[]> {
    const dividends = await this.getDailyDividendRates(rcDate, meet);

    // 경주별로 그룹화
    const grouped = new Map<string, ProcessedDividendRate[]>();

    for (const dividend of dividends) {
      if (!grouped.has(dividend.raceId)) {
        grouped.set(dividend.raceId, []);
      }
      grouped.get(dividend.raceId)!.push(dividend);
    }

    // RaceDividends 형식으로 변환
    const result: RaceDividends[] = [];

    for (const [raceId, dividendList] of grouped.entries()) {
      const first = dividendList[0];

      // 승식별로 분류
      const byWinType: { [winType: string]: ProcessedDividendRate[] } = {};

      for (const dividend of dividendList) {
        if (!byWinType[dividend.winType]) {
          byWinType[dividend.winType] = [];
        }
        byWinType[dividend.winType].push(dividend);
      }

      result.push({
        raceId,
        meet: first.meet,
        meetName: first.meetName,
        rcDate: first.rcDate,
        rcNo: first.rcNo,
        dividends: byWinType,
      });
    }

    return result.sort((a, b) => a.rcNo - b.rcNo);
  }

  /**
   * 확정배당율 데이터 처리
   */
  private processDividendRate(item: DividendRateItem): ProcessedDividendRate {
    // 복승식 배당율 배열 생성
    const plcRates = [
      parseFloat(item.plcRate1 || '0'),
      parseFloat(item.plcRate2 || '0'),
      parseFloat(item.plcRate3 || '0'),
    ].filter(rate => rate > 0);

    const processedDividend: ProcessedDividendRate = {
      // ID 생성
      dividendId: generateDividendId(
        item.meet,
        item.rcDate,
        item.rcNo,
        item.winType
      ),
      raceId: generateRaceId(item.meet, item.rcDate, item.rcNo),

      // 경주 정보
      meet: item.meet,
      meetName: getMeetName(item.meet),
      rcDate: item.rcDate,
      rcNo: parseInt(item.rcNo) || 0,
      rcName: item.rcName || '',

      // 승식 정보
      winType: item.winType,
      winTypeName: getBetTypeName(item.winType),

      // 마번 정보
      firstHorseNo: parseInt(item.firstHorseNo) || 0,
      secondHorseNo: parseInt(item.secondHorseNo || '0'),
      thirdHorseNo: parseInt(item.thirdHorseNo || '0'),

      // 배당율
      dividendRate: parseFloat(item.dividendRate) || 0,

      // 복승식 배당율
      plcRates,

      // 타임스탬프
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return processedDividend;
  }

  /**
   * 배당율 타입별 통계
   */
  async getDividendStatistics(
    rcDate: string,
    meet?: string
  ): Promise<{
    totalRaces: number;
    byWinType: {
      [winType: string]: {
        count: number;
        avgDividend: number;
        maxDividend: number;
        minDividend: number;
      };
    };
  }> {
    const dividends = await this.getDailyDividendRates(rcDate, meet);

    const stats: {
      totalRaces: number;
      byWinType: {
        [winType: string]: {
          count: number;
          avgDividend: number;
          maxDividend: number;
          minDividend: number;
        };
      };
    } = {
      totalRaces: new Set(dividends.map(d => d.raceId)).size,
      byWinType: {},
    };

    // 승식별 통계
    for (const dividend of dividends) {
      if (!stats.byWinType[dividend.winType]) {
        stats.byWinType[dividend.winType] = {
          count: 0,
          avgDividend: 0,
          maxDividend: 0,
          minDividend: Infinity,
        };
      }

      const stat = stats.byWinType[dividend.winType];
      stat.count++;
      stat.avgDividend += dividend.dividendRate;
      stat.maxDividend = Math.max(stat.maxDividend, dividend.dividendRate);
      stat.minDividend = Math.min(stat.minDividend, dividend.dividendRate);
    }

    // 평균 계산
    for (const winType in stats.byWinType) {
      const stat = stats.byWinType[winType];
      stat.avgDividend = stat.avgDividend / stat.count;
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
      await this.getDividendRates({
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
