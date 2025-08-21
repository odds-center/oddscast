// JWT 토큰 저장 키
export const JWT_TOKEN_NAME = 'jwt_token';

// 앱 설정
export const APP_NAME = 'Golden Race';
export const APP_VERSION = '1.0.0';

// 네트워크 설정
export const REQUEST_TIMEOUT = 10000; // 10초
export const MAX_RETRY_ATTEMPTS = 3;

// 스토리지 키
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  NOTIFICATION_SETTINGS: 'notification_settings',
  THEME_SETTINGS: 'theme_settings',
  LANGUAGE_SETTINGS: 'language_settings',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
} as const;

// 유효성 검사 규칙
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 20,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE: /^[0-9-+\s()]+$/,
} as const;

// 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 캐시 설정
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5분
  USER_DATA_TTL: 30 * 60 * 1000, // 30분
  RACE_DATA_TTL: 10 * 60 * 1000, // 10분
} as const;

// 애니메이션 설정
export const ANIMATION_CONFIG = {
  DURATION: 300,
  SPRING_CONFIG: {
    damping: 15,
    stiffness: 150,
  },
} as const;
