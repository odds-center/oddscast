import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * API 클라이언트 생성
 */
export const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || API_BASE_URL,
    timeout: 5000, // 5초로 단축 (빠른 실패)
    headers: {
      'Content-Type': 'application/json',
    },
    // HTTP/2 최적화
    maxRedirects: 5,
    maxContentLength: 50 * 1000 * 1000, // 50MB
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    async (config) => {
      // Admin 토큰 추가 (필요시)
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (error.response?.status === 401) {
        const isAuthRequest =
          error.config?.url?.includes('/auth') || error.config?.url?.includes('/login');

        if (!isAuthRequest) {
          console.log('🚫 401 Unauthorized - Redirecting to login');
          localStorage.removeItem('admin_token');

          // 브라우저 환경에서만 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// 기본 API 클라이언트
export const axiosInstance = createApiClient();

/**
 * API 응답 래퍼 함수
 */
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

/**
 * API 에러 처리 함수
 */
export const handleApiError = (error: any): never => {
  if (error.response) {
    const apiError = {
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
