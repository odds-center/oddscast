import axios from 'axios';
import Constants from 'expo-constants';
import { getCurrentConfig } from '@/config/environment';

// API 기본 설정 - 환경별로 올바른 URL 사용
const getApiBaseUrl = () => {
  // 1. 환경변수 우선
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // 2. 환경 설정에서 가져오기
  const config = getCurrentConfig();
  return config.api.server.baseURL;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

// 인증 토큰 관리
let authToken: string | null = null;

// 토큰 설정 함수
export const setAuthToken = (token: string) => {
  authToken = token;
};

// 토큰 제거 함수
export const clearAuthToken = () => {
  authToken = null;
};

// 간단한 인증 API 클라이언트 생성
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
authClient.interceptors.request.use(
  (config) => {
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
authClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 자동 로그아웃
      authToken = null;
      // 로그인 페이지로 리다이렉트 로직 추가 가능
    }
    return Promise.reject(error);
  }
);

// 인증 관련 타입 정의
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  photo?: string;
  locale?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  googleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 인증 서비스
export const authService = {
  // 토큰 설정
  setToken: (token: string) => {
    authToken = token;
  },

  // 토큰 가져오기
  getToken: () => {
    return authToken;
  },

  // 토큰 제거
  clearToken: () => {
    authToken = null;
  },

  // Google ID 토큰으로 로그인 - 새로운 통합 API 클라이언트 사용
  signInWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting Google sign-in with token:', idToken.substring(0, 20) + '...');
      console.log('API endpoint:', `${API_BASE_URL}/api/auth/google/login`);

      // 새로운 통합 API 클라이언트 사용
      const response = await authClient.post<AuthResponse>('/api/auth/google/login', {
        idToken,
      });

      const { access_token, user } = response.data;
      authService.setToken(access_token);

      console.log('Google sign-in successful:', user.email);
      return response.data;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      throw error;
    }
  },

  // 로그아웃
  signOut: async (): Promise<void> => {
    try {
      if (authToken) {
        await authClient.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      authService.clearToken();
    }
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await authClient.post<AuthResponse>('/api/auth/refresh', {
        refreshToken,
      });

      const { access_token, user } = response.data;
      authService.setToken(access_token);

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  // 현재 사용자 프로필 가져오기
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await authClient.get<User>('/api/users/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  // 사용자 정보 업데이트
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    try {
      const response = await authClient.put<User>(`/api/users/${updates.id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // 인증 상태 확인
  isAuthenticated: (): boolean => {
    return !!authToken;
  },

  // API 기본 URL 가져오기 (디버깅용)
  getApiBaseUrl: () => API_BASE_URL,
};

export default authService;
