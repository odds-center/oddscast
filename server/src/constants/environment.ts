/**
 * 애플리케이션 환경 설정
 */

export const APP_ENV = {
  DEVELOPMENT: 'development',
  LOCAL: 'local',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export type AppEnvironment = (typeof APP_ENV)[keyof typeof APP_ENV];

// 현재 환경
export const CURRENT_ENV = (process.env['NODE_ENV'] ||
  APP_ENV.DEVELOPMENT) as AppEnvironment;

// 환경별 설정
export const ENV_CONFIG = {
  [APP_ENV.DEVELOPMENT]: {
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:19006',
      'http://localhost:8081',
      'exp://localhost:19000',
    ] as string[],
    logLevel: 'debug',
    rateLimitMaxRequests: 1000,
    dbPoolSize: 5,
    enableMetrics: false,
    enableCompression: false,
  },
  [APP_ENV.LOCAL]: {
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:19006',
      'http://localhost:8081',
      'exp://localhost:19000',
    ] as string[],
    logLevel: 'debug',
    rateLimitMaxRequests: 1000,
    dbPoolSize: 5,
    enableMetrics: false,
    enableCompression: false,
  },
  [APP_ENV.STAGING]: {
    corsOrigins: [
      'https://staging.goldenrace.com',
      'https://staging-app.goldenrace.com',
      'https://staging-api.goldenrace.com',
    ] as string[],
    logLevel: 'info',
    rateLimitMaxRequests: 500,
    dbPoolSize: 10,
    enableMetrics: true,
    enableCompression: true,
  },
  [APP_ENV.PRODUCTION]: {
    corsOrigins: [
      'https://goldenrace.com',
      'https://app.goldenrace.com',
      'https://api.goldenrace.com',
      'https://www.goldenrace.com',
    ] as string[],
    logLevel: 'warn',
    rateLimitMaxRequests: 200,
    dbPoolSize: 20,
    enableMetrics: true,
    enableCompression: true,
  },
} as const;

// 현재 환경 설정
export const CURRENT_CONFIG = ENV_CONFIG[CURRENT_ENV];

// 환경 확인 유틸리티 함수들
export const isDevelopment = () => CURRENT_ENV === APP_ENV.DEVELOPMENT;
export const isLocal = () => CURRENT_ENV === APP_ENV.LOCAL;
export const isStaging = () => CURRENT_ENV === APP_ENV.STAGING;
export const isProduction = () => CURRENT_ENV === APP_ENV.PRODUCTION;

// 환경별 로그 메시지
export const getEnvironmentInfo = () => ({
  environment: CURRENT_ENV,
  corsOrigins: CURRENT_CONFIG.corsOrigins,
  logLevel: CURRENT_CONFIG.logLevel,
  rateLimitMaxRequests: CURRENT_CONFIG.rateLimitMaxRequests,
  dbPoolSize: CURRENT_CONFIG.dbPoolSize,
  enableMetrics: CURRENT_CONFIG.enableMetrics,
  enableCompression: CURRENT_CONFIG.enableCompression,
});
