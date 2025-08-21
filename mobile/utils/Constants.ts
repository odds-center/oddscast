// JWT 토큰 저장 키
export const JWT_TOKEN_NAME = 'jwt_token';

// JWT 설정
export const JWT_CONFIG = {
  SECRET: 'goldenrace-super-secret-jwt-key-2024-production-ready',
  EXPIRES_IN: '30d',
  REFRESH_EXPIRES_IN: '90d',
} as const;

// 서버 설정
export const SERVER_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3002', // Android 에뮬레이터용
  LOCAL_URL: 'http://localhost:3002', // iOS 시뮬레이터용
  API_VERSION: 'v1',
  TIMEOUT: 10000,
} as const;

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

export const GOOGLE_ANDROID_CLIENT_ID =
  '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID =
  '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID =
  '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com';
export const KRA_OPENAPI_KEY_ENCODING =
  'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D';
export const KRA_OPENAPI_KEY_DECODING =
  'yyRDa/aXc9SsDdY67IqkdXJmZgZXOzsKqnf+R/SZjR6iAxYLzKiq+gXTmdUj/Fe+FtEsMXnMYrLaiX6PZ/emsQ==';
