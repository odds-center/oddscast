import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import CONFIG from '../config';
import { emitUnauthorized } from '@/lib/authEvents';

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

// Response Interceptor — 401 logout event (received in authStore)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      emitUnauthorized();
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
