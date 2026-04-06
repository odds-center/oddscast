import { ApiResponse } from '@/lib/types/api';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerificationRequiredResponse,
  VerifyEmailResponse,
} from '@/lib/types/auth';
import { User } from '@/lib/types/user';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

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

  // Static methods
  static async login(credentials: LoginRequest): Promise<AuthResponse | VerificationRequiredResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse | VerificationRequiredResponse>>(
        '/auth/login',
        credentials,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse | VerificationRequiredResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse | VerificationRequiredResponse>>(
        '/auth/register',
        userData,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async logout(): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>('/auth/logout');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Fetch the current user profile using an explicit token.
   * Used by the Kakao OAuth success page before the token is stored in axios defaults.
   */
  static async getMe(token: string): Promise<User> {
    try {
      const response = await axiosInstance.get<ApiResponse<User>>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateProfile(updateData: Partial<User>): Promise<User> {
    try {
      const response = await axiosInstance.put<ApiResponse<User>>('/auth/profile', updateData);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/forgot-password',
        { email },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<VerifyEmailResponse>>(
        '/auth/verify-email',
        { token },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        '/auth/resend-verification',
        { email },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** Delete account (requires password). Server deactivates user. */
  static async deleteAccount(password: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        '/auth/account',
        { data: { password } },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

}
