// JWT 관련 상수
export const JWT_CONSTANTS = {
  // 토큰 타입
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',

  // 토큰 만료 시간
  ACCESS_TOKEN_EXPIRES_IN: '30d', // 30일
  REFRESH_TOKEN_EXPIRES_IN: '90d', // 90일

  // 토큰 페이로드 필드
  PAYLOAD_FIELDS: {
    SUB: 'sub',
    EMAIL: 'email',
    NAME: 'name',
    IAT: 'iat',
    EXP: 'exp',
    ROLE: 'role',
    PROVIDER: 'provider',
  },

  // 인증 헤더
  AUTHORIZATION_HEADER: 'Authorization',
  BEARER_PREFIX: 'Bearer',

  // 에러 메시지
  ERROR_MESSAGES: {
    TOKEN_NOT_PROVIDED: '토큰이 제공되지 않았습니다.',
    INVALID_TOKEN: '유효하지 않은 토큰입니다.',
    TOKEN_EXPIRED: '토큰이 만료되었습니다.',
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
    INVALID_PAYLOAD: '토큰 페이로드가 유효하지 않습니다.',
    TOKEN_DECODE_FAILED: '토큰을 디코딩할 수 없습니다.',
  },
} as const;

// 소셜 로그인 관련 상수
export const SOCIAL_AUTH_CONSTANTS = {
  PROVIDERS: {
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    APPLE: 'apple',
  },

  // Google 관련
  GOOGLE: {
    ID_TOKEN_VERIFICATION_URL: 'https://oauth2.googleapis.com/tokeninfo',
    USER_INFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    INVALID_ID_TOKEN: '유효하지 않은 ID 토큰입니다.',
    VERIFICATION_FAILED: '토큰 검증에 실패했습니다.',
    USER_CREATION_FAILED: '사용자 생성에 실패했습니다.',
  },
} as const;

// 사용자 관련 상수
export const USER_CONSTANTS = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
  },

  VERIFICATION: {
    VERIFIED: true,
    UNVERIFIED: false,
  },

  // 기본값
  DEFAULTS: {
    ROLE: 'user',
    STATUS: 'active',
    IS_VERIFIED: true,
    IS_ACTIVE: true,
  },
} as const;

// API 응답 관련 상수
export const API_CONSTANTS = {
  RESPONSE_MESSAGES: {
    SUCCESS: '성공',
    FAILURE: '실패',
    UNAUTHORIZED: '인증이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    NOT_FOUND: '리소스를 찾을 수 없습니다.',
    VALIDATION_ERROR: '입력값이 올바르지 않습니다.',
    INTERNAL_ERROR: '서버 내부 오류가 발생했습니다.',
  },

  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;

// 환경 변수 키
export const ENV_KEYS = {
  JWT: {
    SECRET: 'JWT_SECRET',
    EXPIRES_IN: 'JWT_EXPIRES_IN',
    REFRESH_EXPIRES_IN: 'JWT_REFRESH_EXPIRES_IN',
  },

  GOOGLE: {
    CLIENT_ID: 'GOOGLE_CLIENT_ID',
    CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
    WEB_CLIENT_ID: 'GOOGLE_WEB_CLIENT_ID',
  },

  DATABASE: {
    HOST: 'DB_HOST',
    PORT: 'DB_PORT',
    USERNAME: 'DB_USERNAME',
    PASSWORD: 'DB_PASSWORD',
    DATABASE: 'DB_DATABASE',
    LOGGING: 'DB_LOGGING',
  },

  APP: {
    PORT: 'PORT',
    NODE_ENV: 'NODE_ENV',
    API_PREFIX: 'API_PREFIX',
  },
} as const;
