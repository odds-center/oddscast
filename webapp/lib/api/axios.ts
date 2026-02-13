import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CONFIG from '../config';
import { emitUnauthorized } from '@/lib/authEvents';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: CONFIG.api.server.baseURL,
  timeout: CONFIG.api.server.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — JWT 항상 헤더에 포함
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

// Response Interceptor — 401 시 로그아웃 이벤트 (authStore에서 수신)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export const handleApiResponse = <T>(response: AxiosResponse<any>): T => {
  return response.data?.data ?? response.data;
};

export const handleApiError = (error: any): never => {
  if (error.response) {
    throw {
      status: error.response.status,
      message: error.response.data?.message || '서버 오류가 발생했습니다.',
    };
  }
  throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
};
