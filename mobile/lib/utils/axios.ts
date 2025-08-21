import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { ApiResponse, ApiError } from '../types/api';

// API 기본 설정

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl;

// JWT 토큰 키
const JWT_TOKEN_NAME = 'jwt_token';

// API 클라이언트 생성
export const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    async (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

      // 토큰이 있으면 헤더에 추가
      try {
        const token = await AsyncStorage.getItem(JWT_TOKEN_NAME);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Token retrieval error:', error);
      }

      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
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

      // 401 에러 시 토큰 제거
      if (error.response?.status === 401) {
        try {
          await AsyncStorage.removeItem(JWT_TOKEN_NAME);
          console.log('Token removed due to 401 error');
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

// 토큰 관리 함수들
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(JWT_TOKEN_NAME);
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_TOKEN_NAME, token);
  } catch (error) {
    console.error('Error setting stored token:', error);
  }
};

export const removeStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(JWT_TOKEN_NAME);
  } catch (error) {
    console.error('Error removing stored token:', error);
  }
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
