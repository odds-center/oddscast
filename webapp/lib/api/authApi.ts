import { ApiResponse } from '@/lib/types/api';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/types/auth';
import { User } from '@/lib/types/user';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockUser } from '@/lib/mocks/data';

export default class AuthApi {
  private static instance: AuthApi;
  private baseUrl = '/auth';

  private constructor() {}

  public static getInstance(): AuthApi {
    if (!AuthApi.instance) {
      AuthApi.instance = new AuthApi();
    }
    return AuthApi.instance;
  }

  // 정적 메서드들
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (CONFIG.useMock) {
      if (credentials.email === 'demo@goldenrace.com' && credentials.password === 'demo123') {
        return {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: mockUser as unknown as User,
        };
      }
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (CONFIG.useMock) {
      return {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: { ...mockUser, name: userData.name, nickname: userData.nickname } as unknown as User,
      };
    }
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        userData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async logout(): Promise<{ message: string }> {
    if (CONFIG.useMock) return { message: 'OK' };
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>('/auth/logout');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async googleLogin(idToken: string): Promise<AuthResponse> {
    if (CONFIG.useMock) {
      // Mock: 구글 로그인 시뮬레이션 — 신규/기존 구분 없이 mock 유저로 로그인
      const mockRes = {
        accessToken: 'mock-google-jwt-token',
        refreshToken: 'mock-google-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: {
          ...mockUser,
          email: 'google-demo@goldenrace.com',
          name: 'Google 사용자',
          nickname: 'Google 사용자',
        },
      } as unknown as AuthResponse;
      return mockRes;
    }
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/google',
        { idToken },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getCurrentUser(): Promise<User> {
    if (CONFIG.useMock) return mockUser as unknown as User;
    try {
      const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateProfile(updateData: Partial<User>): Promise<User> {
    if (CONFIG.useMock) return { ...mockUser, ...updateData } as unknown as User;
    try {
      const response = await axiosInstance.put<ApiResponse<User>>('/auth/profile', updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async changePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.put<ApiResponse<{ message: string }>>(
        '/auth/password',
        passwordData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/forgot-password',
        { email },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async resetPassword(resetData: {
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/reset-password',
        resetData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/verify-email',
        { token },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/resend-verification',
        { email },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async loginInstance(credentials: LoginRequest): Promise<AuthResponse> {
    return AuthApi.login(credentials);
  }

  async registerInstance(userData: RegisterRequest): Promise<AuthResponse> {
    return AuthApi.register(userData);
  }

  async logoutInstance(): Promise<{ message: string }> {
    return AuthApi.logout();
  }

  async refreshTokenInstance(): Promise<AuthResponse> {
    return AuthApi.refreshToken();
  }

  async getCurrentUserInstance(): Promise<User> {
    return AuthApi.getCurrentUser();
  }

  async updateProfileInstance(updateData: Partial<User>): Promise<User> {
    return AuthApi.updateProfile(updateData);
  }

  async changePasswordInstance(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return AuthApi.changePassword(passwordData);
  }

  async forgotPasswordInstance(email: string): Promise<{ message: string }> {
    return AuthApi.forgotPassword(email);
  }

  async resetPasswordInstance(resetData: {
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return AuthApi.resetPassword(resetData);
  }

  async verifyEmailInstance(token: string): Promise<{ message: string }> {
    return AuthApi.verifyEmail(token);
  }

  async resendVerificationEmailInstance(email: string): Promise<{ message: string }> {
    return AuthApi.resendVerificationEmail(email);
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
// 싱글톤 인스턴스 export (기존 호환성 유지)
// export const authApi = AuthApi.getInstance();
