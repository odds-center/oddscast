import type {
  ApiResponseDto,
  RaceDto,
  RaceDetailDto,
  RaceEntryDto,
  RaceListResponseDto,
  RaceResultDto,
  DividendDto,
} from '@goldenrace/shared';
import { RaceFilters } from '@/lib/types/race';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockRaces, mockRaceResults, mockDividends } from '@/lib/mocks/data';

export default class RaceApi {
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
  /**
   * 오늘 경주 목록 (서버: GET /races/today)
   */
  static async getTodayRaces(): Promise<RaceDto[]> {
    if (CONFIG.useMock) {
      const today = new Date().toISOString().slice(0, 10);
      const filtered = mockRaces.filter((r: RaceDto) => r.rcDate === today);
      return (filtered.length > 0 ? filtered : mockRaces) as unknown as RaceDto[];
    }
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceDto[]>>('/races/today');
      const data = handleApiResponse(response) as RaceDto[] | undefined;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaces(filters?: RaceFilters): Promise<RaceListResponseDto> {
    if (CONFIG.useMock) {
      let list = [...mockRaces];
      if (filters?.date) {
        const d = filters.date === 'today' ? new Date().toISOString().slice(0, 10) : filters.date;
        list = list.filter((r: RaceDto) => r.rcDate === d);
      }
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const start = (page - 1) * limit;
      return {
        races: list.slice(start, start + limit) as unknown as RaceDto[],
        total: list.length,
        page,
        totalPages: Math.ceil(list.length / limit) || 1,
      };
    }
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

      const response = await axiosInstance.get<ApiResponseDto<RaceListResponseDto>>(
        `/races?${params.toString()}`,
      );
      return handleApiResponse(response) as RaceListResponseDto;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRace(raceId: string): Promise<RaceDetailDto> {
    if (CONFIG.useMock) {
      const race = mockRaces.find((r: RaceDto) => r.id === raceId);
      if (race) return race as unknown as RaceDetailDto;
      throw new Error('경주를 찾을 수 없습니다.');
    }
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceDetailDto>>(`/races/${raceId}`);
      return handleApiResponse(response) as RaceDetailDto;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createRace(raceData: Partial<RaceDto>): Promise<RaceDto> {
    try {
      const response = await axiosInstance.post<ApiResponseDto<RaceDto>>('/races', raceData);
      return handleApiResponse(response) as RaceDto;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateRace(raceId: string, updateData: Partial<RaceDto>): Promise<RaceDto> {
    try {
      const response = await axiosInstance.put<ApiResponseDto<RaceDto>>(`/races/${raceId}`, updateData);
      return handleApiResponse(response) as RaceDto;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteRace(raceId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponseDto<{ message: string }>>(
        `/races/${raceId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceResults(raceId: string): Promise<RaceResultDto[]> {
    if (CONFIG.useMock) {
      return (mockRaceResults as Record<string, RaceResultDto[]>)[raceId] ?? [];
    }
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceResultDto[]>>(
        `/races/${raceId}/results`,
      );
      return handleApiResponse(response) as RaceResultDto[];
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateRaceResults(raceId: string, results: RaceResultDto[]): Promise<RaceResultDto[]> {
    try {
      const response = await axiosInstance.put<ApiResponseDto<RaceResultDto[]>>(
        `/races/${raceId}/results`,
        { results },
      );
      return handleApiResponse(response) as RaceResultDto[];
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceDividends(raceId: string): Promise<DividendDto[]> {
    if (CONFIG.useMock) {
      return (mockDividends as Record<string, DividendDto[]>)[raceId] ?? [];
    }
    try {
      const response = await axiosInstance.get<ApiResponseDto<DividendDto[]>>(
        `/races/${raceId}/dividends`,
      );
      return handleApiResponse(response) as DividendDto[];
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceEntries(raceId: string): Promise<RaceEntryDto[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceEntryDto[]>>(
        `/races/${raceId}/entries`,
      );
      return handleApiResponse(response) as RaceEntryDto[];
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceStatistics(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<Record<string, unknown>> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);

      const response = await axiosInstance.get<ApiResponseDto<unknown>>(
        `/races/statistics?${params.toString()}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceAnalysis(raceId: string): Promise<Record<string, unknown>> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<unknown>>(`/races/${raceId}/analysis`);
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
  }): Promise<Record<string, unknown>[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);

      const response = await axiosInstance.get<ApiResponseDto<unknown[]>>(
        `/races/schedule?${params.toString()}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRaceCalendar(year: number, month?: number): Promise<Record<string, unknown>> {
    try {
      const params = new URLSearchParams();
      params.append('year', year.toString());
      if (month) params.append('month', month.toString());

      const response = await axiosInstance.get<ApiResponseDto<unknown>>(
        `/races/calendar?${params.toString()}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async searchRaces(
    query: string,
    filters?: Omit<RaceFilters, 'date' | 'month' | 'year'>,
  ): Promise<RaceListResponseDto> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axiosInstance.get<ApiResponseDto<RaceListResponseDto>>(
        `/races/search?${params.toString()}`,
      );
      return handleApiResponse(response) as RaceListResponseDto;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async getRacesInstance(filters?: RaceFilters): Promise<RaceListResponseDto> {
    return RaceApi.getRaces(filters);
  }

  async getRaceInstance(raceId: string): Promise<RaceDetailDto> {
    return RaceApi.getRace(raceId);
  }

  async createRaceInstance(raceData: Partial<RaceDto>): Promise<RaceDto> {
    return RaceApi.createRace(raceData);
  }

  async updateRaceInstance(raceId: string, updateData: Partial<RaceDto>): Promise<RaceDto> {
    return RaceApi.updateRace(raceId, updateData);
  }

  async deleteRaceInstance(raceId: string): Promise<{ message: string }> {
    return RaceApi.deleteRace(raceId);
  }

  async getRaceResultsInstance(raceId: string): Promise<RaceResultDto[]> {
    return RaceApi.getRaceResults(raceId);
  }

  async updateRaceResultsInstance(raceId: string, results: RaceResultDto[]): Promise<RaceResultDto[]> {
    return RaceApi.updateRaceResults(raceId, results);
  }

  async getRaceDividendsInstance(raceId: string): Promise<DividendDto[]> {
    return RaceApi.getRaceDividends(raceId);
  }

  async getRaceEntriesInstance(raceId: string): Promise<RaceEntryDto[]> {
    return RaceApi.getRaceEntries(raceId);
  }

  async getRaceStatisticsInstance(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<Record<string, unknown>> {
    return RaceApi.getRaceStatistics(filters);
  }

  async getRaceAnalysisInstance(raceId: string): Promise<Record<string, unknown>> {
    return RaceApi.getRaceAnalysis(raceId);
  }

  async getRaceScheduleInstance(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
  }): Promise<Record<string, unknown>[]> {
    return RaceApi.getRaceSchedule(filters);
  }

  async getRaceCalendarInstance(year: number, month?: number): Promise<Record<string, unknown>> {
    return RaceApi.getRaceCalendar(year, month);
  }

  async searchRacesInstance(
    query: string,
    filters?: Omit<RaceFilters, 'date' | 'month' | 'year'>,
  ): Promise<RaceListResponseDto> {
    return RaceApi.searchRaces(query, filters);
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
// 싱글톤 인스턴스 export (기존 호환성 유지)
// export const raceApi = RaceApi.getInstance();
