import { apiClient, handleApiResponse, handleApiError } from '@/lib/utils/axios';
import { ApiResponse } from '@/lib/types/api';

// 경마 결과 관련 타입 정의
export interface RaceResult {
  id: string;
  raceId: string;
  ord: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  owName: string;
  rcRank: string;
  rcTime: string;
  rcPrize?: number;
  rcDist: string;
  rcGrade: string;
  rcCondition: string;
  rcDay?: string;
  rcWeekday?: string;
  rcWeather?: string;
  rcTrack?: string;
  rcTrackCondition?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaceResultDetail extends RaceResult {
  race?: {
    id: string;
    raceName: string;
    meet: string;
    meetName: string;
    rcDate: string;
    rcNo: string;
    rcDist: string;
    rcGrade: string;
    rcCondition: string;
    rcPrize: number;
  };
  horseDetails?: {
    age: number;
    gender: string;
    weight: number;
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
  topJockeys: Array<{
    jockeyName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }>;
  topTrainers: Array<{
    trainerName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }>;
  topHorses: Array<{
    horseName: string;
    wins: number;
    totalStarts: number;
    winRate: number;
  }>;
}

// 경마 결과 API 클래스
export class ResultApi {
  private static instance: ResultApi;
  private baseUrl = '/results';

  private constructor() {}

  public static getInstance(): ResultApi {
    if (!ResultApi.instance) {
      ResultApi.instance = new ResultApi();
    }
    return ResultApi.instance;
  }

  // 경주 결과 목록 조회
  async getResults(filters?: ResultFilters): Promise<{
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

      const response = await apiClient.get<
        ApiResponse<{
          results: RaceResult[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${this.baseUrl}?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 개별 경주 결과 조회
  async getResult(resultId: string): Promise<RaceResultDetail> {
    try {
      const response = await apiClient.get<ApiResponse<RaceResultDetail>>(
        `${this.baseUrl}/${resultId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주별 결과 목록
  async getRaceResults(raceId: string): Promise<RaceResult[]> {
    try {
      const response = await apiClient.get<ApiResponse<RaceResult[]>>(
        `${this.baseUrl}/race/${raceId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 생성
  async createResult(
    resultData: Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RaceResult> {
    try {
      const response = await apiClient.post<ApiResponse<RaceResult>>(this.baseUrl, resultData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 업데이트
  async updateResult(
    resultId: string,
    updateData: Partial<Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<RaceResult> {
    try {
      const response = await apiClient.put<ApiResponse<RaceResult>>(
        `${this.baseUrl}/${resultId}`,
        updateData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 삭제
  async deleteResult(resultId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/${resultId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 통계
  async getResultStatistics(filters?: {
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

      const response = await apiClient.get<ApiResponse<ResultStatistics>>(
        `${this.baseUrl}/statistics?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 검색
  async searchResults(
    query: string,
    filters?: Omit<ResultFilters, 'raceId'>
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

      const response = await apiClient.get<
        ApiResponse<{
          results: RaceResult[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${this.baseUrl}/search?${params.toString()}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 내보내기
  async exportResults(filters?: ResultFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (filters?.raceId) params.append('raceId', filters.raceId);
      if (filters?.meet) params.append('meet', filters.meet);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.grade) params.append('grade', filters.grade);
      if (filters?.distance) params.append('distance', filters.distance);
      params.append('format', format);

      const response = await apiClient.get(`${this.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 일괄 생성
  async createBulkResults(results: Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{
    createdCount: number;
    failedCount: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`${this.baseUrl}/bulk-create`, {
        results,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 일괄 업데이트
  async updateBulkResults(
    updates: Array<{
      id: string;
      data: Partial<Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>>;
    }>
  ): Promise<{
    updatedCount: number;
    failedCount: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`${this.baseUrl}/bulk-update`, {
        updates,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 경주 결과 검증
  async validateResults(raceId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      type: 'MISSING' | 'INVALID' | 'DUPLICATE' | 'INCONSISTENT';
      message: string;
      resultId?: string;
      field?: string;
    }>;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/validate/${raceId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 싱글톤 인스턴스 export
export const resultApi = ResultApi.getInstance();
