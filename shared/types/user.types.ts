/**
 * 사용자 관련 공통 타입
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */

/**
 * 사용자 정보
 */
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;

  // 인증
  authProvider: 'google';
  providerId: string;

  // 상태
  isActive: boolean;
  isVerified: boolean;
  role: 'user' | 'admin' | 'premium';

  // 통계
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number; // %
  totalWinnings: number;
  totalLosses: number;
  roi: number; // %

  // 알림 토큰
  deviceToken?: string;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * 사용자 프로필 (간단한 버전)
 */
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  role: string;
}

/**
 * 사용자 통계
 */
export interface UserStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  roi: number;
}

/**
 * 사용자 등록 요청
 */
export interface RegisterUserRequest {
  email: string;
  nickname: string;
  authProvider: 'google';
  providerId: string;
  avatar?: string;
}

/**
 * 사용자 업데이트 요청
 */
export interface UpdateUserRequest {
  nickname?: string;
  avatar?: string;
  deviceToken?: string;
}
