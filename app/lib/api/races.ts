import { apiClient } from './client';
import { Race, ApiResponse } from './types';

// 경마 관련 API 함수들
export const racesApi = {
  // 경마 일정 조회
  getRaces: async (params?: {
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<Race[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Race[]>>('/api/races', {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch races:', error);
      throw error;
    }
  },

  // 특정 경마 상세 정보 조회
  getRaceById: async (raceId: string): Promise<Race> => {
    try {
      const response = await apiClient.get<ApiResponse<Race>>(`/api/races/${raceId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch race by id:', error);
      throw error;
    }
  },

  // 지역별 경마 조회
  getRacesByVenue: async (
    venue: string,
    params?: {
      date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Race[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Race[]>>(`/api/races/venue/${venue}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch races by venue:', error);
      throw error;
    }
  },

  // 날짜별 경마 조회
  getRacesByDate: async (
    date: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Race[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Race[]>>(`/api/races/date/${date}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch races by date:', error);
      throw error;
    }
  },

  // KRA API 직접 호출 (서버를 통해)
  getKRARaceRecords: async (params?: {
    date?: string;
    venue?: string;
    pageNo?: number;
    numOfRows?: number;
  }) => {
    try {
      const response = await apiClient.get('/api/kra/records', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch KRA race records:', error);
      throw error;
    }
  },

  // KRA 경주계획표 조회 (서버를 통해)
  getKRARacePlans: async (params?: {
    year?: string;
    month?: string;
    day?: string;
    venue?: string;
    pageNo?: number;
    numOfRows?: number;
  }) => {
    try {
      const response = await apiClient.get('/api/kra/plans', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch KRA race plans:', error);
      throw error;
    }
  },
};

export default racesApi;
