import { Injectable } from '@nestjs/common';
import { ApiClientBase, ApiResponse } from '../../common/api-client.base';
import { getKraApiConfig } from '../config/kra-api.config';
import {
  KRA_RESPONSE_CODES,
  KraRaceRecord,
  KraRaceRecordsQueryDto,
  KraRaceRecordsResponseDto,
  normalizeRaceRecords,
  filterRaceRecords,
  sortRaceRecords,
  validateRaceRecord,
} from '../dto/kra-race-records.dto';
import { KraErrorHandler } from '../error-handlers/kra-error.handler';

@Injectable()
export class KraRaceRecordsService extends ApiClientBase {
  private readonly errorHandler: KraErrorHandler;

  constructor() {
    const apiKey = process.env.KRA_API_KEY || '';
    const config = getKraApiConfig(apiKey);
    const raceRecordsEndpoint = config.baseUrls.RACE_RECORDS;

    super(
      {
        baseURL:
          raceRecordsEndpoint?.url || 'https://apis.data.go.kr/B551015/API4_3',
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      },
      'KraRaceRecordsService'
    );

    this.errorHandler = new KraErrorHandler();
  }

  /**
   * 경주기록 정보 조회 (API4_3)
   * Swagger 문서 기반 정확한 응답 구조 처리
   */
  async getRaceRecords(
    query: KraRaceRecordsQueryDto
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    try {
      this.logger.log(
        `Fetching race records with query: ${JSON.stringify(query)}`
      );

      // 기본값 설정
      const requestParams = {
        ...query,
        _type: query._type || 'json',
        pageNo: query.pageNo || '1',
        numOfRows: query.numOfRows || '100',
      };

      const response = await this.makeRequest<KraRaceRecordsResponseDto>({
        method: 'GET',
        params: requestParams,
      });

      if (response.success && response.data) {
        // Swagger 문서 기반 정확한 응답 구조 처리
        const { header, body } = response.data;

        // 응답 상태 코드 확인
        if (header.resultCode !== KRA_RESPONSE_CODES.SUCCESS) {
          this.logger.warn(
            `KRA API returned error: ${header.resultCode} - ${header.resultMsg}`
          );

          return {
            success: false,
            error: {
              code: `KRA_${header.resultCode}`,
              message: header.resultMsg,
              details: {
                resultCode: header.resultCode,
                resultMsg: header.resultMsg,
              },
            },
            timestamp: new Date().toISOString(),
            responseTime: response.responseTime,
          };
        }

        // 응답 데이터 정규화
        const items = body?.items?.item;
        const normalizedItems = normalizeRaceRecords(items);

        // 데이터 검증
        const validItems = normalizedItems.filter(validateRaceRecord);

        this.logger.log(
          `Successfully fetched ${validItems.length} race records (total: ${body.totalCount})`
        );

        return {
          success: true,
          data: validItems,
          timestamp: response.timestamp,
          responseTime: response.responseTime,
          metadata: {
            pageNo: parseInt(body.pageNo),
            numOfRows: parseInt(body.numOfRows),
            totalCount: parseInt(body.totalCount),
            totalPages: Math.ceil(
              parseInt(body.totalCount) / parseInt(body.numOfRows)
            ),
            validRecords: validItems.length,
            invalidRecords: normalizedItems.length - validItems.length,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response format from KRA API',
          details: response,
        },
        timestamp: new Date().toISOString(),
        responseTime: 0,
      };
    } catch (error) {
      const errorResult = this.errorHandler.handleKraApiError(
        error,
        'RACE_RECORDS',
        query
      );

      this.logger.error('Failed to fetch race records', {
        error: errorResult.error,
        shouldRetry: errorResult.shouldRetry,
        retryDelay: errorResult.retryDelay,
      });

      return {
        success: false,
        error: {
          code: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error,
        },
        timestamp: new Date().toISOString(),
        responseTime: 0,
      };
    }
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
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const query: KraRaceRecordsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      meet,
      ...(rcDate && { rc_date: rcDate }),
      ...(rcNo && { rc_no: rcNo }),
    };

    return this.getRaceRecords(query);
  }

  /**
   * 특정 경주의 기록 조회
   */
  async getRaceRecordsByRace(
    rcNo: string,
    rcDate: string,
    meet: string
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const query: KraRaceRecordsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: '1',
      numOfRows: '1000', // 경주당 최대 출전마 수
      rc_no: rcNo,
      rc_date: rcDate,
      meet,
    };

    return this.getRaceRecords(query);
  }

  /**
   * 특정 날짜의 경주기록 조회
   */
  async getRaceRecordsByDate(
    rcDate: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const query: KraRaceRecordsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_date: rcDate,
      ...(meet && { meet }),
    };

    return this.getRaceRecords(query);
  }

  /**
   * 월별 경주기록 조회
   */
  async getRaceRecordsByMonth(
    rcMonth: string, // YYYYMM 형식
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const query: KraRaceRecordsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_month: rcMonth,
      ...(meet && { meet }),
    };

    return this.getRaceRecords(query);
  }

  /**
   * 최근 경주기록 조회 (기본값: 최근 1개월)
   */
  async getLatestRaceRecords(
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const query: KraRaceRecordsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(meet && { meet }),
      // rc_date, rc_month를 제외하면 최근 경주일 정보 조회
    };

    return this.getRaceRecords(query);
  }

  /**
   * 필터링된 경주기록 조회
   */
  async getFilteredRaceRecords(
    baseQuery: KraRaceRecordsQueryDto,
    filterOptions?: {
      meet?: string;
      rcDate?: string;
      rcNo?: string;
      minDistance?: number;
      maxDistance?: number;
      grade?: string;
      minPrize?: number;
      maxPrize?: number;
    },
    sortOptions?: {
      sortBy: 'date' | 'distance' | 'prize' | 'time' | 'rank';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<KraRaceRecord[]>> {
    const response = await this.getRaceRecords(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 필터링 적용
    let filteredRecords = filterRaceRecords(response.data, filterOptions);

    // 정렬 적용
    if (sortOptions) {
      filteredRecords = sortRaceRecords(
        filteredRecords,
        sortOptions.sortBy,
        sortOptions.sortOrder
      );
    }

    return {
      ...response,
      data: filteredRecords,
      metadata: {
        ...response.metadata,
        filteredCount: filteredRecords.length,
        originalCount: response.data.length,
      },
    };
  }

  /**
   * 경주 통계 정보 생성
   */
  async getRaceStatistics(records: KraRaceRecord[]): Promise<{
    totalRaces: number;
    totalParticipants: number;
    averageDistance: number;
    totalPrize: number;
    meetDistribution: Record<string, number>;
    gradeDistribution: Record<string, number>;
    distanceDistribution: Record<string, number>;
    weatherDistribution: Record<string, number>;
    trackDistribution: Record<string, number>;
  }> {
    const validRecords = records.filter(validateRaceRecord);

    if (validRecords.length === 0) {
      return {
        totalRaces: 0,
        totalParticipants: 0,
        averageDistance: 0,
        totalPrize: 0,
        meetDistribution: {},
        gradeDistribution: {},
        distanceDistribution: {},
        weatherDistribution: {},
        trackDistribution: {},
      };
    }

    // 고유 경주 수 계산 (meet + rc_date + rc_no 조합)
    const uniqueRaces = new Set(
      validRecords.map(
        record => `${record.meet}_${record.rc_date}_${record.rc_no}`
      )
    );

    const totalRaces = uniqueRaces.size;
    const totalParticipants = validRecords.length;

    const totalDistance = validRecords.reduce(
      (sum, record) => sum + parseInt(record.rc_dist || '0'),
      0
    );
    const averageDistance = totalDistance / totalParticipants;

    const totalPrize = validRecords.reduce(
      (sum, record) => sum + parseInt(record.rc_prize || '0'),
      0
    );

    // 분포 계산
    const meetDistribution = validRecords.reduce(
      (acc, record) => {
        acc[record.meet] = (acc[record.meet] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const gradeDistribution = validRecords.reduce(
      (acc, record) => {
        acc[record.rc_grade] = (acc[record.rc_grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const distanceDistribution = validRecords.reduce(
      (acc, record) => {
        const distance = parseInt(record.rc_dist || '0');
        let category = 'Unknown';
        if (distance <= 1400) category = 'Sprint (≤1400m)';
        else if (distance <= 2000) category = 'Middle (1401-2000m)';
        else if (distance <= 2600) category = 'Long (2001-2600m)';
        else category = 'Extra Long (>2600m)';

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const weatherDistribution = validRecords.reduce(
      (acc, record) => {
        acc[record.rc_weather] = (acc[record.rc_weather] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const trackDistribution = validRecords.reduce(
      (acc, record) => {
        acc[record.rc_track] = (acc[record.rc_track] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRaces,
      totalParticipants,
      averageDistance: Math.round(averageDistance),
      totalPrize,
      meetDistribution,
      gradeDistribution,
      distanceDistribution,
      weatherDistribution,
      trackDistribution,
    };
  }

  /**
   * 경주 결과 요약 생성
   */
  async getRaceSummary(records: KraRaceRecord[]): Promise<{
    rcDate: string;
    meet: string;
    rcNo: string;
    rcName: string;
    rcDist: number;
    rcGrade: string;
    totalPrize: number;
    participants: number;
    weather: string;
    track: string;
    results: Array<{
      rank: number;
      horseNo: string;
      horseName: string;
      jockeyName: string;
      trainerName?: string;
      ownerName?: string;
      finishTime: string;
      prize: number;
      gap?: string;
    }>;
  } | null> {
    const validRecords = records.filter(validateRaceRecord);

    if (validRecords.length === 0) {
      return null;
    }

    // 첫 번째 레코드에서 경주 기본 정보 추출
    const firstRecord = validRecords[0];

    // 순위별로 정렬
    const sortedRecords = validRecords.sort(
      (a, b) => parseInt(a.ord) - parseInt(b.ord)
    );

    const results = sortedRecords.map(record => ({
      rank: parseInt(record.ord),
      horseNo: record.hr_no,
      horseName: record.hr_name,
      jockeyName: record.jk_name,
      trainerName: record.tr_name,
      ownerName: record.ow_name,
      finishTime: record.rc_time,
      prize: parseInt(record.rc_prize || '0'),
      gap: record.rc_gap,
    }));

    return {
      rcDate: firstRecord.rc_date,
      meet: firstRecord.meet,
      rcNo: firstRecord.rc_no,
      rcName: firstRecord.rc_name,
      rcDist: parseInt(firstRecord.rc_dist),
      rcGrade: firstRecord.rc_grade,
      totalPrize: results.reduce((sum, result) => sum + result.prize, 0),
      participants: validRecords.length,
      weather: firstRecord.rc_weather,
      track: firstRecord.rc_track,
      results,
    };
  }
}
