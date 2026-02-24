import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

export interface JockeyProfile {
  jkNo: string;
  jkName: string;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
  byMeet: { meet: string; count: number; winRate: number; placeRate: number }[];
}

export interface JockeyHistoryItem {
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

export interface JockeyHistoryResponse {
  items: JockeyHistoryItem[];
  total: number;
  totalPages: number;
}

export default class JockeyApi {
  static async getProfile(jkNo: string): Promise<JockeyProfile | null> {
    try {
      const response = await axiosInstance.get<{ data?: JockeyProfile | null }>(
        `/jockeys/${encodeURIComponent(jkNo)}/profile`,
      );
      const data = handleApiResponse(response);
      return (data as JockeyProfile | null) ?? null;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getHistory(
    jkNo: string,
    page = 1,
    limit = 20,
  ): Promise<JockeyHistoryResponse> {
    try {
      const response = await axiosInstance.get<{
        data?: JockeyHistoryResponse;
      }>(`/jockeys/${encodeURIComponent(jkNo)}/history`, {
        params: { page, limit },
      });
      const data = handleApiResponse(response);
      return (data as JockeyHistoryResponse) ?? { items: [], total: 0, totalPages: 0 };
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
