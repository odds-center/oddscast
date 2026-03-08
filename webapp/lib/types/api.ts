/**
 * API type — synchronized with @oddscast/shared
 * @see @oddscast/shared
 */
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ErrorCode,
} from '@oddscast/shared';

// Re-export types exported from other type files
export type { AuthResponse, LoginRequest, RegisterRequest } from './auth';
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
