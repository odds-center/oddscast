/**
 * API type — synchronized with @goldenrace/shared
 * @see @goldenrace/shared
 */
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ErrorCode,
} from '@goldenrace/shared';

// Common types (not redefined in other files)
// BetStatistics is defined in bet.ts

// Re-export types exported from other type files
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
