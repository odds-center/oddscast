/**
 * 즐겨찾기 공통 타입
 * 서비스: RACE(경주)만 지원
 * webapp, mobile, admin, server
 */

export type FavoriteType = 'RACE';

export interface Favorite {
  id: string;
  userId: string;
  type: FavoriteType;
  targetId: string;
  targetName: string;
  targetData?: Record<string, unknown>;
  memo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateFavoriteRequest {
  type: FavoriteType;
  targetId: string;
  targetName: string;
  targetData?: Record<string, unknown>;
  memo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

export interface UpdateFavoriteRequest {
  targetName?: string;
  targetData?: Record<string, unknown>;
  memo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

export interface FavoriteFilters {
  type?: FavoriteType;
  userId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  totalPages: number;
}
