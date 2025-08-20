// 타입 정의 통합 내보내기

// API 관련 타입
export * from './api';

// 경마 관련 타입
export * from './race';

// 사용자 관련 타입
export * from './user';

// 공통 타입들
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// 환경 설정 타입
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  KRA_API_KEY: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string[];
}

// 로깅 타입
export interface LogLevel {
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}
