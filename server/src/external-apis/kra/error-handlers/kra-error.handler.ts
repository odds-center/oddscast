import { Logger } from '@nestjs/common';

// KRA API 에러 코드 매핑 (Swagger 문서 기반)
export const KRA_ERROR_CODES = {
  // 성공
  SUCCESS: {
    code: '00',
    message: 'NORMAL SERVICE',
    description: '정상 서비스',
    retryable: false,
    action: '정상 처리됨',
    retryDelay: 0,
  },

  // 파라미터 에러
  INVALID_PARAMETER: {
    code: '10',
    message: '잘못된 요청 파라미터 에러',
    description: '요청 파라미터가 잘못되었습니다',
    retryable: false,
    action: '파라미터 확인 후 재요청',
    retryDelay: 0,
  },

  // 시스템 에러
  SYSTEM_ERROR: {
    code: '99',
    message: '시스템 에러',
    description: '시스템 내부 오류가 발생했습니다',
    retryable: true,
    action: '잠시 후 재시도',
    retryDelay: 5 * 60 * 1000, // 5분
  },

  // 인증 에러
  AUTHENTICATION_ERROR: {
    code: '30',
    message: '인증 에러',
    description: '인증에 실패했습니다',
    retryable: false,
    action: 'API 키 확인 필요',
    retryDelay: 0,
  },

  // 권한 에러
  AUTHORIZATION_ERROR: {
    code: '31',
    message: '권한 에러',
    description: '해당 서비스에 대한 권한이 없습니다',
    retryable: false,
    action: '권한 확인 필요',
    retryDelay: 0,
  },

  // 서비스 키 에러
  SERVICE_KEY_ERROR: {
    code: '32',
    message: '서비스 키 에러',
    description: '서비스 키가 잘못되었습니다',
    retryable: false,
    action: '서비스 키 확인 필요',
    retryDelay: 0,
  },

  // 요청 제한 에러
  RATE_LIMIT_EXCEEDED: {
    code: '22',
    message: '서비스 요청제한횟수 초과에러',
    description: '일일 요청 제한을 초과했습니다',
    retryable: true,
    action: '다음날 재시도',
    retryDelay: 24 * 60 * 60 * 1000, // 24시간
  },

  // 서비스 일시 중단
  SERVICE_SUSPENDED: {
    code: '12',
    message: '서비스 일시 중단',
    description: '서비스가 일시적으로 중단되었습니다',
    retryable: true,
    action: '잠시 후 재시도',
    retryDelay: 30 * 60 * 1000, // 30분
  },

  // 데이터 없음
  NO_DATA: {
    code: '20',
    message: '데이터 없음',
    description: '요청한 데이터가 존재하지 않습니다',
    retryable: false,
    action: '검색 조건 확인',
    retryDelay: 0,
  },
} as const;

export type KraErrorCode = keyof typeof KRA_ERROR_CODES;

export interface KraErrorResult {
  error: {
    code: string;
    message: string;
    description: string;
    details?: any;
  };
  shouldRetry: boolean;
  retryDelay: number;
  action: string;
}

export class KraErrorHandler {
  private readonly logger = new Logger(KraErrorHandler.name);

  /**
   * KRA API 에러 처리
   * Swagger 문서 기반 정확한 에러 코드 매핑
   */
  handleKraApiError(
    error: any,
    operation: string,
    context?: any
  ): KraErrorResult {
    this.logger.error(`KRA API Error in ${operation}:`, {
      error: error.message || error,
      context,
      stack: error.stack,
    });

    // KRA API 응답 에러인 경우
    if (error.response?.data?.header?.resultCode) {
      const resultCode = error.response.data.header.resultCode;
      const resultMsg = error.response.data.header.resultMsg;

      // 에러 코드별 처리
      switch (resultCode) {
        case KRA_ERROR_CODES.INVALID_PARAMETER.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.INVALID_PARAMETER.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.INVALID_PARAMETER.retryable,
            retryDelay: KRA_ERROR_CODES.INVALID_PARAMETER.retryDelay,
            action: KRA_ERROR_CODES.INVALID_PARAMETER.action,
          };

        case KRA_ERROR_CODES.RATE_LIMIT_EXCEEDED.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.RATE_LIMIT_EXCEEDED.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.RATE_LIMIT_EXCEEDED.retryable,
            retryDelay: KRA_ERROR_CODES.RATE_LIMIT_EXCEEDED.retryDelay,
            action: KRA_ERROR_CODES.RATE_LIMIT_EXCEEDED.action,
          };

        case KRA_ERROR_CODES.SERVICE_SUSPENDED.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.SERVICE_SUSPENDED.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.SERVICE_SUSPENDED.retryable,
            retryDelay: KRA_ERROR_CODES.SERVICE_SUSPENDED.retryDelay,
            action: KRA_ERROR_CODES.SERVICE_SUSPENDED.action,
          };

        case KRA_ERROR_CODES.NO_DATA.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.NO_DATA.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.NO_DATA.retryable,
            retryDelay: KRA_ERROR_CODES.NO_DATA.retryDelay,
            action: KRA_ERROR_CODES.NO_DATA.action,
          };

        case KRA_ERROR_CODES.AUTHENTICATION_ERROR.code:
        case KRA_ERROR_CODES.AUTHORIZATION_ERROR.code:
        case KRA_ERROR_CODES.SERVICE_KEY_ERROR.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.AUTHENTICATION_ERROR.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.AUTHENTICATION_ERROR.retryable,
            retryDelay: KRA_ERROR_CODES.AUTHENTICATION_ERROR.retryDelay,
            action: KRA_ERROR_CODES.AUTHENTICATION_ERROR.action,
          };

        case KRA_ERROR_CODES.SYSTEM_ERROR.code:
          return {
            error: {
              code: `KRA_${resultCode}`,
              message: resultMsg,
              description: KRA_ERROR_CODES.SYSTEM_ERROR.description,
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: KRA_ERROR_CODES.SYSTEM_ERROR.retryable,
            retryDelay: KRA_ERROR_CODES.SYSTEM_ERROR.retryDelay,
            action: KRA_ERROR_CODES.SYSTEM_ERROR.action,
          };

        default:
          // 알 수 없는 에러 코드
          return {
            error: {
              code: `KRA_UNKNOWN_${resultCode}`,
              message: resultMsg,
              description: '알 수 없는 KRA API 에러',
              details: { resultCode, resultMsg, context },
            },
            shouldRetry: false,
            retryDelay: 0,
            action: '관리자에게 문의',
          };
      }
    }

    // 네트워크 에러 또는 기타 에러
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        error: {
          code: 'KRA_TIMEOUT',
          message: 'KRA API 요청 시간 초과',
          description: 'API 요청이 시간 초과되었습니다',
          details: { error: error.message, context },
        },
        shouldRetry: true,
        retryDelay: 10 * 1000, // 10초
        action: '잠시 후 재시도',
      };
    }

    if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      return {
        error: {
          code: 'KRA_NETWORK_ERROR',
          message: 'KRA API 네트워크 에러',
          description: 'API 서버에 연결할 수 없습니다',
          details: { error: error.message, context },
        },
        shouldRetry: true,
        retryDelay: 30 * 1000, // 30초
        action: '네트워크 연결 확인 후 재시도',
      };
    }

    // 기본 에러 처리
    return {
      error: {
        code: 'KRA_UNKNOWN_ERROR',
        message: error.message || '알 수 없는 KRA API 에러',
        description: '예상치 못한 에러가 발생했습니다',
        details: { error: error.message, context, stack: error.stack },
      },
      shouldRetry: false,
      retryDelay: 0,
      action: '로그 확인 후 관리자에게 문의',
    };
  }

  /**
   * 에러 로깅 및 모니터링
   */
  logError(error: KraErrorResult, operation: string, context?: any): void {
    const logLevel = error.shouldRetry ? 'warn' : 'error';

    this.logger[logLevel](`KRA API Error in ${operation}:`, {
      error: error.error,
      shouldRetry: error.shouldRetry,
      retryDelay: error.retryDelay,
      action: error.action,
      context,
    });

    // 에러 모니터링 시스템에 전송 (필요시)
    this.sendToMonitoring(error, operation, context);
  }

  /**
   * 에러 모니터링 시스템 전송
   */
  private sendToMonitoring(
    error: KraErrorResult,
    operation: string,
    context?: any
  ): void {
    // TODO: 에러 모니터링 시스템 연동 (Sentry, DataDog 등)
    // 현재는 로그만 출력
    this.logger.debug('Error monitoring data:', {
      operation,
      error: error.error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  isRetryableError(error: any): boolean {
    if (error.response?.data?.header?.resultCode) {
      const resultCode = error.response.data.header.resultCode;
      const errorInfo = Object.values(KRA_ERROR_CODES).find(
        info => info.code === resultCode
      );
      return errorInfo?.retryable || false;
    }
    return false;
  }

  /**
   * 재시도 지연 시간 계산
   */
  getRetryDelay(error: any, attempt: number = 1): number {
    if (error.response?.data?.header?.resultCode) {
      const resultCode = error.response.data.header.resultCode;
      const errorInfo = Object.values(KRA_ERROR_CODES).find(
        info => info.code === resultCode
      );

      if (errorInfo?.retryable) {
        // 지수 백오프 적용 (최대 5분)
        const baseDelay = errorInfo.retryDelay;
        const exponentialDelay = Math.min(
          baseDelay * Math.pow(2, attempt - 1),
          5 * 60 * 1000
        );
        return exponentialDelay;
      }
    }
    return 0;
  }
}
