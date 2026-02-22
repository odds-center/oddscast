import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import CONFIG from '../config';
import { emitUnauthorized } from '@/lib/authEvents';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

function isNetworkError(error: AxiosError): boolean {
  return (
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      error.message.includes('timeout'))
  );
}

function isRetryableServerError(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 502 || status === 503 || status === 504;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: CONFIG.api.server.baseURL,
  timeout: CONFIG.api.server.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — JWT always included in header
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor — auto-retry on network/server errors + 401 logout
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    if (!config) return Promise.reject(error);

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      emitUnauthorized();
      return Promise.reject(error);
    }

    const shouldRetry = isNetworkError(error) || isRetryableServerError(error);
    const retryCount = config.__retryCount ?? 0;

    if (shouldRetry && retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1;
      const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
      await delay(backoff);
      return axiosInstance(config);
    }

    return Promise.reject(error);
  },
);

export const handleApiResponse = <T>(response: AxiosResponse<unknown>): T => {
  const data = response.data as Record<string, unknown> | T;
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
};

export const handleApiError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = (axiosErr.response as { status?: number })?.status;
    const message = (axiosErr.response?.data as { message?: string })?.message ?? '서버 오류가 발생했습니다.';
    throw { status, message };
  }
  const msg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  throw new Error(msg);
};
