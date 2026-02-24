import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

export interface TrainerProfile {
  trName: string;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
  byMeet: { meet: string; count: number; winRate: number; placeRate: number }[];
}

export interface TrainerHistoryItem {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  hrName: string | null;
  rcTime: string | null;
}

export interface TrainerHistoryResponse {
  items: TrainerHistoryItem[];
  total: number;
  totalPages: number;
}

export default class TrainerApi {
  static async getProfile(trName: string): Promise<TrainerProfile | null> {
    try {
      const response = await axiosInstance.get<{ data?: TrainerProfile | null }>(
        `/trainers/${encodeURIComponent(trName)}/profile`,
      );
      const data = handleApiResponse(response);
      return (data as TrainerProfile | null) ?? null;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getHistory(
    trName: string,
    page = 1,
    limit = 20,
  ): Promise<TrainerHistoryResponse> {
    try {
      const response = await axiosInstance.get<{
        data?: TrainerHistoryResponse;
      }>(`/trainers/${encodeURIComponent(trName)}/history`, {
        params: { page, limit },
      });
      const data = handleApiResponse(response);
      return (data as TrainerHistoryResponse) ?? { items: [], total: 0, totalPages: 0 };
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
