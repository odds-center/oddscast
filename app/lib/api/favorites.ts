import { apiClient } from './client';
import { Favorite, ApiResponse } from './types';

// 즐겨찾기 관련 API 함수들
export const favoritesApi = {
  // 즐겨찾기 목록 조회
  getFavorites: async (params?: { limit?: number; offset?: number }): Promise<Favorite[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Favorite[]>>('/api/favorites', {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      throw error;
    }
  },

  // 경마 즐겨찾기 추가
  addFavorite: async (raceId: string): Promise<Favorite> => {
    try {
      const response = await apiClient.post<ApiResponse<Favorite>>('/api/favorites', {
        raceId,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // 즐겨찾기 삭제
  removeFavorite: async (favoriteId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/favorites/${favoriteId}`);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  },

  // 경마 ID로 즐겨찾기 삭제
  removeFavoriteByRaceId: async (raceId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/favorites/race/${raceId}`);
    } catch (error) {
      console.error('Failed to remove favorite by race id:', error);
      throw error;
    }
  },

  // 즐겨찾기 여부 확인
  checkFavorite: async (raceId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get<ApiResponse<{ isFavorite: boolean }>>(
        `/api/favorites/check/${raceId}`
      );
      return response.data.data.isFavorite;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  },
};

export default favoritesApi;
