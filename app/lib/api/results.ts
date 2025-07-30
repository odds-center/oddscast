import { apiClient } from './client';
import { RaceResult, ApiResponse } from './types';

// 경마 결과 관련 API 함수들
export const resultsApi = {
  // 경마 결과 조회
  getResults: async (params?: {
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<RaceResult[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>('/api/results', {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch results:', error);
      throw error;
    }
  },

  // 특정 경마 결과 조회
  getResultsByRaceId: async (raceId: string): Promise<RaceResult[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>(
        `/api/results/race/${raceId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch results by race id:', error);
      throw error;
    }
  },

  // 날짜별 결과 조회
  getResultsByDate: async (
    date: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<RaceResult[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>(`/api/results/date/${date}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch results by date:', error);
      throw error;
    }
  },

  // 지역별 결과 조회
  getResultsByVenue: async (
    venue: string,
    params?: {
      date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<RaceResult[]> => {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>(
        `/api/results/venue/${venue}`,
        {
          params,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch results by venue:', error);
      throw error;
    }
  },
};

export default resultsApi;
