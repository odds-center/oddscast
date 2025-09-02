import { ApiResponse } from '@/lib/types/api';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserAchievement,
  UserActivity,
  UserFilters,
  UserListResponse,
  UserNotification,
  UserPreferences,
  UserProfile,
  UserSearchFilters,
  UserSearchResponse,
  UserStatistics,
} from '@/lib/types/user';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';
import qs from 'qs';

export class UserApi {
  private static instance: UserApi;
  private baseUrl = '/users';

  private constructor() {}

  public static getInstance(): UserApi {
    if (!UserApi.instance) {
      UserApi.instance = new UserApi();
    }
    return UserApi.instance;
  }

  // 정적 메서드들
  static async getUsers(filters?: UserFilters): Promise<UserListResponse> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<ApiResponse<UserListResponse>>(
        `/users?${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUser(userId: string): Promise<User> {
    try {
      const response = await axiosInstance.get<ApiResponse<User>>(`/users/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await axiosInstance.post<ApiResponse<User>>('/users', userData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<User> {
    try {
      const response = await axiosInstance.put<ApiResponse<User>>(`/users/${userId}`, updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `/users/${userId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserProfile>>(
        `/users/${userId}/profile`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateUserProfile(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<UserProfile> {
    try {
      const response = await axiosInstance.put<ApiResponse<UserProfile>>(
        `/users/${userId}/profile`,
        updateData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserStatistics(userId: string): Promise<UserStatistics> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserStatistics>>(
        `/users/${userId}/statistics`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserAchievement[]>>(
        `/users/${userId}/achievements`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async searchUsers(
    query: string,
    filters?: Omit<UserSearchFilters, 'query'>
  ): Promise<UserSearchResponse> {
    try {
      const searchParams = { query, ...filters };
      const queryString = qs.stringify(searchParams, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<ApiResponse<UserSearchResponse>>(
        `/users/search?${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserActivities(
    userId: string,
    filters?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }
  ): Promise<{ activities: UserActivity[]; total: number; page: number; totalPages: number }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<
        ApiResponse<{
          activities: UserActivity[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/users/${userId}/activities?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserNotifications(
    userId: string,
    filters?: { isRead?: boolean; page?: number; limit?: number }
  ): Promise<{
    notifications: UserNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<
        ApiResponse<{
          notifications: UserNotification[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/users/${userId}/notifications?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserPreferences>>(
        `/users/${userId}/preferences`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const response = await axiosInstance.put<ApiResponse<UserPreferences>>(
        `/users/${userId}/preferences`,
        preferences
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async getUsersInstance(filters?: UserFilters): Promise<UserListResponse> {
    return UserApi.getUsers(filters);
  }

  async getUserInstance(userId: string): Promise<User> {
    return UserApi.getUser(userId);
  }

  async createUserInstance(userData: CreateUserRequest): Promise<User> {
    return UserApi.createUser(userData);
  }

  async updateUserInstance(userId: string, updateData: UpdateUserRequest): Promise<User> {
    return UserApi.updateUser(userId, updateData);
  }

  async deleteUserInstance(userId: string): Promise<{ message: string }> {
    return UserApi.deleteUser(userId);
  }

  async getUserProfileInstance(userId: string): Promise<UserProfile> {
    return UserApi.getUserProfile(userId);
  }

  async updateUserProfileInstance(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<UserProfile> {
    return UserApi.updateUserProfile(userId, updateData);
  }

  async getUserStatisticsInstance(userId: string): Promise<UserStatistics> {
    return UserApi.getUserStatistics(userId);
  }

  async getUserAchievementsInstance(userId: string): Promise<UserAchievement[]> {
    return UserApi.getUserAchievements(userId);
  }

  async searchUsersInstance(
    query: string,
    filters?: Omit<UserSearchFilters, 'query'>
  ): Promise<UserSearchResponse> {
    return UserApi.searchUsers(query, filters);
  }

  async getUserActivitiesInstance(
    userId: string,
    filters?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }
  ): Promise<{ activities: UserActivity[]; total: number; page: number; totalPages: number }> {
    return UserApi.getUserActivities(userId, filters);
  }

  async getUserNotificationsInstance(
    userId: string,
    filters?: { isRead?: boolean; page?: number; limit?: number }
  ): Promise<{
    notifications: UserNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return UserApi.getUserNotifications(userId, filters);
  }

  async getUserPreferencesInstance(userId: string): Promise<UserPreferences> {
    return UserApi.getUserPreferences(userId);
  }

  async updateUserPreferencesInstance(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return UserApi.updateUserPreferences(userId, preferences);
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
export const userApi = UserApi.getInstance();
