import type {
  ApiResponseDto,
  RaceDto,
  RaceDetailDto,
  RaceEntryDto,
  RaceListResponseDto,
  RaceResultDto,
  DividendDto,
} from '@oddscast/shared';
import { RaceFilters } from '@/lib/types/race';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

export interface ScheduleDateItem {
  date: string;
  meetCounts: Record<string, number>;
  totalRaces: number;
}

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

  // Static methods
  /**
   * Get today's race list (server: GET /races/today)
   */
  static async getTodayRaces(): Promise<RaceDto[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceDto[]>>('/races/today');
      const data = handleApiResponse(response) as RaceDto[] | undefined;
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRaces(filters?: RaceFilters): Promise<RaceListResponseDto> {
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRace(raceId: string): Promise<RaceDetailDto> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceDetailDto>>(`/races/${raceId}`);
      return handleApiResponse(response) as RaceDetailDto;
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async createRace(raceData: Partial<RaceDto>): Promise<RaceDto> {
    try {
      const response = await axiosInstance.post<ApiResponseDto<RaceDto>>('/races', raceData);
      return handleApiResponse(response) as RaceDto;
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateRace(raceId: string, updateData: Partial<RaceDto>): Promise<RaceDto> {
    try {
      const response = await axiosInstance.put<ApiResponseDto<RaceDto>>(`/races/${raceId}`, updateData);
      return handleApiResponse(response) as RaceDto;
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async deleteRace(raceId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponseDto<{ message: string }>>(
        `/races/${raceId}`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRaceResults(raceId: string): Promise<RaceResultDto[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceResultDto[]>>(
        `/races/${raceId}/results`,
      );
      return handleApiResponse(response) as RaceResultDto[];
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateRaceResults(raceId: string, results: RaceResultDto[]): Promise<RaceResultDto[]> {
    try {
      const response = await axiosInstance.put<ApiResponseDto<RaceResultDto[]>>(
        `/races/${raceId}/results`,
        { results },
      );
      return handleApiResponse(response) as RaceResultDto[];
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRaceDividends(raceId: string): Promise<DividendDto[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<DividendDto[]>>(
        `/races/${raceId}/dividends`,
      );
      return handleApiResponse(response) as DividendDto[];
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRaceEntries(raceId: string): Promise<RaceEntryDto[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceEntryDto[]>>(
        `/races/${raceId}/entries`,
      );
      return handleApiResponse(response) as RaceEntryDto[];
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getRaceAnalysis(raceId: string): Promise<Record<string, unknown>> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<unknown>>(`/races/${raceId}/analysis`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** Race schedule dates list — race counts by date and meet (based on KRA-synced DB) */
  static async getScheduleDates(filters: {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }): Promise<ScheduleDateItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.meet) params.append('meet', filters.meet);
      const response = await axiosInstance.get<ApiResponseDto<ScheduleDateItem[]>>(
        `/races/schedule-dates?${params.toString()}`,
      );
      const data = handleApiResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Instance methods (maintain backward compatibility)
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

// Singleton instance export (maintain backward compatibility)
// export const raceApi = RaceApi.getInstance();
