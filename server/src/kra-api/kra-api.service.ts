import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { KraApiResponse, ApiStatus } from '../types';

@Injectable()
export class KraApiService {
  private readonly logger = new Logger(KraApiService.name);
  private readonly recordsBaseUrl: string;
  private readonly plansBaseUrl: string;
  private readonly dividendBaseUrl: string;
  private readonly entryBaseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.recordsBaseUrl = 'https://apis.data.go.kr/B551015/API4_3';
    this.plansBaseUrl = 'https://apis.data.go.kr/B551015/API72_2';
    this.dividendBaseUrl = 'https://apis.data.go.kr/B551015/API160_1';
    this.entryBaseUrl = 'https://apis.data.go.kr/B551015/API26_2';
    this.apiKey =
      this.configService.get<string>('KRA_API_KEY') ||
      'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D';

    if (!this.apiKey) {
      this.logger.warn('KRA API key not found in environment variables');
    }
  }

  /**
   * 한국마사회 API 상태 확인
   */
  async checkApiStatus(): Promise<ApiStatus> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.recordsBaseUrl}`, {
        params: {
          ServiceKey: this.apiKey,
          pageNo: 1,
          numOfRows: 1,
          _type: 'json',
        },
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        return {
          isAvailable: true,
          lastCheck: new Date().toISOString(),
          responseTime,
        };
      } else {
        return {
          isAvailable: false,
          lastCheck: new Date().toISOString(),
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('KRA API status check failed', { error: errorMessage });

      return {
        isAvailable: false,
        lastCheck: new Date().toISOString(),
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 경주기록 정보 가져오기 (API4_3)
   */
  async getRaceRecords(
    date?: string,
    meet?: string,
    rcNo?: string
  ): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      const targetMeet = meet || '1'; // 1: 서울, 2: 부산경남, 3: 제주
      const targetRcNo = rcNo || '1';

      this.logger.log('Fetching race records from KRA API', {
        date: targetDate,
        meet: targetMeet,
        rcNo: targetRcNo,
      });

      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}${month}${String(dateObj.getDate()).padStart(2, '0')}`;

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.recordsBaseUrl}/raceResult_3`,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: targetMeet,
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_date: dateStr,
            rc_no: targetRcNo,
          },
          timeout: 30000,
        }
      );

      if (!response.data.response) {
        throw new Error('Invalid API response structure');
      }

      if (
        response.data.response.header &&
        response.data.response.header.resultCode !== '00'
      ) {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const body = response.data.response.body;
      let records: any[] = [];

      if (body && body.items) {
        if (Array.isArray(body.items)) {
          records = body.items;
        } else if (typeof body.items === 'object' && 'item' in body.items) {
          const items = (body.items as any).item;
          records = Array.isArray(items) ? items : [items];
        }
      }

      // 데이터 정제 및 변환
      const processedRecords = records.map((record: any) => ({
        result_id: `${record.meet}_${record.rc_date}_${record.rc_no}_${record.ord}`,
        race_id: `${record.meet}_${record.rc_date}_${record.rc_no}`,
        meet: record.meet,
        meet_name: this.getMeetName(record.meet),
        rc_date: record.rc_date,
        rc_no: record.rc_no,
        rc_name: record.rc_name,
        ord: record.ord,
        hr_name: record.hr_name,
        hr_no: record.hr_no,
        jk_name: record.jk_name,
        jk_no: record.jk_no,
        tr_name: record.tr_name,
        tr_no: record.tr_no,
        ow_name: record.ow_name,
        ow_no: record.ow_no,
        rc_time: record.rc_time,
        rc_rank: record.rc_rank,
        rc_prize: record.rc_prize,
        // 추가 필드들
        rc_dist: record.rc_dist, // 경주거리
        rc_grade: record.rc_grade, // 부담구분
        rc_condition: record.rc_condition, // 경주조건
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      this.logger.log('Race records fetched successfully', {
        date: targetDate,
        meet: targetMeet,
        count: processedRecords.length,
      });

      return processedRecords;
    } catch (error) {
      this.logger.error('Failed to fetch race records', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        meet,
        rcNo,
      });
      throw new Error(
        `경주기록 정보 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 확정배당율 통합 정보 가져오기 (API160)
   */
  async getDividendRates(date?: string, meet?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      const targetMeet = meet || '1';

      this.logger.log('Fetching dividend rates from KRA API', {
        date: targetDate,
        meet: targetMeet,
      });

      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        this.dividendBaseUrl,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: targetMeet,
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_day: day,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const dividends = Array.isArray(response.data.response.body.items)
        ? response.data.response.body.items
        : [];

      const processedDividends = dividends.map(dividend => ({
        dividend_id: `${dividend.meet}_${dividend.rc_date}_${dividend.rc_no}_${dividend.win_type}`,
        meet: dividend.meet,
        meet_name: this.getMeetName(dividend.meet),
        rc_date: dividend.rc_date,
        rc_no: dividend.rc_no,
        win_type: dividend.win_type, // WIN, PLC, QNL, EXA, QPL, TLA, TRI
        win_type_name: this.getWinTypeName(dividend.win_type),
        first_horse_no: dividend.first_horse_no,
        second_horse_no: dividend.second_horse_no,
        third_horse_no: dividend.third_horse_no,
        dividend_rate: dividend.dividend_rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      this.logger.log('Dividend rates fetched successfully', {
        date: targetDate,
        meet: targetMeet,
        count: processedDividends.length,
      });

      return processedDividends;
    } catch (error) {
      this.logger.error('Failed to fetch dividend rates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        meet,
      });
      throw new Error(
        `확정배당율 정보 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 출전표 상세정보 가져오기 (API26_2)
   */
  async getEntryDetails(date?: string, meet?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      const targetMeet = meet || '1';

      this.logger.log('Fetching entry details from KRA API', {
        date: targetDate,
        meet: targetMeet,
      });

      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        this.entryBaseUrl,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: targetMeet,
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_day: day,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const entries = Array.isArray(response.data.response.body.items)
        ? response.data.response.body.items
        : [];

      const processedEntries = entries.map(entry => ({
        entry_id: `${entry.meet}_${entry.rc_date}_${entry.rc_no}_${entry.hr_no}`,
        meet: entry.meet,
        meet_name: this.getMeetName(entry.meet),
        rc_date: entry.rc_date,
        rc_no: entry.rc_no,
        rc_name: entry.rc_name,
        rc_day: entry.rc_day,
        rc_weekday: entry.rc_weekday,
        hr_no: entry.hr_no,
        hr_name: entry.hr_name,
        jk_name: entry.jk_name,
        jk_no: entry.jk_no,
        tr_name: entry.tr_name,
        tr_no: entry.tr_no,
        ow_name: entry.ow_name,
        ow_no: entry.ow_no,
        rc_dist: entry.rc_dist,
        rc_grade: entry.rc_grade,
        rc_prize: entry.rc_prize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      this.logger.log('Entry details fetched successfully', {
        date: targetDate,
        meet: targetMeet,
        count: processedEntries.length,
      });

      return processedEntries;
    } catch (error) {
      this.logger.error('Failed to fetch entry details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        meet,
      });
      throw new Error(
        `출전표 상세정보 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 경마 일정 데이터 가져오기
   */
  async getRaces(date?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      this.logger.log('Fetching races data from KRA API', { date: targetDate });

      // 날짜 파싱
      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.recordsBaseUrl}/raceResult_3`,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_date: dateStr,
            rc_no: 1, // 1경주부터 시작
          },
          timeout: 30000,
        }
      );

      this.logger.log('KRA API response structure:', {
        hasResponse: !!response.data.response,
        hasHeader: !!response.data.response?.header,
        hasBody: !!response.data.response?.body,
        responseKeys: Object.keys(response.data),
        responseData: JSON.stringify(response.data, null, 2),
      });

      if (!response.data.response) {
        throw new Error('Invalid API response structure');
      }

      if (
        response.data.response.header &&
        response.data.response.header.resultCode !== '00'
      ) {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      // 응답 구조 안전하게 처리
      const body = response.data.response.body;
      let races: any[] = [];

      if (body && body.items) {
        if (Array.isArray(body.items)) {
          races = body.items;
        } else if (typeof body.items === 'object' && 'item' in body.items) {
          const items = (body.items as any).item;
          races = Array.isArray(items) ? items : [items];
        } else if (body.items === '') {
          // 빈 문자열인 경우 데이터가 없음
          races = [];
        }
      }

      // 데이터 정제 및 변환 - 데이터베이스 스키마에 맞게 변환
      const processedRaces = races.map((race: any) => ({
        id: `${race.meet}_${race.rc_date}_${race.rc_no}`,
        raceNumber: parseInt(race.rc_no) || 1,
        raceName: race.rc_name || '경주',
        date: new Date(race.rc_date),
        venue: this.getMeetName(race.meet),
      }));

      this.logger.log('Races data fetched successfully', {
        date: targetDate,
        count: processedRaces.length,
      });

      return processedRaces;
    } catch (error) {
      this.logger.error('Failed to fetch races data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
      });
      throw new Error(
        `경마 일정 데이터 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 경마 결과 데이터 가져오기
   */
  async getResults(date?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      this.logger.log('Fetching results data from KRA API', {
        date: targetDate,
      });

      // 날짜 파싱
      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.recordsBaseUrl}/raceResult_3`,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_date: dateStr,
            rc_no: 1, // 1경주부터 시작
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const results = Array.isArray(response.data.response.body.items)
        ? response.data.response.body.items
        : [];

      // 데이터 정제 및 변환
      const processedResults = results.map(result => ({
        resultId: `${result.meet}_${result.rc_date}_${result.rc_no}_${result.ord}`,
        raceId: `${result.meet}_${result.rc_date}_${result.rc_no}`,
        meet: result.meet,
        meetName: this.getMeetName(result.meet),
        rcDate: result.rc_date,
        rcNo: result.rc_no,
        rcName: result.rc_name,
        ord: result.ord,
        hrName: result.hr_name,
        hrNo: result.hr_no,
        jkName: result.jk_name,
        jkNo: result.jk_no,
        trName: result.tr_name,
        trNo: result.tr_no,
        owName: result.ow_name,
        owNo: result.ow_no,
        rcTime: result.rc_time,
        rcRank: result.rc_rank,
        rcPrize: result.rc_prize,
      }));

      this.logger.log('Results data fetched successfully', {
        date: targetDate,
        count: processedResults.length,
      });

      return processedResults;
    } catch (error) {
      this.logger.error('Failed to fetch results data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
      });
      throw new Error(
        `경마 결과 데이터 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 경주계획표 데이터 가져오기
   */
  async getRacePlans(date?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      this.logger.log('Fetching race plans data from KRA API', {
        date: targetDate,
      });

      // 날짜 파싱
      const dateObj = new Date(targetDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.plansBaseUrl}`,
        {
          params: {
            ServiceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_year: year,
            rc_month: `${year}${month}`,
            rc_day: day,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const racePlans = Array.isArray(response.data.response.body.items)
        ? response.data.response.body.items
        : [];

      // 데이터 정제 및 변환
      const processedRacePlans = racePlans.map(plan => ({
        planId: `${plan.meet}_${plan.rc_date}_${plan.rc_no}`,
        meet: plan.meet,
        meetName: plan.meet,
        rcDate: plan.rc_date,
        rcNo: plan.rc_no,
        rcName: plan.rc_name,
        rcDist: plan.rc_dist,
        rcGrade: plan.rc_grade,
        rcPrize: plan.rc_prize,
        rcCondition: plan.rc_condition,
        rcWeather: plan.rc_weather,
        rcTrack: plan.rc_track,
        rcTrackCondition: plan.rc_track_condition,
        rcStartTime: plan.rc_start_time,
        rcEndTime: plan.rc_end_time,
      }));

      this.logger.log('Race plans data fetched successfully', {
        date: targetDate,
        count: processedRacePlans.length,
      });

      return processedRacePlans;
    } catch (error) {
      this.logger.error('Failed to fetch race plans data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
      });
      throw new Error(
        `경주계획표 데이터 가져오기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 마사회 코드를 이름으로 변환
   */
  private getMeetName(meetCode: string): string {
    const meetNames: { [key: string]: string } = {
      '1': '서울',
      '2': '부산경남',
      '3': '제주',
    };
    return meetNames[meetCode] || '알 수 없음';
  }

  /**
   * 승식구분 코드를 이름으로 변환
   */
  private getWinTypeName(winType: string): string {
    const winTypeNames: { [key: string]: string } = {
      WIN: '단승식',
      PLC: '연승식',
      QNL: '복승식',
      EXA: '쌍승식',
      QPL: '복연승식',
      TLA: '삼복승식',
      TRI: '삼쌍승식',
    };
    return winTypeNames[winType] || winType;
  }

  /**
   * 현재 날짜 문자열 반환 (YYYYMMDD)
   */
  private getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
