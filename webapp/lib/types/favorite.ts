/**
 * 즐겨찾기 — @goldenrace/shared 기반 (RACE만 지원)
 */
import type { Favorite } from '@goldenrace/shared';
export type {
  Favorite,
  CreateFavoriteRequest,
  UpdateFavoriteRequest,
  FavoriteFilters,
  FavoriteListResponse,
} from '@goldenrace/shared';

/** webapp 확장: 통계, 그룹, 내보내기 등 */
export interface FavoriteStatistics {
  totalFavorites: number;
  byType: Record<
    string,
    { count: number; percentage: number }
  >;
  byPriority: Record<
    'LOW' | 'MEDIUM' | 'HIGH',
    {
      count: number;
      percentage: number;
    }
  >;
  recentAdditions: Favorite[];
  mostFavorited: {
    targetId: string;
    targetName: string;
    type: string;
    count: number;
  }[];
}

/** RACE 타입 확장 (targetData 구조화) */
export interface FavoriteRace extends Favorite {
  type: 'RACE';
  targetData: {
    raceId: string;
    raceName: string;
    raceDate: string;
    meet: string;
    meetName: string;
    distance: string;
    grade: string;
    totalEntries: number;
    raceStatus: string;
  };
}

export interface FavoriteGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  favorites: Favorite[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFavoriteGroupRequest {
  name: string;
  description?: string;
  favoriteIds?: string[];
}

export interface UpdateFavoriteGroupRequest {
  name?: string;
  description?: string;
  favoriteIds?: string[];
}

export interface FavoriteGroupListResponse {
  groups: FavoriteGroup[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FavoriteSyncRequest {
  deviceId: string;
  favorites: {
    type: string;
    targetId: string;
    targetName: string;
    targetData?: any;
    notes?: string;
    lastModified: string;
  }[];
}

export interface FavoriteSyncResponse {
  synced: number;
  conflicts: {
    localId: string;
    serverId: string;
    conflictType: 'MODIFIED' | 'DELETED' | 'ADDED';
    resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE';
  }[];
  serverFavorites: Favorite[];
  lastSync: string;
}

export interface FavoriteExport {
  userId: string;
  exportDate: string;
  favorites: Favorite[];
  groups: FavoriteGroup[];
  statistics: FavoriteStatistics;
  format: 'json' | 'csv' | 'excel';
}

export interface FavoriteImport {
  userId: string;
  importDate: string;
  importedFavorites: Favorite[];
  importedGroups: FavoriteGroup[];
  duplicates: {
    existing: Favorite;
    imported: Favorite;
    action: 'SKIP' | 'REPLACE' | 'RENAME';
  }[];
  errors: {
    line: number;
    error: string;
    data: any;
  }[];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  };
}
