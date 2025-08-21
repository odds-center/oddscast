// 애플리케이션 전역 상수
export const APP_CONSTANTS = {
  NAME: 'Golden Race',
  VERSION: '1.0.0',
  DESCRIPTION: '경마 예측 및 베팅 플랫폼',
  AUTHOR: 'Golden Race Team',
} as const;

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// 데이터베이스 관련 상수
export const DB_CONSTANTS = {
  MAX_CONNECTIONS: 10,
  MIN_CONNECTIONS: 2,
  ACQUIRE_TIMEOUT: 60000,
  TIMEOUT: 20000,
  IDLE_TIMEOUT: 300000,
} as const;

// 캐시 관련 상수
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 3600, // 1시간
  MAX_ITEMS: 1000,
  CHECK_PERIOD: 600, // 10분
} as const;

// API 관련 상수
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
} as const;

// 경마 관련 상수
export const RACING_CONSTANTS = {
  MEETS: {
    SEOUL: '1',
    BUSAN: '2',
    JEJU: '3',
  },
  RACE_GRADES: {
    SPECIAL: 'S',
    GRADE1: '1',
    GRADE2: '2',
    GRADE3: '3',
    OPEN: 'O',
    CONDITION: 'C',
  },
  BET_TYPES: {
    WIN: 'W',
    PLACE: 'P',
    QUINELLA: 'Q',
    EXACTA: 'E',
    TRIFECTA: 'T',
  },
  OPERATING_HOURS: {
    START: 9,
    END: 18,
  },
} as const;

// 시간 관련 상수
export const TIME_CONSTANTS = {
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// 보안 관련 상수
export const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SALT_ROUNDS: 12,
  TOKEN_EXPIRY: {
    ACCESS: '1h',
    REFRESH: '7d',
  },
} as const;
