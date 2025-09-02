import { ApiResponse } from '@/lib/types/api';
import type {
  CreateFavoriteRequest,
  Favorite,
  FavoriteFilters,
  FavoriteStatistics,
  UpdateFavoriteRequest,
} from '@/lib/types/favorite';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';
import qs from 'qs';

// 즐겨찾기 API 클래스
export class FavoriteApi {
  private static instance: FavoriteApi;
  private baseUrl = '/favorites';

  private constructor() {}

  public static getInstance(): FavoriteApi {
    if (!FavoriteApi.instance) {
      FavoriteApi.instance = new FavoriteApi();
    }
    return FavoriteApi.instance;
  }

  // 즐겨찾기 목록 조회
  async getFavorites(filters?: FavoriteFilters): Promise<{
    favorites: Favorite[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<
        ApiResponse<{
          favorites: Favorite[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${this.baseUrl}?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 개별 즐겨찾기 조회
  async getFavorite(favoriteId: string): Promise<Favorite> {
    try {
      const response = await axiosInstance.get<ApiResponse<Favorite>>(
        `${this.baseUrl}/${favoriteId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 생성
  async createFavorite(favoriteData: CreateFavoriteRequest): Promise<Favorite> {
    try {
      const response = await axiosInstance.post<ApiResponse<Favorite>>(this.baseUrl, favoriteData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 업데이트
  async updateFavorite(favoriteId: string, updateData: UpdateFavoriteRequest): Promise<Favorite> {
    try {
      const response = await axiosInstance.put<ApiResponse<Favorite>>(
        `${this.baseUrl}/${favoriteId}`,
        updateData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 삭제
  async deleteFavorite(favoriteId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/${favoriteId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 토글
  async toggleFavorite(
    type: Favorite['type'],
    targetId: string,
    targetName: string,
    targetData?: Favorite['targetData']
  ): Promise<{ action: 'ADDED' | 'REMOVED'; favorite?: Favorite }> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ action: 'ADDED' | 'REMOVED'; favorite?: Favorite }>
      >(`${this.baseUrl}/toggle`, { type, targetId, targetName, targetData });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 확인
  async checkFavorite(
    type: Favorite['type'],
    targetId: string
  ): Promise<{ isFavorite: boolean; favorite?: Favorite }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ isFavorite: boolean; favorite?: Favorite }>
      >(`${this.baseUrl}/check?type=${type}&targetId=${targetId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 통계
  async getFavoriteStatistics(): Promise<FavoriteStatistics> {
    try {
      const response = await axiosInstance.get<ApiResponse<FavoriteStatistics>>(
        `${this.baseUrl}/statistics`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 검색
  async searchFavorites(
    query: string,
    filters?: Omit<FavoriteFilters, 'page' | 'limit'>
  ): Promise<{
    favorites: Favorite[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const searchParams = { query, ...filters };
      const queryString = qs.stringify(searchParams, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<
        ApiResponse<{
          favorites: Favorite[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${this.baseUrl}/search?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 내보내기
  async exportFavorites(
    filters?: FavoriteFilters,
    format?: 'csv' | 'excel'
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const queryString = qs.stringify(
        { ...filters, format },
        {
          skipNulls: true,
          arrayFormat: 'brackets',
        }
      );

      const response = await axiosInstance.get<
        ApiResponse<{ downloadUrl: string; filename: string }>
      >(`${this.baseUrl}/export?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 일괄 추가
  async bulkAddFavorites(favorites: CreateFavoriteRequest[]): Promise<{
    added: number;
    failed: number;
    errors: { index: number; error: string }[];
  }> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{
          added: number;
          failed: number;
          errors: { index: number; error: string }[];
        }>
      >(`${this.baseUrl}/bulk-add`, { favorites });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 일괄 삭제
  async bulkDeleteFavorites(favoriteIds: string[]): Promise<{
    deleted: number;
    failed: number;
    errors: { favoriteId: string; error: string }[];
  }> {
    try {
      const response = await axiosInstance.delete<
        ApiResponse<{
          deleted: number;
          failed: number;
          errors: { favoriteId: string; error: string }[];
        }>
      >(`${this.baseUrl}/bulk-delete`, { data: { favoriteIds } });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 싱글톤 인스턴스 export
export const favoriteApi = FavoriteApi.getInstance();
