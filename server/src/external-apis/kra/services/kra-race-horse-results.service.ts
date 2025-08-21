import { Injectable } from '@nestjs/common';
import { ApiClientBase, ApiResponse } from '../../common/api-client.base';
import { getKraApiConfig } from '../config/kra-api.config';
import {
  KRA_RESPONSE_CODES,
  KraRaceHorseResult,
  KraRaceHorseResultsQueryDto,
  KraRaceHorseResultsResponseDto,
  normalizeRaceHorseResults,
  filterRaceHorseResults,
  sortRaceHorseResults,
  validateRaceHorseResult,
  generateRaceHorseStatistics,
} from '../dto/kra-race-horse-results.dto';
import { KraErrorHandler } from '../error-handlers/kra-error.handler';

@Injectable()
export class KraRaceHorseResultsService extends ApiClientBase {
  private readonly errorHandler: KraErrorHandler;

  constructor() {
    const apiKey = process.env.KRA_API_KEY || '';
    const config = getKraApiConfig(apiKey);
    const raceHorseResultsEndpoint = config.baseUrls.RACE_HORSE_RESULTS;

    super(
      {
        baseURL: raceHorseResultsEndpoint.url,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      },
      'KraRaceHorseResultsService'
    );

    this.errorHandler = new KraErrorHandler();
  }

  /**
   * 경주마 성적 정보 조회 (API15_2)
   * Swagger 문서 기반 정확한 응답 구조 처리
   */
  async getRaceHorseResults(
    query: KraRaceHorseResultsQueryDto
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    try {
      this.logger.log(
        `Fetching race horse results with query: ${JSON.stringify(query)}`
      );

      // 기본값 설정
      const requestParams = {
        ...query,
        _type: query._type || 'json',
        pageNo: query.pageNo || '1',
        numOfRows: query.numOfRows || '100',
      };

      const response = await this.makeRequest<KraRaceHorseResultsResponseDto>({
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
        const normalizedItems = normalizeRaceHorseResults(items);

        // 데이터 검증
        const validItems = normalizedItems.filter(validateRaceHorseResult);

        this.logger.log(
          `Successfully fetched ${validItems.length} race horse results (total: ${body.totalCount})`
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
            validResults: validItems.length,
            invalidResults: normalizedItems.length - validItems.length,
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
        'RACE_HORSE_RESULTS',
        query
      );

      this.logger.error('Failed to fetch race horse results', {
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
   * 특정 경마장의 경주마 성적 조회
   */
  async getRaceHorseResultsByMeet(
    meet: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const query: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      meet,
    };

    return this.getRaceHorseResults(query);
  }

  /**
   * 특정 경주마의 성적 조회
   */
  async getRaceHorseResultsByName(
    hrName: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const query: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      hr_name: hrName,
      ...(meet && { meet }),
    };

    return this.getRaceHorseResults(query);
  }

  /**
   * 특정 마번의 경주마 성적 조회
   */
  async getRaceHorseResultsByNumber(
    hrNumber: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const query: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      hr_number: hrNumber,
      ...(meet && { meet }),
    };

    return this.getRaceHorseResults(query);
  }

  /**
   * 필터링된 경주마 성적 조회
   */
  async getFilteredRaceHorseResults(
    baseQuery: KraRaceHorseResultsQueryDto,
    filterOptions?: {
      meet?: string;
      hrName?: string;
      hrNumber?: string;
      minAge?: number;
      maxAge?: number;
      sex?: string;
      minRating?: number;
      maxRating?: number;
      minWinRate?: number;
      maxWinRate?: number;
      minStarts?: number;
      maxStarts?: number;
    },
    sortOptions?: {
      sortBy:
        | 'name'
        | 'age'
        | 'rating'
        | 'winRate'
        | 'starts'
        | 'prize'
        | 'recentDate';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const response = await this.getRaceHorseResults(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 필터링 적용
    let filteredResults = filterRaceHorseResults(response.data, filterOptions);

    // 정렬 적용
    if (sortOptions) {
      filteredResults = sortRaceHorseResults(
        filteredResults,
        sortOptions.sortBy,
        sortOptions.sortOrder
      );
    }

    return {
      ...response,
      data: filteredResults,
      metadata: {
        ...response.metadata,
        filteredCount: filteredResults.length,
        originalCount: response.data.length,
      },
    };
  }

  /**
   * 경주마 성적 통계 정보 생성
   */
  async getRaceHorseStatistics(results: KraRaceHorseResult[]): Promise<{
    totalHorses: number;
    averageAge: number;
    averageRating: number;
    averageWinRate: number;
    averageStarts: number;
    totalPrize: number;
    meetDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    sexDistribution: Record<string, number>;
    ratingDistribution: Record<string, number>;
    winRateDistribution: Record<string, number>;
  }> {
    return generateRaceHorseStatistics(results);
  }

  /**
   * 경주마 성적 요약 정보 생성
   */
  async getRaceHorseSummary(results: KraRaceHorseResult[]): Promise<{
    hrName: string;
    hrNumber: string;
    meet: string;
    totalStarts: number;
    totalWins: number;
    totalPlaces: number;
    totalWinRate: number;
    totalPlaceRate: number;
    totalPrize: number;
    recentForm: string;
    recentRating: number;
    yearPerformance: {
      starts: number;
      wins: number;
      places: number;
      winRate: number;
      placeRate: number;
      prize: number;
    };
  } | null> {
    const validResults = results.filter(validateRaceHorseResult);

    if (validResults.length === 0) {
      return null;
    }

    // 첫 번째 레코드에서 기본 정보 추출
    const firstResult = validResults[0];

    // 통계 정보 생성
    const statistics = generateRaceHorseStatistics(validResults);

    return {
      hrName: firstResult.hr_name,
      hrNumber: firstResult.hr_number,
      meet: firstResult.meet,
      totalStarts: parseInt(firstResult.total_starts || '0'),
      totalWins: parseInt(firstResult.total_wins || '0'),
      totalPlaces: parseInt(firstResult.total_places || '0'),
      totalWinRate: parseFloat(firstResult.total_win_rate || '0'),
      totalPlaceRate: parseFloat(firstResult.total_place_rate || '0'),
      totalPrize: parseInt(firstResult.total_prize || '0'),
      recentForm: `${firstResult.rc_rank}착 (${firstResult.rc_time})`,
      recentRating: parseInt(firstResult.rc_rating || '0'),
      yearPerformance: {
        starts: parseInt(firstResult.year_starts || '0'),
        wins: parseInt(firstResult.year_wins || '0'),
        places: parseInt(firstResult.year_places || '0'),
        winRate: parseFloat(firstResult.year_win_rate || '0'),
        placeRate: parseFloat(firstResult.year_place_rate || '0'),
        prize: parseInt(firstResult.year_prize || '0'),
      },
    };
  }

  /**
   * 경주마 성적 검색 (고급 검색)
   */
  async searchRaceHorseResults(
    searchCriteria: {
      meet?: string;
      hrName?: string;
      hrNumber?: string;
      minAge?: number;
      maxAge?: number;
      sex?: string;
      minRating?: number;
      maxRating?: number;
      minWinRate?: number;
      maxWinRate?: number;
      minStarts?: number;
      maxStarts?: number;
      minPrize?: number;
      maxPrize?: number;
    },
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    // 기본 쿼리 생성
    const baseQuery: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(searchCriteria.meet && { meet: searchCriteria.meet }),
      ...(searchCriteria.hrName && { hr_name: searchCriteria.hrName }),
      ...(searchCriteria.hrNumber && { hr_number: searchCriteria.hrNumber }),
    };

    // 경주마 성적 조회
    const response = await this.getRaceHorseResults(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 고급 필터링 적용
    let filteredResults = response.data;

    if (searchCriteria.minAge) {
      filteredResults = filteredResults.filter(
        result => parseInt(result.hr_age || '0') >= searchCriteria.minAge!
      );
    }

    if (searchCriteria.maxAge) {
      filteredResults = filteredResults.filter(
        result => parseInt(result.hr_age || '0') <= searchCriteria.maxAge!
      );
    }

    if (searchCriteria.sex) {
      filteredResults = filteredResults.filter(
        result => result.hr_sex === searchCriteria.sex
      );
    }

    if (searchCriteria.minRating) {
      filteredResults = filteredResults.filter(
        result => parseInt(result.rc_rating || '0') >= searchCriteria.minRating!
      );
    }

    if (searchCriteria.maxRating) {
      filteredResults = filteredResults.filter(
        result =>
          parseInt(result.rc_rating || '999') <= searchCriteria.maxRating!
      );
    }

    if (searchCriteria.minWinRate) {
      filteredResults = filteredResults.filter(
        result =>
          parseFloat(result.total_win_rate || '0') >= searchCriteria.minWinRate!
      );
    }

    if (searchCriteria.maxWinRate) {
      filteredResults = filteredResults.filter(
        result =>
          parseFloat(result.total_win_rate || '100') <=
          searchCriteria.maxWinRate!
      );
    }

    if (searchCriteria.minStarts) {
      filteredResults = filteredResults.filter(
        result =>
          parseInt(result.total_starts || '0') >= searchCriteria.minStarts!
      );
    }

    if (searchCriteria.maxStarts) {
      filteredResults = filteredResults.filter(
        result =>
          parseInt(result.total_starts || '999') <= searchCriteria.maxStarts!
      );
    }

    if (searchCriteria.minPrize) {
      filteredResults = filteredResults.filter(
        result =>
          parseInt(result.total_prize || '0') >= searchCriteria.minPrize!
      );
    }

    if (searchCriteria.maxPrize) {
      filteredResults = filteredResults.filter(
        result =>
          parseInt(result.total_prize || '999999999') <=
          searchCriteria.maxPrize!
      );
    }

    return {
      ...response,
      data: filteredResults,
      metadata: {
        ...response.metadata,
        filteredCount: filteredResults.length,
        originalCount: response.data.length,
        searchCriteria,
      },
    };
  }

  /**
   * 경주마 성적 순위별 조회
   */
  async getRaceHorseResultsByRank(
    rank: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const baseQuery: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(meet && { meet }),
    };

    const response = await this.getRaceHorseResults(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 순위별 필터링
    const filteredResults = response.data.filter(
      result => result.rc_rank === rank
    );

    return {
      ...response,
      data: filteredResults,
      metadata: {
        ...response.metadata,
        filteredCount: filteredResults.length,
        originalCount: response.data.length,
        rank,
      },
    };
  }

  /**
   * 경주마 성적 연령별 조회
   */
  async getRaceHorseResultsByAge(
    minAge: number,
    maxAge: number,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRaceHorseResult[]>> {
    const baseQuery: KraRaceHorseResultsQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(meet && { meet }),
    };

    const response = await this.getRaceHorseResults(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 연령별 필터링
    const filteredResults = response.data.filter(result => {
      const age = parseInt(result.hr_age || '0');
      return age >= minAge && age <= maxAge;
    });

    return {
      ...response,
      data: filteredResults,
      metadata: {
        ...response.metadata,
        filteredCount: filteredResults.length,
        originalCount: response.data.length,
        ageRange: { minAge, maxAge },
      },
    };
  }
}
