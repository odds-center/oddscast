export interface KraApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  dailyLimit: number;
}

export interface KraApiStatus {
  isAvailable: boolean;
  lastCheck: string;
  responseTime?: number;
  error?: string;
  dailyUsage: number;
  dailyLimit: number;
}

export interface KraApiUsage {
  date: string;
  count: number;
  limit: number;
  remaining: number;
}

export interface KraMeetInfo {
  code: string;
  name: string;
  fullName: string;
}

export const KRA_MEETS: KraMeetInfo[] = [
  { code: '1', name: '서울', fullName: '서울경마공원' },
  { code: '2', name: '부산경남', fullName: '부산경남경마공원' },
  { code: '3', name: '제주', fullName: '제주경마공원' },
];

export interface KraApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface KraApiResponse<T> {
  success: boolean;
  data?: T;
  error?: KraApiError;
  timestamp: string;
  responseTime: number;
}

export interface KraRacePlanFilters {
  meet?: string;
  startDate?: string;
  endDate?: string;
  rcGrade?: string;
  rcAge?: string;
  rcSex?: string;
}

export interface KraApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: string;
  dailyUsage: KraApiUsage;
}
