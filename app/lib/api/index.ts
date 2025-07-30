// API 모듈 통합 내보내기
import { racesApi } from './races';
import { resultsApi } from './results';
import { usersApi } from './users';
import { favoritesApi } from './favorites';
import { notificationsApi } from './notifications';

// 경마 관련 API
export { racesApi } from './races';
export type { Race, Horse } from './types';

// 경마 결과 관련 API
export { resultsApi } from './results';
export type { RaceResult } from './types';

// 사용자 관련 API
export { usersApi } from './users';
export type { User, UserPreferences } from './types';

// 즐겨찾기 관련 API
export { favoritesApi } from './favorites';
export type { Favorite } from './types';

// 알림 관련 API
export { notificationsApi } from './notifications';
export type { Notification } from './types';

// KRA API는 서버를 통해 프록시로 호출됩니다

// 공통 타입
export type { ApiResponse } from './types';

// API 클라이언트
export { apiClient } from './client';

// 통합 API 객체 (편의를 위해)
export const api = {
  races: racesApi,
  results: resultsApi,
  users: usersApi,
  favorites: favoritesApi,
  notifications: notificationsApi,
  // KRA API는 서버를 통해 프록시로 호출됩니다
};

export default api;
