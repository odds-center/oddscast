import type { ApiResponseDto } from '@oddscast/shared';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

// Horse racing result type definitions
export interface RaceResult {
  id: string;
  raceId: string;
  ord: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  owName: string;
  rcTime?: string;
  diffUnit?: string;
  chaksun1?: number;
  track?: string;
  weather?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaceResultDetail extends RaceResult {
  race?: {
    id: string;
    rcName: string;
    meet: string;
    meetName: string;
    rcDate: string;
    rcNo: string;
    rcDist: string;
    rank: string;
    rcCondition?: string;
    rcPrize: number;
  };
  horseDetails?: {
    age: number;
    gender: string;
    wgBudam: number;
    rating: number;
    odds: number;
    finishTime: string;
    margin: string;
    last600m: string;
    last400m: string;
    last200m: string;
  };
  jockeyDetails?: {
    weight: number;
    allowance: number;
    winRate: number;
    placeRate: number;
  };
  trainerDetails?: {
    winRate: number;
    placeRate: number;
    totalStarts: number;
  };
}

export interface ResultFilters {
  raceId?: string;
  meet?: string;
  date?: string;
  month?: string;
  year?: string;
  grade?: string;
  distance?: string;
  jockey?: string;
  trainer?: string;
  owner?: string;
  horseNumber?: string;
  finishPosition?: string;
  page?: number;
  limit?: number;
}

export interface ResultStatistics {
  totalRaces: number;
  totalResults: number;
  averageTime: number;
  fastestTime: number;
  slowestTime: number;
  byMeet: Record<string, number>;
  byGrade: Record<string, number>;
  byDistance: Record<string, number>;
  topJockeys: {
    jockeyName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }[];
  topTrainers: {
    trainerName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }[];
  topHorses: {
    horseName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }[];
}

// Horse racing result API class
export default class ResultApi {
  private static instance: ResultApi;
  private static baseUrl = '/results';

  private constructor() {}

  public static getInstance(): ResultApi {
    if (!ResultApi.instance) {
      ResultApi.instance = new ResultApi();
    }
    return ResultApi.instance;
  }

  // Get race result list
  static async getResults(filters?: ResultFilters): Promise<{
    results: RaceResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();

      if (filters?.raceId) params.append('raceId', filters.raceId);
      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      if (filters?.jockey) params.append('jockey', filters.jockey);
      if (filters?.trainer) params.append('trainer', filters.trainer);
      if (filters?.owner) params.append('owner', filters.owner);
      if (filters?.horseNumber) params.append('horseNumber', filters.horseNumber);
      if (filters?.finishPosition) params.append('finishPosition', filters.finishPosition);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axiosInstance.get<
        ApiResponseDto<{
          results: RaceResult[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${ResultApi.baseUrl}?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /** Same race list as GET /races (paginated by race). Use for results page to align with races page. */
  static async getResultsGroupedByRace(filters: ResultFilters): Promise<{
    raceGroups: Array<{
      race: { id: string; meet?: string; meetName?: string; rcDate: string; rcNo?: string; rcDist?: string };
      results: RaceResult[];
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    params.set('groupByRace', 'true');
    if (filters?.meet) params.append('meet', filters.meet);
    if (filters?.date) params.append('date', filters.date ?? '');
    if (filters?.page) params.append('page', String(filters.page ?? 1));
    if (filters?.limit) params.append('limit', String(filters.limit ?? 20));

    const response = await axiosInstance.get<
      ApiResponseDto<{
        raceGroups: Array<{
          race: { id: string; meet?: string; meetName?: string; rcDate: string; rcNo?: string; rcDist?: string };
          results: RaceResult[];
        }>;
        total: number;
        page: number;
        totalPages: number;
      }>
    >(`${ResultApi.baseUrl}?${params.toString()}`);

    return handleApiResponse(response);
  }

  // Get individual race result
  static async getResult(resultId: string): Promise<RaceResultDetail> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceResultDetail>>(
        `${ResultApi.baseUrl}/${resultId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get results by race
  static async getRaceResults(raceId: string): Promise<RaceResult[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<RaceResult[]>>(
        `${ResultApi.baseUrl}/race/${raceId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create race result
  static async createResult(
    resultData: Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RaceResult> {
    try {
      const response = await axiosInstance.post<ApiResponseDto<RaceResult>>(
        ResultApi.baseUrl,
        resultData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update race result
  static async updateResult(
    resultId: string,
    updateData: Partial<Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<RaceResult> {
    try {
      const response = await axiosInstance.put<ApiResponseDto<RaceResult>>(
        `${ResultApi.baseUrl}/${resultId}`,
        updateData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete race result
  static async deleteResult(resultId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponseDto<{ message: string }>>(
        `${ResultApi.baseUrl}/${resultId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get race result statistics
  static async getResultStatistics(filters?: {
    meet?: string;
    date?: string;
    month?: string;
    year?: string;
    grade?: string;
    distance?: string;
  }): Promise<ResultStatistics> {
    try {
      const params = new URLSearchParams();

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.month) params.append('month', filters.month);
      if (filters?.year) params.append('year', filters.year);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);

      const response = await axiosInstance.get<ApiResponseDto<ResultStatistics>>(
        `${ResultApi.baseUrl}/statistics?${params.toString()}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Search race results
  static async searchResults(
    query: string,
    filters?: Omit<ResultFilters, 'raceId'>,
  ): Promise<{
    results: RaceResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axiosInstance.get<
        ApiResponseDto<{
          results: RaceResult[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${ResultApi.baseUrl}/search?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Export race results
  static async exportResults(
    filters?: ResultFilters,
    format: 'csv' | 'excel' = 'csv',
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (filters?.raceId) params.append('raceId', filters.raceId);
      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      params.append('format', format);

      const response = await axiosInstance.get(`${ResultApi.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Create race results in bulk (server: POST /results/bulk)
   */
  static async createBulkResults(
    results: Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<{ count?: number }> {
    try {
      const response = await axiosInstance.post<ApiResponseDto<{ count?: number }>>(
        `${ResultApi.baseUrl}/bulk`,
        { results },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Server does not have bulk-update, validate endpoints — to be added in Admin if needed
}

// Singleton instance export
// Singleton instance export
// export const resultApi = ResultApi.getInstance();
