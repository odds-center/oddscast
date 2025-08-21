// 공통 API 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// API 요청 기본 설정
export interface ApiRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// 검색 타입
export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
}

// 정렬 타입
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 필터 타입
export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[];
}
