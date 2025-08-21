import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getCurrentConfig } from '../../config/environment';
import { tokenManager } from './tokenManager';

import { ApiResponse, ApiError } from '../types/api';

// API 기본 설정
const config = getCurrentConfig();
const API_BASE_URL = `${config.api.server.baseURL}/api`;

// API 클라이언트 생성
export const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || API_BASE_URL,
    timeout: config.api.server.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    async (config) => {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);

      // 토큰이 있으면 헤더에 추가
      try {
        const token = await tokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Authorization header added:', token.substring(0, 30) + '...');
        } else {
          console.log('⚠️  No token available for request');
        }
      } catch (error) {
        console.error('❌ Token retrieval error:', error);
      }

      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    async (error) => {
      console.error('API Response Error:', error.response?.data || error.message);

      // 401 에러 시 토큰 제거 (하지만 무한 루프 방지)
      if (error.response?.status === 401) {
        try {
          // 현재 요청이 인증이 필요한 요청인지 확인
          const isAuthRequest =
            error.config?.url?.includes('/auth') ||
            error.config?.url?.includes('/login') ||
            error.config?.url?.includes('/signin');

          if (!isAuthRequest) {
            console.log('401 error on protected route, removing token');
            await tokenManager.removeToken();

            // 토큰 상태 로그
            tokenManager.logTokenStatus();
          } else {
            console.log('401 error on auth route, not removing token');
          }
        } catch (storageError) {
          console.error('Token removal error:', storageError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// 기본 API 클라이언트
export const apiClient = createApiClient();

// 토큰 관리 함수들 (기존 호환성을 위해 유지)
export const getStoredToken = async (): Promise<string | null> => {
  return await tokenManager.getToken();
};

export const setStoredToken = async (token: string): Promise<void> => {
  // 단일 토큰만 설정하는 경우, 임시 사용자 객체 생성
  const currentUser = await tokenManager.getUser();
  await tokenManager.setToken({
    accessToken: token,
    user: currentUser || { id: 'temp', email: 'temp@example.com' },
  });
};

export const removeStoredToken = async (): Promise<void> => {
  await tokenManager.removeToken();
};

// API 요청 기본 설정
export const defaultRequestConfig: AxiosRequestConfig = {
  timeout: 10000,
};

// API 응답 래퍼 함수
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'API 요청 실패');
};

// API 에러 처리 함수
export const handleApiError = (error: any): never => {
  if (error.response) {
    const apiError: ApiError = {
      status: error.response.status,
      message: error.response.data?.message || '서버 오류가 발생했습니다.',
      errors: error.response.data?.errors,
    };
    throw apiError;
  }

  if (error.request) {
    throw new Error('네트워크 연결을 확인해주세요.');
  }

  throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
};
