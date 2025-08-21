import { apiClient, handleApiResponse, handleApiError } from '@/lib/utils/axios';
import { ApiResponse } from '@/lib/types/api';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/lib/types/auth';
import { User } from '@/lib/types/user';

export class AuthApi {
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
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', userData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async logout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateProfile(updateData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/auth/profile', updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        '/auth/password',
        passwordData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/forgot-password',
        { email }
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
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/reset-password',
        resetData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/verify-email',
        { token }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/resend-verification',
        { email }
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
    currentPassword: string;
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
export const authApi = AuthApi.getInstance();
