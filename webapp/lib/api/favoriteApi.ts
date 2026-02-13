import { ApiResponse } from '@/lib/types/api';
import CONFIG from '@/lib/config';
import type {
  CreateFavoriteRequest,
  Favorite,
  FavoriteFilters,
  FavoriteStatistics,
  UpdateFavoriteRequest,
} from '@/lib/types/favorite';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import qs from 'qs';

// 즐겨찾기 API 클래스
export default class FavoriteApi {
  private static instance: FavoriteApi;
  private static baseUrl = '/favorites';

  private constructor() {}

  public static getInstance(): FavoriteApi {
    if (!FavoriteApi.instance) {
      FavoriteApi.instance = new FavoriteApi();
    }
    return FavoriteApi.instance;
  }

  // 즐겨찾기 목록 조회
  static async getFavorites(filters?: FavoriteFilters): Promise<{
    favorites: Favorite[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (CONFIG.useMock) {
      return { favorites: [], total: 0, page: 1, totalPages: 1 };
    }
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
      >(`${FavoriteApi.baseUrl}?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 개별 즐겨찾기 조회
  static async getFavorite(favoriteId: string): Promise<Favorite> {
    try {
      const response = await axiosInstance.get<ApiResponse<Favorite>>(
        `${FavoriteApi.baseUrl}/${favoriteId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 생성
  static async createFavorite(favoriteData: CreateFavoriteRequest): Promise<Favorite> {
    try {
      const response = await axiosInstance.post<ApiResponse<Favorite>>(
        FavoriteApi.baseUrl,
        favoriteData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 업데이트
  static async updateFavorite(
    favoriteId: string,
    updateData: UpdateFavoriteRequest,
  ): Promise<Favorite> {
    try {
      const response = await axiosInstance.put<ApiResponse<Favorite>>(
        `${FavoriteApi.baseUrl}/${favoriteId}`,
        updateData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 삭제
  static async deleteFavorite(favoriteId: string): Promise<{ message: string }> {
    if (CONFIG.useMock) return { message: 'OK' };
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `${FavoriteApi.baseUrl}/${favoriteId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 토글
  static async toggleFavorite(
    type: Favorite['type'],
    targetId: string,
    targetName: string,
    targetData?: Favorite['targetData'],
  ): Promise<{ action: 'ADDED' | 'REMOVED'; favorite?: Favorite }> {
    if (CONFIG.useMock) return { action: 'ADDED' };
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ action: 'ADDED' | 'REMOVED'; favorite?: Favorite }>
      >(`${FavoriteApi.baseUrl}/toggle`, { type, targetId, targetName, targetData });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 확인
  static async checkFavorite(
    type: Favorite['type'],
    targetId: string,
  ): Promise<{ isFavorite: boolean; favorite?: Favorite }> {
    if (CONFIG.useMock) return { isFavorite: false };
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ isFavorite: boolean; favorite?: Favorite }>
      >(`${FavoriteApi.baseUrl}/check?type=${type}&targetId=${targetId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 통계
  static async getFavoriteStatistics(): Promise<FavoriteStatistics> {
    try {
      const response = await axiosInstance.get<ApiResponse<FavoriteStatistics>>(
        `${FavoriteApi.baseUrl}/statistics`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 검색
  static async searchFavorites(
    query: string,
    filters?: Omit<FavoriteFilters, 'page' | 'limit'>,
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
      >(`${FavoriteApi.baseUrl}/search?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 내보내기
  static async exportFavorites(
    filters?: FavoriteFilters,
    format?: 'csv' | 'excel',
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const queryString = qs.stringify(
        { ...filters, format },
        {
          skipNulls: true,
          arrayFormat: 'brackets',
        },
      );

      const response = await axiosInstance.get<
        ApiResponse<{ downloadUrl: string; filename: string }>
      >(`${FavoriteApi.baseUrl}/export?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 일괄 추가 (서버: POST /favorites/bulk, body = array)
  static async bulkAddFavorites(favorites: CreateFavoriteRequest[]): Promise<{
    count?: number;
    added?: number;
    failed?: number;
    errors?: { index: number; error: string }[];
  }> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ count?: number } | { added?: number; failed?: number; errors?: any[] }>
      >(`${FavoriteApi.baseUrl}/bulk`, favorites);

      const d = handleApiResponse(response) as any;
      return {
        added: d?.count ?? d?.added ?? favorites.length,
        failed: d?.failed ?? 0,
        errors: d?.errors ?? [],
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 즐겨찾기 일괄 삭제 (서버: DELETE /favorites/bulk, body = { ids })
  static async bulkDeleteFavorites(favoriteIds: string[]): Promise<{
    count?: number;
    deleted?: number;
    failed?: number;
    errors?: { favoriteId: string; error: string }[];
  }> {
    try {
      const response = await axiosInstance.delete<
        ApiResponse<{ count?: number } | { deleted?: number; failed?: number; errors?: any[] }>
      >(`${FavoriteApi.baseUrl}/bulk`, { data: { ids: favoriteIds } });

      const d = handleApiResponse(response) as any;
      return {
        deleted: d?.count ?? d?.deleted ?? favoriteIds.length,
        failed: d?.failed ?? 0,
        errors: d?.errors ?? [],
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 싱글톤 인스턴스 export
// 싱글톤 인스턴스 export
// export const favoriteApi = FavoriteApi.getInstance();
