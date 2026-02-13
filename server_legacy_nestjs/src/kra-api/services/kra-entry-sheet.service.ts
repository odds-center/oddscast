/**
 * KRA 출전표 서비스
 * API26_2 - 한국마사회 출전표 상세정보 API
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
  extractItems,
  isSuccessResponse,
  getErrorMessage,
  generateRaceId,
  generateEntryId,
  formatRequestLog,
  formatResponseLog,
} from '../utils/kra.utils';

/**
 * 출전표 요청 파라미터
 */
export interface EntrySheetParams {
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
 * 출전표 응답 데이터
 */
export interface EntrySheetItem {
  // 경주 정보
  meet: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDay: string; // 경주일
  rcWeekday: string; // 경주요일
  rcDist: string; // 경주거리
  rcGrade: string; // 부담구분
  rcPrize: string; // 상금
  rcCondition?: string; // 경주조건
  rcStartTime?: string; // 발주시각
  rcEndTime?: string; // 종료시각

  // 말 정보
  hrNo: string; // 마번
  hrName: string; // 마명
  age?: string; // 연령
  sex?: string; // 성별
  rating?: string; // 레이팅

  // 인물 정보
  jkName: string; // 기수명
  jkNo: string; // 기수번호
  trName: string; // 조교사명
  trNo: string; // 조교사번호
  owName: string; // 마주명
  owNo: string; // 마주번호

  // 최근 기록
  last1f?: string; // 최근1경주착순
  last2f?: string; // 최근2경주착순
  last3f?: string; // 최근3경주착순
  last4f?: string; // 최근4경주착순
  last5f?: string; // 최근5경주착순

  // 통산 기록
  rank1?: string; // 1착횟수
  rank2?: string; // 2착횟수
  rank3?: string; // 3착횟수
  totalRaceCount?: string; // 총출전횟수
  winRate?: string; // 승률

  // 기타
  wgBudam?: string; // 부담중량
  gateNo?: string; // 출발게이트번호
  prediction?: string; // 예상순위
}

/**
 * 출전표 처리된 데이터
 */
export interface ProcessedEntrySheet {
  // ID
  entryId: string;
  raceId: string;

  // 경주 정보
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;
  rcDay: string;
  rcWeekday: string;
  rcDist: number;
  rcGrade: string;
  rcGradeName: string;
  rcPrize: number;
  rcCondition: string;
  rcStartTime: string;
  rcEndTime: string;

  // 말 정보
  hrNo: string;
  hrName: string;
  age: number;
  sex: string;
  rating: number;

  // 인물 정보
  jkName: string;
  jkNo: string;
  trName: string;
  trNo: string;
  owName: string;
  owNo: string;

  // 최근 기록
  recentResults: number[]; // [last1f, last2f, last3f, last4f, last5f]

  // 통산 기록
  rank1Count: number;
  rank2Count: number;
  rank3Count: number;
  totalRaceCount: number;
  winRate: number;

  // 기타
  wgBudam: number;
  gateNo: number;
  prediction: number;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class KraEntrySheetService {
  private readonly logger = new Logger(KraEntrySheetService.name);
  private readonly endpoint = KRA_API_ENDPOINTS.ENTRY_SHEET;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KRA_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('KRA API key not configured');
    }

    this.logger.log(`${this.endpoint.name} Service initialized`);
  }

  /**
   * 출전표 정보 조회
   */
  async getEntrySheet(
    params: EntrySheetParams = {}
  ): Promise<ProcessedEntrySheet[]> {
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
      const items: EntrySheetItem[] = extractItems(response.data);

      // 데이터 처리
      const processedEntries = items.map(item => this.processEntrySheet(item));

      const duration = Date.now() - startTime;
      this.logger.log(
        formatResponseLog(this.endpoint.name, processedEntries.length, duration)
      );

      return processedEntries;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to fetch entry sheet: ${error.message}`, {
        params,
        duration,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 특정 경주의 출전표 조회
   */
  async getRaceEntries(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedEntrySheet[]> {
    return this.getEntrySheet({
      rcDate,
      meet,
      rcNo,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 특정 날짜의 모든 출전표 조회
   */
  async getDailyEntrySheets(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedEntrySheet[]> {
    return this.getEntrySheet({
      rcDate,
      meet,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 특정 말의 출전 정보 조회
   */
  async getHorseEntries(
    hrNo: string,
    rcDate?: string
  ): Promise<ProcessedEntrySheet[]> {
    const entries = await this.getEntrySheet({
      rcDate,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });

    return entries.filter(entry => entry.hrNo === hrNo);
  }

  /**
   * 출전표 데이터 처리
   */
  private processEntrySheet(item: EntrySheetItem): ProcessedEntrySheet {
    // 최근 경주 결과 배열 생성
    const recentResults = [
      parseInt(item.last1f || '0'),
      parseInt(item.last2f || '0'),
      parseInt(item.last3f || '0'),
      parseInt(item.last4f || '0'),
      parseInt(item.last5f || '0'),
    ].filter(result => result > 0);

    const processedEntry: ProcessedEntrySheet = {
      // ID 생성
      entryId: generateEntryId(item.meet, item.rcDate, item.rcNo, item.hrNo),
      raceId: generateRaceId(item.meet, item.rcDate, item.rcNo),

      // 경주 정보
      meet: item.meet,
      meetName: getMeetName(item.meet),
      rcDate: item.rcDate,
      rcNo: parseInt(item.rcNo) || 0,
      rcName: item.rcName || '',
      rcDay: item.rcDay || '',
      rcWeekday: item.rcWeekday || '',
      rcDist: parseInt(item.rcDist) || 0,
      rcGrade: item.rcGrade || '',
      rcGradeName: getRaceGradeName(item.rcGrade || ''),
      rcPrize: parseInt(item.rcPrize) || 0,
      rcCondition: item.rcCondition || '',
      rcStartTime: item.rcStartTime || '',
      rcEndTime: item.rcEndTime || '',

      // 말 정보
      hrNo: item.hrNo || '',
      hrName: item.hrName || '',
      age: parseInt(item.age || '0'),
      sex: item.sex || '',
      rating: parseInt(item.rating || '0'),

      // 인물 정보
      jkName: item.jkName || '',
      jkNo: item.jkNo || '',
      trName: item.trName || '',
      trNo: item.trNo || '',
      owName: item.owName || '',
      owNo: item.owNo || '',

      // 최근 기록
      recentResults,

      // 통산 기록
      rank1Count: parseInt(item.rank1 || '0'),
      rank2Count: parseInt(item.rank2 || '0'),
      rank3Count: parseInt(item.rank3 || '0'),
      totalRaceCount: parseInt(item.totalRaceCount || '0'),
      winRate: parseFloat(item.winRate || '0'),

      // 기타
      wgBudam: parseInt(item.wgBudam || '0'),
      gateNo: parseInt(item.gateNo || '0'),
      prediction: parseInt(item.prediction || '0'),

      // 타임스탬프
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return processedEntry;
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
      await this.getEntrySheet({
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
