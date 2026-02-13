import { axiosInstance } from '../utils/axios';
import { handleApiResponse } from '../utils/axios';

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    loginId: string;
    name: string;
    role: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<{ data?: LoginResponse } | LoginResponse>(
      '/auth/login',
      data
    );
    const raw = response.data as { data?: LoginResponse } | LoginResponse;
    const payload = (raw as { data?: LoginResponse })?.data ?? (raw as LoginResponse);

    if (payload?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken || '');
      document.cookie = `accessToken=${payload.accessToken}; path=/; max-age=86400`;
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
    const response = await axiosInstance.post<LoginResponse>('/auth/refresh', { refreshToken });
    const raw = response.data as { data?: LoginResponse } | LoginResponse;
    const payload = (raw as { data?: LoginResponse })?.data ?? (raw as LoginResponse);
    return payload;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me');
    return handleApiResponse(response);
  },
};
