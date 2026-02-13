import type { ApiResponseDto } from '@goldenrace/shared';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockResults } from '@/lib/mocks/data';

// 경마 결과 관련 타입 정의
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
  rcTime: string;
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

// 경마 결과 API 클래스
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

  // 경주 결과 목록 조회
  static async getResults(filters?: ResultFilters): Promise<{
    results: RaceResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (CONFIG.useMock) {
      return {
        results: mockResults as unknown as RaceResult[],
        total: mockResults.length,
        page: 1,
        totalPages: 1,
      };
    }
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

  // 개별 경주 결과 조회
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

  // 경주별 결과 목록
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

  // 경주 결과 생성
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

  // 경주 결과 업데이트
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

  // 경주 결과 삭제
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

  // 경주 결과 통계
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

  // 경주 결과 검색
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

  // 경주 결과 내보내기
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
   * 경주 결과 일괄 생성 (서버: POST /results/bulk)
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

  // 서버에 bulk-update, validate 엔드포인트 없음 — Admin에서 필요 시 추가 예정
}

// 싱글톤 인스턴스 export
// 싱글톤 인스턴스 export
// export const resultApi = ResultApi.getInstance();
