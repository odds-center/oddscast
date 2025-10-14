export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  points: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Race {
  id: number;
  raceNo: number;
  raceName: string;
  raceDate: string;
  raceTime: string;
  track: string;
  distance: number;
  weather: string;
  trackCondition: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Horse {
  id: number;
  name: string;
  age: number;
  gender: string;
  country: string;
  trainer: string;
  jockey: string;
}

export interface Bet {
  id: number;
  userId: number;
  raceId: number;
  betType: string;
  amount: number;
  odds: number;
  status: string;
  winAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}

// Admin types
export * from './admin';
