import { Injectable } from '@nestjs/common';
import { ApiClientBase, ApiResponse } from '../../common/api-client.base';
import { getKraApiConfig } from '../config/kra-api.config';
import {
  KRA_RESPONSE_CODES,
  KraRacePlan,
  KraRacePlansQueryDto,
  KraRacePlansResponseDto,
  normalizeRacePlans,
  filterRacePlans,
  sortRacePlans,
  validateRacePlan,
  generateRacePlanStatistics,
} from '../dto/kra-race-plans.dto';
import { KraErrorHandler } from '../error-handlers/kra-error.handler';

@Injectable()
export class KraRacePlansService extends ApiClientBase {
  private readonly errorHandler: KraErrorHandler;

  constructor() {
    const apiKey = process.env.KRA_API_KEY || '';
    const config = getKraApiConfig(apiKey);
    const racePlansEndpoint = config.baseUrls.RACE_PLANS;

    super(
      {
        baseURL: racePlansEndpoint.url,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      },
      'KraRacePlansService'
    );

    this.errorHandler = new KraErrorHandler();
  }

  /**
   * 경주계획표 정보 조회 (API72_2)
   * Swagger 문서 기반 정확한 응답 구조 처리
   */
  async getRacePlans(
    query: KraRacePlansQueryDto
  ): Promise<ApiResponse<KraRacePlan[]>> {
    try {
      this.logger.log(
        `Fetching race plans with query: ${JSON.stringify(query)}`
      );

      // 기본값 설정
      const requestParams = {
        ...query,
        _type: query._type || 'json',
        pageNo: query.pageNo || '1',
        numOfRows: query.numOfRows || '100',
      };

      const response = await this.makeRequest<KraRacePlansResponseDto>({
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
        const normalizedItems = normalizeRacePlans(items);

        // 데이터 검증
        const validItems = normalizedItems.filter(validateRacePlan);

        this.logger.log(
          `Successfully fetched ${validItems.length} race plans (total: ${body.totalCount})`
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
            validPlans: validItems.length,
            invalidPlans: normalizedItems.length - validItems.length,
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
        'RACE_PLANS',
        query
      );

      this.logger.error('Failed to fetch race plans', {
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
   * 특정 경마장의 경주계획 조회
   */
  async getRacePlansByMeet(
    meet: string,
    rcDate?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      meet,
      ...(rcDate && { rc_date: rcDate }),
    };

    return this.getRacePlans(query);
  }

  /**
   * 특정 날짜의 경주계획 조회
   */
  async getRacePlansByDate(
    rcDate: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_date: rcDate,
      ...(meet && { meet }),
    };

    return this.getRacePlans(query);
  }

  /**
   * 월별 경주계획 조회
   */
  async getRacePlansByMonth(
    rcMonth: string, // YYYYMM 형식
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_month: rcMonth,
      ...(meet && { meet }),
    };

    return this.getRacePlans(query);
  }

  /**
   * 연도별 경주계획 조회
   */
  async getRacePlansByYear(
    rcYear: string, // YYYY 형식
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_year: rcYear,
      ...(meet && { meet }),
    };

    return this.getRacePlans(query);
  }

  /**
   * 최근 경주계획 조회 (기본값: 최근 1개월)
   */
  async getLatestRacePlans(
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(meet && { meet }),
      // rc_date, rc_month, rc_year를 제외하면 최근 경주일 정보 조회
    };

    return this.getRacePlans(query);
  }

  /**
   * 필터링된 경주계획 조회
   */
  async getFilteredRacePlans(
    baseQuery: KraRacePlansQueryDto,
    filterOptions?: {
      meet?: string;
      rcDate?: string;
      rcNo?: string;
      minDistance?: number;
      maxDistance?: number;
      grade?: string;
      minPrize?: number;
      maxPrize?: number;
      minRating?: number;
      maxRating?: number;
    },
    sortOptions?: {
      sortBy: 'date' | 'distance' | 'prize' | 'time' | 'rcNo';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<KraRacePlan[]>> {
    const response = await this.getRacePlans(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 필터링 적용
    let filteredPlans = filterRacePlans(response.data, filterOptions);

    // 정렬 적용
    if (sortOptions) {
      filteredPlans = sortRacePlans(
        filteredPlans,
        sortOptions.sortBy,
        sortOptions.sortOrder
      );
    }

    return {
      ...response,
      data: filteredPlans,
      metadata: {
        ...response.metadata,
        filteredCount: filteredPlans.length,
        originalCount: response.data.length,
      },
    };
  }

  /**
   * 경주계획 통계 정보 생성
   */
  async getRacePlanStatistics(plans: KraRacePlan[]): Promise<{
    totalPlans: number;
    totalPrize: number;
    averageDistance: number;
    meetDistribution: Record<string, number>;
    gradeDistribution: Record<string, number>;
    distanceDistribution: Record<string, number>;
    dateDistribution: Record<string, number>;
  }> {
    return generateRacePlanStatistics(plans);
  }

  /**
   * 경주계획 요약 정보 생성
   */
  async getRacePlanSummary(plans: KraRacePlan[]): Promise<{
    rcDate: string;
    meet: string;
    totalRaces: number;
    totalPrize: number;
    averageDistance: number;
    gradeDistribution: Record<string, number>;
    distanceDistribution: Record<string, number>;
    plans: KraRacePlan[];
  } | null> {
    const validPlans = plans.filter(validateRacePlan);

    if (validPlans.length === 0) {
      return null;
    }

    // 첫 번째 레코드에서 기본 정보 추출
    const firstPlan = validPlans[0];

    // 통계 정보 생성
    const statistics = generateRacePlanStatistics(validPlans);

    return {
      rcDate: firstPlan.rc_date,
      meet: firstPlan.meet,
      totalRaces: statistics.totalPlans,
      totalPrize: statistics.totalPrize,
      averageDistance: statistics.averageDistance,
      gradeDistribution: statistics.gradeDistribution,
      distanceDistribution: statistics.distanceDistribution,
      plans: validPlans,
    };
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
  ): Promise<ApiResponse<KraRacePlan[]>> {
    // 기본 쿼리 생성
    const baseQuery: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(searchCriteria.meet && { meet: searchCriteria.meet }),
      ...(searchCriteria.rcDate && { rc_date: searchCriteria.rcDate }),
    };

    // 경주계획 조회
    const response = await this.getRacePlans(baseQuery);

    if (!response.success || !response.data) {
      return response;
    }

    // 고급 필터링 적용
    let filteredPlans = response.data;

    if (searchCriteria.rcNo) {
      filteredPlans = filteredPlans.filter(
        plan => plan.rc_no === searchCriteria.rcNo
      );
    }

    if (searchCriteria.rcName) {
      filteredPlans = filteredPlans.filter(plan =>
        plan.rc_name.includes(searchCriteria.rcName!)
      );
    }

    if (searchCriteria.minDistance) {
      filteredPlans = filteredPlans.filter(
        plan => parseInt(plan.rc_dist) >= searchCriteria.minDistance!
      );
    }

    if (searchCriteria.maxDistance) {
      filteredPlans = filteredPlans.filter(
        plan => parseInt(plan.rc_dist) <= searchCriteria.maxDistance!
      );
    }

    if (searchCriteria.grade) {
      filteredPlans = filteredPlans.filter(
        plan => plan.rc_grade === searchCriteria.grade
      );
    }

    if (searchCriteria.minPrize) {
      filteredPlans = filteredPlans.filter(
        plan => parseInt(plan.rc_prize) >= searchCriteria.minPrize!
      );
    }

    if (searchCriteria.maxPrize) {
      filteredPlans = filteredPlans.filter(
        plan => parseInt(plan.rc_prize) <= searchCriteria.maxPrize!
      );
    }

    if (searchCriteria.minRating) {
      filteredPlans = filteredPlans.filter(plan => {
        const rating = parseInt(plan.rc_rating_min || '0');
        return rating >= searchCriteria.minRating!;
      });
    }

    if (searchCriteria.maxRating) {
      filteredPlans = filteredPlans.filter(plan => {
        const rating = parseInt(plan.rc_rating_max || '999');
        return rating <= searchCriteria.maxRating!;
      });
    }

    if (searchCriteria.ageCondition) {
      filteredPlans = filteredPlans.filter(
        plan => plan.rc_age_condition === searchCriteria.ageCondition
      );
    }

    if (searchCriteria.sexCondition) {
      filteredPlans = filteredPlans.filter(
        plan => plan.rc_sex_condition === searchCriteria.sexCondition
      );
    }

    return {
      ...response,
      data: filteredPlans,
      metadata: {
        ...response.metadata,
        filteredCount: filteredPlans.length,
        originalCount: response.data.length,
        searchCriteria,
      },
    };
  }

  /**
   * 경주계획 일정 캘린더 생성
   */
  async getRacePlanCalendar(
    startDate: string, // YYYYMMDD 형식
    endDate: string, // YYYYMMDD 형식
    meet?: string
  ): Promise<ApiResponse<Record<string, KraRacePlan[]>>> {
    const query: KraRacePlansQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: '1',
      numOfRows: '1000', // 충분한 데이터를 가져오기 위해
      ...(meet && { meet }),
      rc_date: startDate, // 시작일 기준으로 조회
    };

    const response = await this.getRacePlans(query);

    if (!response.success || !response.data) {
      // ApiResponse 타입을 맞추기 위해 빈 캘린더 반환
      return {
        success: false,
        data: {},
        timestamp: new Date().toISOString(),
        responseTime: 0,
        error: {
          code: 'NO_DATA',
          message: '경주계획 데이터가 없습니다.',
        },
      };
    }

    // 날짜 범위 내의 계획만 필터링
    const filteredPlans = response.data.filter(plan => {
      const planDate = plan.rc_date;
      return planDate >= startDate && planDate <= endDate;
    });

    // 날짜별로 그룹화
    const calendar: Record<string, KraRacePlan[]> = {};
    filteredPlans.forEach(plan => {
      if (!calendar[plan.rc_date]) {
        calendar[plan.rc_date] = [];
      }
      calendar[plan.rc_date].push(plan);
    });

    // 각 날짜별로 경주번호 순으로 정렬
    Object.keys(calendar).forEach(date => {
      calendar[date] = sortRacePlans(calendar[date], 'rcNo', 'asc');
    });

    // ApiResponse 형태로 반환
    return {
      success: true,
      data: calendar,
      timestamp: new Date().toISOString(),
      responseTime: 0, // 실제 응답 시간은 측정되지 않음
      metadata: {
        startDate,
        endDate,
        totalDates: Object.keys(calendar).length,
        totalPlans: filteredPlans.length,
      },
    };
  }
}
