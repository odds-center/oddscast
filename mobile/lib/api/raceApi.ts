import { apiClient, handleApiResponse, handleApiError } from '@/lib/utils/axios';
import { ApiResponse } from '@/lib/types/api';
import { Race, RaceFilters, RaceDetail, RaceResult, DividendRate } from '@/lib/types/race';

export class RaceApi {
  private static instance: RaceApi;
  private baseUrl = '/races';

  private constructor() {}

  public static getInstance(): RaceApi {
    if (!RaceApi.instance) {
      RaceApi.instance = new RaceApi();
    }
    return RaceApi.instance;
  }

  // 정적 메서드들
  static async getRaces(filters?: RaceFilters): Promise<{
    races: Race[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<
        ApiResponse<{
          races: Race[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/races?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRace(raceId: string): Promise<RaceDetail> {
    try {
      const response = await apiClient.get<ApiResponse<RaceDetail>>(`/races/${raceId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createRace(raceData: Partial<Race>): Promise<Race> {
    try {
      const response = await apiClient.post<ApiResponse<Race>>('/races', raceData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateRace(raceId: string, updateData: Partial<Race>): Promise<Race> {
    try {
      const response = await apiClient.put<ApiResponse<Race>>(`/races/${raceId}`, updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteRace(raceId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/races/${raceId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceResults(raceId: string): Promise<RaceResult[]> {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>(`/races/${raceId}/results`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateRaceResults(raceId: string, results: RaceResult[]): Promise<RaceResult[]> {
    try {
      const response = await apiClient.put<ApiResponse<RaceResult[]>>(`/races/${raceId}/results`, {
        results,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceDividends(raceId: string): Promise<DividendRate[]> {
    try {
      const response = await apiClient.get<ApiResponse<DividendRate[]>>(
        `/races/${raceId}/dividends`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceEntries(raceId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`/races/${raceId}/entries`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceStatistics(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);

      const response = await apiClient.get<ApiResponse<any>>(
        `/races/statistics?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceAnalysis(raceId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/races/${raceId}/analysis`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceSchedule(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);

      const response = await apiClient.get<ApiResponse<any[]>>(
        `/races/schedule?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceCalendar(year: number, month?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('year', year.toString());
      if (month) params.append('month', month.toString());

      const response = await apiClient.get<ApiResponse<any>>(
        `/races/calendar?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async searchRaces(
    query: string,
    filters?: Omit<RaceFilters, 'date' | 'month' | 'year'>
  ): Promise<{
    races: Race[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<
        ApiResponse<{
          races: Race[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/races/search?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async getRacesInstance(filters?: RaceFilters): Promise<{
    races: Race[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return RaceApi.getRaces(filters);
  }

  async getRaceInstance(raceId: string): Promise<RaceDetail> {
    return RaceApi.getRace(raceId);
  }

  async createRaceInstance(raceData: Partial<Race>): Promise<Race> {
    return RaceApi.createRace(raceData);
  }

  async updateRaceInstance(raceId: string, updateData: Partial<Race>): Promise<Race> {
    return RaceApi.updateRace(raceId, updateData);
  }

  async deleteRaceInstance(raceId: string): Promise<{ message: string }> {
    return RaceApi.deleteRace(raceId);
  }

  async getRaceResultsInstance(raceId: string): Promise<RaceResult[]> {
    return RaceApi.getRaceResults(raceId);
  }

  async updateRaceResultsInstance(raceId: string, results: RaceResult[]): Promise<RaceResult[]> {
    return RaceApi.updateRaceResults(raceId, results);
  }

  async getRaceDividendsInstance(raceId: string): Promise<DividendRate[]> {
    return RaceApi.getRaceDividends(raceId);
  }

  async getRaceEntriesInstance(raceId: string): Promise<any[]> {
    return RaceApi.getRaceEntries(raceId);
  }

  async getRaceStatisticsInstance(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<any> {
    return RaceApi.getRaceStatistics(filters);
  }

  async getRaceAnalysisInstance(raceId: string): Promise<any> {
    return RaceApi.getRaceAnalysis(raceId);
  }

  async getRaceScheduleInstance(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<any[]> {
    return RaceApi.getRaceSchedule(filters);
  }

  async getRaceCalendarInstance(year: number, month?: number): Promise<any> {
    return RaceApi.getRaceCalendar(year, month);
  }

  async searchRacesInstance(
    query: string,
    filters?: Omit<RaceFilters, 'date' | 'month' | 'year'>
  ): Promise<{
    races: Race[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return RaceApi.searchRaces(query, filters);
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
export const raceApi = RaceApi.getInstance();
