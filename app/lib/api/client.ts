import axios from 'axios';
import Constants from 'expo-constants';
import { getApiConfig, validateApiKeys } from '@/config/api';

// API 키 유효성 검사
validateApiKeys();

// API 기본 설정
const apiConfig = getApiConfig();

// 개발 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configuredUrl) return configuredUrl;

  // 개발 환경 감지
  const isDevelopment = __DEV__;
  if (isDevelopment) {
    // Android 에뮬레이터용
    return 'http://10.0.2.2:3002';
  }

  return apiConfig.server.baseURL;
};

const API_BASE_URL = getApiBaseUrl();

// API 클라이언트 생성
export const apiClient = axios.create({
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
