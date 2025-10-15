/**
 * 공통 타입 Export
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */

// Prediction
export * from './prediction.types';

// Race
export * from './race.types';

// User
export * from './user.types';

// Bet
export * from './bet.types';

// Subscription
export * from './subscription.types';

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: import('./user.types').User;
  tokens: AuthTokens;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 에러 코드
export enum ErrorCode {
  // 인증
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // 예측권
  TICKET_REQUIRED = 'TICKET_REQUIRED',
  INSUFFICIENT_TICKETS = 'INSUFFICIENT_TICKETS',

  // 예측
  PREDICTION_NOT_FOUND = 'PREDICTION_NOT_FOUND',
  PREDICTION_GENERATING = 'PREDICTION_GENERATING',
  PREDICTION_FAILED = 'PREDICTION_FAILED',

  // 경주
  RACE_NOT_FOUND = 'RACE_NOT_FOUND',
  RACE_ALREADY_STARTED = 'RACE_ALREADY_STARTED',

  // 일반
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
