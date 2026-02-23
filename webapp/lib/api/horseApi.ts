import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

export interface HorseProfile {
  hrNo: string;
  hrName: string;
  sex: string | null;
  age: string | null;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
}

export interface HorseHistoryItem {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  chulNo: string | null;
  jkName: string | null;
  rcTime: string | null;
}

export interface HorseHistoryResponse {
  items: HorseHistoryItem[];
  total: number;
  totalPages: number;
}

export default class HorseApi {
  static async getProfile(hrNo: string): Promise<HorseProfile | null> {
    try {
      const response = await axiosInstance.get<{ data?: HorseProfile | null }>(
        `/horses/${encodeURIComponent(hrNo)}/profile`,
      );
      const data = handleApiResponse(response);
      return (data as HorseProfile | null) ?? null;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getHistory(
    hrNo: string,
    page = 1,
    limit = 20,
  ): Promise<HorseHistoryResponse> {
    try {
      const response = await axiosInstance.get<{
        data?: HorseHistoryResponse;
      }>(`/horses/${encodeURIComponent(hrNo)}/history`, {
        params: { page, limit },
      });
      const data = handleApiResponse(response);
      return (data as HorseHistoryResponse) ?? { items: [], total: 0, totalPages: 0 };
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
