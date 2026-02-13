/**
 * KRA 경주기록 서비스
 * API4_3 - 한국마사회 경주기록 정보 API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  KRA_API_ENDPOINTS,
  KRA_API_CONFIG,
  KRA_API_RESPONSE_CODES,
} from '../constants/kra.constants';
import {
  getCurrentDate,
  formatDate,
  getYear,
  getYearMonth,
  getMeetName,
  extractItems,
  isSuccessResponse,
  getErrorMessage,
  generateRaceId,
  generateResultId,
  formatRequestLog,
  formatResponseLog,
  parseHorseWeight,
} from '../utils/kra.utils';

/**
 * 경주기록 요청 파라미터
 */
export interface RaceRecordsParams {
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
 * 경주기록 응답 데이터
 */
export interface RaceRecordItem {
  // 기본 정보
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDist: string; // 경주거리
  rcGrade: string; // 부담구분

  // 순위 정보
  ord: string; // 순위

  // 말 정보
  hrNo: string; // 마번
  hrName: string; // 마명
  age: string; // 연령
  sex: string; // 성별
  wgHr: string; // 마체중 (예: "502(-2)")
  wgBudam: string; // 부담중량

  // 인물 정보
  jkName: string; // 기수명
  jkNo?: string; // 기수번호
  trName: string; // 조교사명
  trNo?: string; // 조교사번호
  owName: string; // 마주명
  owNo?: string; // 마주번호

  // 경주 기록
  rcTime: string; // 경주기록 (초)
  rcRank?: string; // 경주기록 순위

  // 배당률
  winOdds: string; // 단승식 배당율
  plcOdds: string; // 복승식 배당율

  // 환경 정보
  weather?: string; // 날씨
  track?: string; // 주로

  // 상금
  chaksun1?: string; // 1착상금
  chaksun2?: string; // 2착상금
  chaksun3?: string; // 3착상금

  // 기타
  rcPrize?: string; // 상금
  rcCondition?: string; // 경주조건
}

/**
 * 경주기록 처리된 데이터
 */
export interface ProcessedRaceRecord {
  // ID
  resultId: string;
  raceId: string;

  // 기본 정보
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;
  rcDist: number;
  rcGrade: string;

  // 순위 정보
  ord: number;

  // 말 정보
  hrNo: string;
  hrName: string;
  age: number;
  sex: string;
  horseWeight: number;
  horseWeightChange: number;
  wgBudam: number;

  // 인물 정보
  jkName: string;
  jkNo: string;
  trName: string;
  trNo: string;
  owName: string;
  owNo: string;

  // 경주 기록
  rcTime: number;
  rcRank: number;

  // 배당률
  winOdds: number;
  plcOdds: number;

  // 환경 정보
  weather: string;
  track: string;

  // 상금
  prize: number;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class KraRaceRecordsService {
  private readonly logger = new Logger(KraRaceRecordsService.name);
  private readonly endpoint = KRA_API_ENDPOINTS.RACE_RECORDS;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KRA_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('KRA API key not configured');
    }

    this.logger.log(`${this.endpoint.name} Service initialized`);
  }

  /**
   * 경주기록 정보 조회
   */
  async getRaceRecords(
    params: RaceRecordsParams = {}
  ): Promise<ProcessedRaceRecord[]> {
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
        rc_date: rcDate,
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
      const items: RaceRecordItem[] = extractItems(response.data);

      // 데이터 처리
      const processedRecords = items.map(item => this.processRaceRecord(item));

      const duration = Date.now() - startTime;
      this.logger.log(
        formatResponseLog(this.endpoint.name, processedRecords.length, duration)
      );

      return processedRecords;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to fetch race records: ${error.message}`, {
        params,
        duration,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 특정 경주의 결과 조회
   */
  async getRaceResults(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedRaceRecord[]> {
    return this.getRaceRecords({
      rcDate,
      meet,
      rcNo,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 특정 날짜의 모든 경주 결과 조회
   */
  async getDailyRaceRecords(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedRaceRecord[]> {
    return this.getRaceRecords({
      rcDate,
      meet,
      numOfRows: KRA_API_CONFIG.MAX_PAGE_SIZE,
    });
  }

  /**
   * 경주기록 데이터 처리
   */
  private processRaceRecord(item: RaceRecordItem): ProcessedRaceRecord {
    const { weight, change } = parseHorseWeight(item.wgHr || '0');

    const processedRecord: ProcessedRaceRecord = {
      // ID 생성
      resultId: generateResultId(item.meet, item.rcDate, item.rcNo, item.ord),
      raceId: generateRaceId(item.meet, item.rcDate, item.rcNo),

      // 기본 정보
      meet: item.meet,
      meetName: getMeetName(item.meet),
      rcDate: item.rcDate,
      rcNo: parseInt(item.rcNo) || 0,
      rcName: item.rcName || '',
      rcDist: parseInt(item.rcDist) || 0,
      rcGrade: item.rcGrade || '',

      // 순위 정보
      ord: parseInt(item.ord) || 0,

      // 말 정보
      hrNo: item.hrNo || '',
      hrName: item.hrName || '',
      age: parseInt(item.age) || 0,
      sex: item.sex || '',
      horseWeight: weight,
      horseWeightChange: change,
      wgBudam: parseInt(item.wgBudam) || 0,

      // 인물 정보
      jkName: item.jkName || '',
      jkNo: item.jkNo || '',
      trName: item.trName || '',
      trNo: item.trNo || '',
      owName: item.owName || '',
      owNo: item.owNo || '',

      // 경주 기록
      rcTime: parseFloat(item.rcTime) || 0,
      rcRank: parseInt(item.rcRank || item.ord) || 0,

      // 배당률
      winOdds: parseFloat(item.winOdds) || 0,
      plcOdds: parseFloat(item.plcOdds) || 0,

      // 환경 정보
      weather: item.weather || '',
      track: item.track || '',

      // 상금
      prize: parseInt(item.chaksun1 || item.rcPrize || '0'),

      // 타임스탬프
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return processedRecord;
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
      await this.getRaceRecords({
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
