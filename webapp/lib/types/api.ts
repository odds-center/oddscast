/**
 * API 타입 — @goldenrace/shared와 동기화
 * @see @goldenrace/shared
 */
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ErrorCode,
} from '@goldenrace/shared';

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
export type { Notification, NotificationPreferences } from './notification';
export type { PointTransactionType, UserPointBalance, UserPoints } from './point';
export type {
  DividendRate,
  EntryDetail,
  Race,
  RaceDetail,
  RaceFilters,
  RaceResult,
  RaceDto,
  RaceDetailDto,
  RaceEntryDto,
  RaceResultDto,
  DividendDto,
  RaceListResponseDto,
} from './race';
export type { User, UserProfile, UserStatistics } from './user';
