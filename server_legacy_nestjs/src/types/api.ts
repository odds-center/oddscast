// API 공통 타입 정의

// 기본 API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    limit: number;
    offset: number;
    count: number;
  };
}

// KRA API 응답 타입
export interface KraApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: any[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// API 상태 타입
export interface ApiStatus {
  isAvailable: boolean;
  lastCheck: string;
  responseTime?: number;
  error?: string;
}

// 쿼리 옵션 타입
export interface QueryOptions {
  date?: string;
  raceId?: string;
  limit?: number;
  offset?: number;
}

// 동기화 결과 타입
export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// 동기화 상태 타입
export interface SyncStatus {
  lastSync: string | null;
  racesCount: number;
  resultsCount: number;
  racePlansCount: number;
  isUpToDate: boolean;
}
