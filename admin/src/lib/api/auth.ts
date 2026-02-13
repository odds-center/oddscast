import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<{ data?: LoginResponse } & LoginResponse>(
      '/api/auth/admin/login',
      data
    );
    // NestJS ResponseInterceptor 래핑 { data, status } 처리
    const payload = (response as any)?.data ?? response;

    // 토큰 저장
    if (payload?.accessToken) {
      apiClient.setToken(payload.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', payload.refreshToken || '');
        document.cookie = `accessToken=${payload.accessToken}; path=/; max-age=86400`;
      }
    }

    return payload;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('admin_token');
      document.cookie = 'accessToken=; path=/; max-age=0';
    }
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/api/auth/refresh', { refreshToken });
  },

  getProfile: async () => {
    return apiClient.get('/api/auth/me');
  },
};
