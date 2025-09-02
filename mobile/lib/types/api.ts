// 공통 API 응답 타입들
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API 에러 타입
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// 공통 타입들 (다른 파일에서 재정의되지 않는 것들)
// BetStatistics는 bet.ts에서 정의됨

// 다른 타입 파일들에서 export하는 타입들을 re-export
export type { AuthResponse, LoginRequest, RegisterRequest } from './auth';
export type {
  Bet,
  BetFilters,
  BetResult,
  BetStatistics,
  BetStatus,
  BetType,
  CreateBetRequest,
  UpdateBetRequest,
} from './bet';
export type {
  CreateFavoriteRequest,
  Favorite,
  FavoriteFilters,
  UpdateFavoriteRequest,
} from './favorite';
export type { Notification, NotificationPreferences } from './notification';
export type { PointTransactionType, UserPointBalance, UserPoints } from './point';
export type { DividendRate, EntryDetail, Race, RaceDetail, RaceFilters, RaceResult } from './race';
export type { User, UserProfile, UserStatistics } from './user';
