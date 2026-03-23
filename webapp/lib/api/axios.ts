import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import CONFIG from '../config';
import { emitUnauthorized } from '@/lib/authEvents';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __isRefreshRequest?: boolean;
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

// --- Token refresh state (shared across interceptor calls) ---
let isRefreshing = false;
let refreshSubscribers: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((s) => s.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach((s) => s.reject(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(resolve: (token: string) => void, reject: (err: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

/**
 * Attempt silent token refresh using stored refresh token.
 * Returns the new access token or null if refresh failed.
 */
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('jwt_refresh_token');
  const currentToken = localStorage.getItem('jwt_token');
  if (!currentToken) return null;

  try {
    // Use the current (possibly expired) access token to call refresh endpoint.
    // Server refresh endpoint verifies JWT identity (sub, email, role) and issues new tokens.
    // If the access token is expired but refresh token is still valid, server should still accept.
    const res = await axios.post(
      `${CONFIG.api.server.baseURL}/auth/refresh`,
      refreshToken ? { refreshToken } : undefined,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      },
    );

    const data = res.data?.data ?? res.data;
    const newAccessToken = data?.accessToken;
    const newRefreshToken = data?.refreshToken;

    if (newAccessToken) {
      // Update storage + axios default header
      localStorage.setItem('jwt_token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('jwt_refresh_token', newRefreshToken);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

      // Notify authStore (lazy import to avoid circular dependency)
      try {
        const { useAuthStore } = await import('@/lib/store/authStore');
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
      } catch {
        // Store not available during SSR
      }

      return newAccessToken;
    }
  } catch {
    // Refresh failed — token is truly expired
  }
  return null;
}

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

// Response Interceptor — auto-refresh on 401, auto-retry on network/server errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    if (!config) return Promise.reject(error);

    // 401 Unauthorized — attempt silent token refresh before logout
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Don't retry refresh requests themselves
      if (config.__isRefreshRequest) {
        emitUnauthorized();
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(config);
        } else {
          // Refresh failed — reject all queued requests and logout
          onRefreshFailed(error);
          emitUnauthorized();
          return Promise.reject(error);
        }
      }

      // Another request hit 401 while refresh is in progress — queue it
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(
          (token: string) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(config));
          },
          (err: unknown) => {
            reject(err);
          },
        );
      });
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
