// 인증 관련 상수
export const AUTH_CONSTANTS = {
  // 토큰 관련
  TOKEN: {
    STORAGE_KEY: 'jwt_token',
    USER_DATA_KEY: 'user_data',
    REFRESH_KEY: 'refresh_token',
  },

  // 인증 상태
  STATUS: {
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    LOADING: 'loading',
  },

  // 소셜 로그인 제공자
  PROVIDERS: {
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    APPLE: 'apple',
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    LOGIN_FAILED: '로그인에 실패했습니다.',
    LOGOUT_FAILED: '로그아웃에 실패했습니다.',
    TOKEN_EXPIRED: '토큰이 만료되었습니다.',
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    SERVER_ERROR: '서버 오류가 발생했습니다.',
    INVALID_CREDENTIALS: '잘못된 인증 정보입니다.',
  },

  // 성공 메시지
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: '로그인되었습니다.',
    LOGOUT_SUCCESS: '로그아웃되었습니다.',
    TOKEN_REFRESHED: '토큰이 갱신되었습니다.',
  },
} as const;

// API 관련 상수
export const API_CONSTANTS = {
  // HTTP 상태 코드
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },

  // API 엔드포인트
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      GOOGLE_SIGNIN: '/auth/google/signin',
      GOOGLE_VERIFY: '/auth/google/verify-id-token',
      ME: '/auth/me',
    },
    USERS: {
      PROFILE: '/users/profile',
      UPDATE: '/users/update',
    },
    RACES: '/races',
    BETS: '/bets',
    POINTS: '/points',
    RESULTS: '/results',
  },

  // 헤더
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
    BEARER_PREFIX: 'Bearer',
  },

  // 요청 설정
  REQUEST: {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
} as const;

// 사용자 관련 상수
export const USER_CONSTANTS = {
  // 역할
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // 상태
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
  },

  // 기본값
  DEFAULTS: {
    ROLE: 'user',
    STATUS: 'active',
    AVATAR: 'https://via.placeholder.com/150',
  },
} as const;

// 앱 설정 관련 상수
export const APP_CONSTANTS = {
  // 앱 정보
  INFO: {
    NAME: 'GoldenRace',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.goldenrace.app',
  },

  // 테마 색상
  COLORS: {
    PRIMARY: '#B48A3C',
    SECONDARY: '#E5C99C',
    SUCCESS: '#4CAF50',
    ERROR: '#F44336',
    WARNING: '#FF9800',
    INFO: '#2196F3',
  },

  // 스토리지 키
  STORAGE_KEYS: {
    THEME: 'theme_preference',
    LANGUAGE: 'language_preference',
    NOTIFICATIONS: 'notification_settings',
    USER_PREFERENCES: 'user_preferences',
  },
} as const;
