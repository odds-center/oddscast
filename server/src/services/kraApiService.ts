import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

interface KraApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: any[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

interface ApiStatus {
  isAvailable: boolean;
  lastCheck: string;
  responseTime?: number;
  error?: string;
}

export class KraApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = 'http://apis.data.go.kr/B551011/KorService';
    this.apiKey = process.env['KRA_API_KEY'] || '';

    if (!this.apiKey) {
      logger.warn('KRA API key not found in environment variables');
    }
  }

  /**
   * 한국마사회 API 상태 확인
   */
  async checkApiStatus(): Promise<ApiStatus> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.baseUrl}/getRaceSchedule`, {
        params: {
          serviceKey: this.apiKey,
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

      logger.error('KRA API status check failed', { error: errorMessage });

      return {
        isAvailable: false,
        lastCheck: new Date().toISOString(),
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 경마 일정 데이터 가져오기
   */
  async getRaces(date?: string): Promise<any[]> {
    try {
      const targetDate = date || this.getCurrentDate();
      logger.info('Fetching races data from KRA API', { date: targetDate });

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.baseUrl}/getRaceSchedule`,
        {
          params: {
            serviceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_date: targetDate,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const races = response.data.response.body.items || [];

      // 데이터 정제 및 변환
      const processedRaces = races.map(race => ({
        race_id: `${race.meet}_${race.rc_date}_${race.rc_no}`,
        meet: race.meet,
        meet_name: this.getMeetName(race.meet),
        rc_date: race.rc_date,
        rc_no: race.rc_no,
        rc_name: race.rc_name,
        rc_dist: race.rc_dist,
        rc_grade: race.rc_grade,
        rc_prize: race.rc_prize,
        rc_condition: race.rc_condition,
        rc_weather: race.rc_weather,
        rc_track: race.rc_track,
        rc_track_condition: race.rc_track_condition,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      logger.info('Races data fetched successfully', {
        date: targetDate,
        count: processedRaces.length,
      });

      return processedRaces;
    } catch (error) {
      logger.error('Failed to fetch races data', {
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
      logger.info('Fetching results data from KRA API', { date: targetDate });

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.baseUrl}/getRaceResult`,
        {
          params: {
            serviceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_date: targetDate,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const results = response.data.response.body.items || [];

      // 데이터 정제 및 변환
      const processedResults = results.map(result => ({
        result_id: `${result.meet}_${result.rc_date}_${result.rc_no}_${result.ord}`,
        race_id: `${result.meet}_${result.rc_date}_${result.rc_no}`,
        meet: result.meet,
        meet_name: this.getMeetName(result.meet),
        rc_date: result.rc_date,
        rc_no: result.rc_no,
        rc_name: result.rc_name,
        ord: result.ord,
        hr_name: result.hr_name,
        hr_no: result.hr_no,
        jk_name: result.jk_name,
        jk_no: result.jk_no,
        tr_name: result.tr_name,
        tr_no: result.tr_no,
        ow_name: result.ow_name,
        ow_no: result.ow_no,
        rc_time: result.rc_time,
        rc_rank: result.rc_rank,
        rc_prize: result.rc_prize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      logger.info('Results data fetched successfully', {
        date: targetDate,
        count: processedResults.length,
      });

      return processedResults;
    } catch (error) {
      logger.error('Failed to fetch results data', {
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
      logger.info('Fetching race plans data from KRA API', {
        date: targetDate,
      });

      const response: AxiosResponse<KraApiResponse> = await axios.get(
        `${this.baseUrl}/getRacePlan`,
        {
          params: {
            serviceKey: this.apiKey,
            pageNo: 1,
            numOfRows: 1000,
            _type: 'json',
            meet: 1, // 서울
            rc_date: targetDate,
          },
          timeout: 30000,
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(
          `API Error: ${response.data.response.header.resultMsg}`
        );
      }

      const racePlans = response.data.response.body.items || [];

      // 데이터 정제 및 변환
      const processedRacePlans = racePlans.map(plan => ({
        plan_id: `${plan.meet}_${plan.rc_date}_${plan.rc_no}`,
        meet: plan.meet,
        meet_name: this.getMeetName(plan.meet),
        rc_date: plan.rc_date,
        rc_no: plan.rc_no,
        rc_name: plan.rc_name,
        rc_dist: plan.rc_dist,
        rc_grade: plan.rc_grade,
        rc_prize: plan.rc_prize,
        rc_condition: plan.rc_condition,
        rc_weather: plan.rc_weather,
        rc_track: plan.rc_track,
        rc_track_condition: plan.rc_track_condition,
        rc_start_time: plan.rc_start_time,
        rc_end_time: plan.rc_end_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      logger.info('Race plans data fetched successfully', {
        date: targetDate,
        count: processedRacePlans.length,
      });

      return processedRacePlans;
    } catch (error) {
      logger.error('Failed to fetch race plans data', {
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
      '2': '부산',
      '3': '제주',
    };
    return meetNames[meetCode] || '알 수 없음';
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
