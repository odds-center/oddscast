// KRA API 에러 코드 상수
export const KRA_ERROR_CODES = {
  // 애플리케이션 에러
  APPLICATION_ERROR: {
    code: '1',
    message: 'APPLICATION_ERROR',
    description: '어플리케이션 에러',
    retryable: false,
    action: '관리자에게 문의',
    retryDelay: 0,
  },

  // 요청 파라미터 에러
  INVALID_REQUEST_PARAMETER_ERROR: {
    code: '10',
    message: 'INVALID_REQUEST_PARAMETER_ERROR',
    description: '잘못된 요청 파라메터 에러',
    retryable: false,
    action: '요청 파라미터 확인 및 수정',
    retryDelay: 0,
  },

  // 서비스 관련 에러
  NO_OPENAPI_SERVICE_ERROR: {
    code: '12',
    message: 'NO_OPENAPI_SERVICE_ERROR',
    description: '해당 오픈API서비스가 없거나 폐기됨',
    retryable: false,
    action: 'API 서비스 상태 확인',
    retryDelay: 0,
  },

  // 접근 권한 에러
  SERVICE_ACCESS_DENIED_ERROR: {
    code: '20',
    message: 'SERVICE_ACCESS_DENIED_ERROR',
    description: '서비스 접근거부',
    retryable: false,
    action: '접근 권한 확인',
    retryDelay: 0,
  },

  // 요청 제한 에러
  LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR: {
    code: '22',
    message: 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
    description: '서비스 요청제한횟수 초과에러',
    retryable: true,
    action: '일일 요청 제한 확인, 다음날 재시도',
    retryDelay: 24 * 60 * 60 * 1000, // 24시간
  },

  // 인증 관련 에러
  SERVICE_KEY_IS_NOT_REGISTERED_ERROR: {
    code: '30',
    message: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
    description: '등록되지 않은 서비스키',
    retryable: false,
    action: 'API 키 등록 확인',
    retryDelay: 0,
  },

  DEADLINE_HAS_EXPIRED_ERROR: {
    code: '31',
    message: 'DEADLINE_HAS_EXPIRED_ERROR',
    description: '기한만료된 서비스키',
    retryable: false,
    action: 'API 키 갱신',
    retryDelay: 0,
  },

  UNREGISTERED_IP_ERROR: {
    code: '32',
    message: 'UNREGISTERED_IP_ERROR',
    description: '등록되지 않은 IP',
    retryable: false,
    action: 'IP 주소 등록 확인',
    retryDelay: 0,
  },

  // 기타 에러
  UNKNOWN_ERROR: {
    code: '99',
    message: 'UNKNOWN_ERROR',
    description: '기타에러',
    retryable: true,
    action: '잠시 후 재시도',
    retryDelay: 5 * 60 * 1000, // 5분
  },
} as const;

// 에러 코드별 분류
export const KRA_ERROR_CATEGORIES = {
  AUTHENTICATION: [
    KRA_ERROR_CODES.SERVICE_KEY_IS_NOT_REGISTERED_ERROR,
    KRA_ERROR_CODES.DEADLINE_HAS_EXPIRED_ERROR,
    KRA_ERROR_CODES.UNREGISTERED_IP_ERROR,
  ],
  RATE_LIMIT: [
    KRA_ERROR_CODES.LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR,
  ],
  VALIDATION: [KRA_ERROR_CODES.INVALID_REQUEST_PARAMETER_ERROR],
  SERVICE: [
    KRA_ERROR_CODES.NO_OPENAPI_SERVICE_ERROR,
    KRA_ERROR_CODES.SERVICE_ACCESS_DENIED_ERROR,
  ],
  SYSTEM: [KRA_ERROR_CODES.APPLICATION_ERROR, KRA_ERROR_CODES.UNKNOWN_ERROR],
} as const;

// 에러 코드로 에러 정보 조회
export const getKraErrorInfo = (errorCode: string) => {
  return Object.values(KRA_ERROR_CODES).find(error => error.code === errorCode);
};

// 에러 코드로 재시도 가능 여부 확인
export const isKraErrorRetryable = (errorCode: string): boolean => {
  const errorInfo = getKraErrorInfo(errorCode);
  return errorInfo?.retryable || false;
};

// 에러 코드로 재시도 지연 시간 조회
export const getKraErrorRetryDelay = (errorCode: string): number => {
  const errorInfo = getKraErrorInfo(errorCode);
  return errorInfo?.retryDelay || 0;
};

// 에러 카테고리별 에러 코드 조회
export const getKraErrorCodesByCategory = (
  category: keyof typeof KRA_ERROR_CATEGORIES
) => {
  return KRA_ERROR_CATEGORIES[category];
};

// HTTP 상태 코드와 KRA 에러 코드 매핑
export const KRA_HTTP_ERROR_MAPPING = {
  400: KRA_ERROR_CODES.INVALID_REQUEST_PARAMETER_ERROR,
  401: KRA_ERROR_CODES.SERVICE_KEY_IS_NOT_REGISTERED_ERROR,
  403: KRA_ERROR_CODES.SERVICE_ACCESS_DENIED_ERROR,
  429: KRA_ERROR_CODES.LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR,
  500: KRA_ERROR_CODES.APPLICATION_ERROR,
  503: KRA_ERROR_CODES.NO_OPENAPI_SERVICE_ERROR,
} as const;
