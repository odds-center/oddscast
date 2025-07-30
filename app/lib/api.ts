import axios from 'axios';
import Constants from 'expo-constants';
import { getApiConfig, validateApiKeys } from '@/config/api';

// API 키 유효성 검사
validateApiKeys();

// API 기본 설정
const apiConfig = getApiConfig();
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || apiConfig.server.baseURL;

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API 타입 정의
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

// API 함수들
export const api = {
  // 경마 일정 조회
  getRaces: async (params?: {
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<Race[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Race[]>>('/api/races', {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch races:', error);
      throw error;
    }
  },

  // 경마 결과 조회
  getResults: async (params?: { date?: string; limit?: number; offset?: number }) => {
    try {
      const response = await apiClient.get('/api/results', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch results:', error);
      throw error;
    }
  },

  // 경마 계획 조회
  getRacePlans: async (params?: { date?: string; limit?: number; offset?: number }) => {
    try {
      const response = await apiClient.get('/api/race-plans', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch race plans:', error);
      throw error;
    }
  },

  // 서버 상태 확인
  getHealth: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      throw error;
    }
  },
};

export default api;
