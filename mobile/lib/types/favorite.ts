// 즐겨찾기 관련 타입 정의
export interface Favorite {
  id: string;
  userId: string;
  type: 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';
  targetId: string;
  targetName: string;
  targetData?: any;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFavoriteRequest {
  type: 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';
  targetId: string;
  targetName: string;
  targetData?: any;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

export interface UpdateFavoriteRequest {
  targetName?: string;
  targetData?: any;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
}

export interface FavoriteFilters {
  userId?: string;
  type?: 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FavoriteStatistics {
  totalFavorites: number;
  byType: Record<
    'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET',
    {
      count: number;
      percentage: number;
    }
  >;
  byPriority: Record<
    'LOW' | 'MEDIUM' | 'HIGH',
    {
      count: number;
      percentage: number;
    }
  >;
  recentAdditions: Favorite[];
  mostFavorited: Array<{
    targetId: string;
    targetName: string;
    type: string;
    count: number;
  }>;
}

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

export interface FavoriteHorse extends Favorite {
  type: 'HORSE';
  targetData: {
    horseId: string;
    horseName: string;
    horseNameEn?: string;
    birthYear?: number;
    gender?: string;
    color?: string;
    sire?: string;
    dam?: string;
    totalStarts?: number;
    totalWins?: number;
    totalPlaces?: number;
    totalPrize?: number;
  };
}

export interface FavoriteJockey extends Favorite {
  type: 'JOCKEY';
  targetData: {
    jockeyId: string;
    jockeyName: string;
    jockeyNameEn?: string;
    licenseNumber?: string;
    totalStarts?: number;
    totalWins?: number;
    totalPlaces?: number;
    winRate?: number;
    totalPrize?: number;
  };
}

export interface FavoriteTrainer extends Favorite {
  type: 'TRAINER';
  targetData: {
    trainerId: string;
    trainerName: string;
    trainerNameEn?: string;
    licenseNumber?: string;
    totalStarts?: number;
    totalWins?: number;
    totalPlaces?: number;
    winRate?: number;
    totalPrize?: number;
  };
}

export interface FavoriteMeet extends Favorite {
  type: 'MEET';
  targetData: {
    meetId: string;
    meetName: string;
    meetCode: string;
    location?: string;
    trackType?: string;
    totalRaces?: number;
    totalPrize?: number;
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
  favorites: Array<{
    type: string;
    targetId: string;
    targetName: string;
    targetData?: any;
    notes?: string;
    lastModified: string;
  }>;
}

export interface FavoriteSyncResponse {
  synced: number;
  conflicts: Array<{
    localId: string;
    serverId: string;
    conflictType: 'MODIFIED' | 'DELETED' | 'ADDED';
    resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE';
  }>;
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
  duplicates: Array<{
    existing: Favorite;
    imported: Favorite;
    action: 'SKIP' | 'REPLACE' | 'RENAME';
  }>;
  errors: Array<{
    line: number;
    error: string;
    data: any;
  }>;
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  };
}
