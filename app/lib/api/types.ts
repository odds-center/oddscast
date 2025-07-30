// API 공통 타입 정의

// 기본 API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    limit: number;
    offset: number;
    count: number;
  };
}

// 경마 관련 타입
export interface Race {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  raceNumber: number;
  horses: Horse[];
}

export interface Horse {
  id: string;
  horseName: string;
  jockey: string;
  trainer: string;
  predictionRate: number;
  gateNumber: number;
}

// 경마 결과 관련 타입
export interface RaceResult {
  id: string;
  raceId: string;
  finishOrder: number;
  horseId: string;
  horseName: string;
  jockey: string;
  trainer: string;
  finishTime: string;
  margin: string;
  odds: number;
  prize: number;
}

// 경마 계획 관련 타입
export interface RacePlan {
  id: string;
  raceId: string;
  planName: string;
  description: string;
  horses: string[];
  createdAt: string;
  updatedAt: string;
}

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  favoriteVenues: string[];
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// 즐겨찾기 관련 타입
export interface Favorite {
  id: string;
  userId: string;
  raceId: string;
  createdAt: string;
}

// 알림 관련 타입
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'race' | 'result' | 'system';
  read: boolean;
  createdAt: string;
}
