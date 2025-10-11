import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/admin/login', data);

    // 토큰 저장
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.refreshToken);
        // 쿠키에도 저장 (미들웨어용)
        document.cookie = `accessToken=${response.accessToken}; path=/; max-age=86400`;
      }
    }

    return response;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0';
    }
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/api/admin/refresh', { refreshToken });
  },

  getProfile: async () => {
    return apiClient.get('/api/admin/profile');
  },
};
