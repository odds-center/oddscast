import { Injectable } from '@nestjs/common';
import { ApiClientBase, ApiResponse } from '../../common/api-client.base';
import { getKraApiConfig } from '../config/kra-api.config';
import {
  KRA_POOL_TYPES,
  KRA_RESPONSE_CODES,
  KraDividendItem,
  KraDividendQueryDto,
  KraDividendResponseDto,
  normalizeDividendItems,
} from '../dto/kra-dividend.dto';
import { KraErrorHandler } from '../error-handlers/kra-error.handler';

@Injectable()
export class KraDividendService extends ApiClientBase {
  private readonly errorHandler: KraErrorHandler;

  constructor() {
    // 환경변수에서 API 키를 가져와야 함
    const apiKey = process.env.KRA_API_KEY || '';
    const config = getKraApiConfig(apiKey);
    const dividendEndpoint = config.baseUrls.DIVIDEND_RATES;

    super(
      {
        baseURL: dividendEndpoint.url,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      },
      'KraDividendService'
    );

    this.errorHandler = new KraErrorHandler();
  }

  /**
   * 확정배당율 정보 조회 (API160_1)
   * Swagger 문서 기반 정확한 응답 구조 처리
   */
  async getDividendRates(
    query: KraDividendQueryDto
  ): Promise<ApiResponse<KraDividendItem[]>> {
    try {
      this.logger.log(
        `Fetching dividend rates with query: ${JSON.stringify(query)}`
      );

      // 기본값 설정
      const requestParams = {
        ...query,
        _type: query._type || 'json',
        pageNo: query.pageNo || '1',
        numOfRows: query.numOfRows || '100',
      };

      const response = await this.makeRequest<KraDividendResponseDto>({
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
        const normalizedItems = normalizeDividendItems(items);

        this.logger.log(
          `Successfully fetched ${normalizedItems.length} dividend rate items (total: ${body.totalCount})`
        );

        return {
          success: true,
          data: normalizedItems,
          timestamp: response.timestamp,
          responseTime: response.responseTime,
          metadata: {
            pageNo: parseInt(body.pageNo),
            numOfRows: parseInt(body.numOfRows),
            totalCount: parseInt(body.totalCount),
            totalPages: Math.ceil(
              parseInt(body.totalCount) / parseInt(body.numOfRows)
            ),
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
        'DIVIDEND_RATES',
        query
      );

      this.logger.error('Failed to fetch dividend rates', {
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
   * 특정 경마장의 확정배당율 조회
   */
  async getDividendRatesByMeet(
    meet: string,
    rcDate?: string,
    pool?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraDividendItem[]>> {
    const query: KraDividendQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      meet,
      ...(rcDate && { rc_date: rcDate }),
      ...(pool && { pool }),
    };

    return this.getDividendRates(query);
  }

  /**
   * 특정 경주의 확정배당율 조회
   */
  async getDividendRatesByRace(
    rcNo: string,
    rcDate: string,
    meet: string,
    pool?: string
  ): Promise<ApiResponse<KraDividendItem[]>> {
    const query: KraDividendQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: '1',
      numOfRows: '1000', // 경주당 최대 배당율 수
      rc_no: rcNo,
      rc_date: rcDate,
      meet,
      ...(pool && { pool }),
    };

    return this.getDividendRates(query);
  }

  /**
   * 특정 승식의 확정배당율 조회
   */
  async getDividendRatesByPool(
    pool: keyof typeof KRA_POOL_TYPES,
    rcDate?: string,
    meet?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraDividendItem[]>> {
    const query: KraDividendQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      pool: KRA_POOL_TYPES[pool],
      ...(rcDate && { rc_date: rcDate }),
      ...(meet && { meet }),
    };

    return this.getDividendRates(query);
  }

  /**
   * 월별 확정배당율 조회
   */
  async getDividendRatesByMonth(
    rcMonth: string, // YYYYMM 형식
    meet?: string,
    pool?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraDividendItem[]>> {
    const query: KraDividendQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      rc_month: rcMonth,
      ...(meet && { meet }),
      ...(pool && { pool }),
    };

    return this.getDividendRates(query);
  }

  /**
   * 최근 경마일의 확정배당율 조회
   */
  async getLatestDividendRates(
    meet?: string,
    pool?: string,
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<ApiResponse<KraDividendItem[]>> {
    const query: KraDividendQueryDto = {
      ServiceKey: process.env.KRA_API_KEY || '',
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      ...(meet && { meet }),
      ...(pool && { pool }),
      // rc_date와 rc_month를 제외하면 최근 경마일 정보 조회
    };

    return this.getDividendRates(query);
  }

  /**
   * 배당율 데이터 검증
   */
  private validateDividendItem(item: KraDividendItem): boolean {
    return !!(
      item.odds &&
      item.pool &&
      item.chulNo &&
      item.rcNo &&
      item.meet &&
      item.rcDate
    );
  }

  /**
   * 배당율 데이터 필터링 및 정렬
   */
  private processDividendItems(
    items: KraDividendItem[],
    options?: {
      minOdds?: number;
      maxOdds?: number;
      sortBy?: 'odds' | 'rcNo' | 'chulNo';
      sortOrder?: 'asc' | 'desc';
    }
  ): KraDividendItem[] {
    let processedItems = items.filter(item => this.validateDividendItem(item));

    // 배당율 범위 필터링
    if (options?.minOdds) {
      processedItems = processedItems.filter(
        item => parseFloat(item.odds) >= options.minOdds!
      );
    }
    if (options?.maxOdds) {
      processedItems = processedItems.filter(
        item => parseFloat(item.odds) <= options.maxOdds!
      );
    }

    // 정렬
    if (options?.sortBy) {
      processedItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (options.sortBy) {
          case 'odds':
            aValue = parseFloat(a.odds);
            bValue = parseFloat(b.odds);
            break;
          case 'rcNo':
            aValue = parseInt(a.rcNo);
            bValue = parseInt(b.rcNo);
            break;
          case 'chulNo':
            aValue = parseInt(a.chulNo);
            bValue = parseInt(b.chulNo);
            break;
          default:
            return 0;
        }

        if (options.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    return processedItems;
  }
}
