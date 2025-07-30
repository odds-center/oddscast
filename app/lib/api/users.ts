import { apiClient } from './client';
import { User, UserPreferences, ApiResponse } from './types';

// 사용자 관련 API 함수들
export const usersApi = {
  // 사용자 프로필 조회
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/api/users/profile');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // 사용자 프로필 업데이트
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/api/users/profile', profileData);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  },

  // 사용자 설정 조회
  getPreferences: async (): Promise<UserPreferences> => {
    try {
      const response = await apiClient.get<ApiResponse<UserPreferences>>('/api/users/preferences');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      throw error;
    }
  },

  // 사용자 설정 업데이트
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    try {
      const response = await apiClient.put<ApiResponse<UserPreferences>>(
        '/api/users/preferences',
        preferences
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  },

  // 사용자 삭제
  deleteAccount: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/users/account');
    } catch (error) {
      console.error('Failed to delete user account:', error);
      throw error;
    }
  },
};

export default usersApi;
