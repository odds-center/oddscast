import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// Admin 전용 API Base URL — /api/admin prefix
const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/admin';

/**
 * API 클라이언트 생성
 */
export const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || ADMIN_API_URL,
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
      // Admin 토큰 추가 (SSR 시 localStorage 없음 방어)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('admin_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
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

        if (!isAuthRequest && typeof window !== 'undefined') {
          console.log('🚫 401 Unauthorized - Redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('admin_token');
          window.location.href = '/login';
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
 * NestJS ResponseInterceptor 형식 { data, status } 언래핑
 */
export const handleApiResponse = <T>(response: AxiosResponse<unknown>): T => {
  const body = response.data as { data?: T; status?: number } | T;
  if (body && typeof body === 'object' && 'data' in body && 'status' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
};

/**
 * API 에러 처리 함수
 */
export const handleApiError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as AxiosError<{ message?: string; errors?: unknown }>;
    const res = axiosErr.response;
    if (res) {
      const data = res.data as { message?: string; errors?: unknown } | undefined;
      throw {
        status: res.status,
        message: data?.message ?? '서버 오류가 발생했습니다.',
        errors: data?.errors,
      };
    }
  }
  if (error && typeof error === 'object' && 'request' in error) {
    throw new Error('네트워크 연결을 확인해주세요.');
  }
  const msg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  throw new Error(msg);
};
