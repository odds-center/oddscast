// 사용자 관련 타입 정의

// 사용자 기본 정보
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// 사용자 설정
export interface UserPreferences {
  favoriteVenues: string[];
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  timezone: string;
}

// 즐겨찾기
export interface Favorite {
  id: string;
  userId: string;
  raceId: string;
  createdAt: string;
}

// 알림
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'race' | 'result' | 'system';
  read: boolean;
  createdAt: string;
}

// 인증 관련
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}
