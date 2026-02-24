import { axiosInstance, handleApiResponse } from '@/lib/api/axios';

export interface TodaysFortune {
  date: string;
  messageOverall: string;
  messageRace: string;
  messageAdvice: string;
  luckyNumbers: number[];
  luckyColor: string;
  luckyColorHex?: string;
  keyword?: string;
}

export default class FortuneApi {
  /**
   * GET /api/fortune/today — 오늘의 경마운세 (로그인 사용자만)
   */
  static async getToday(): Promise<TodaysFortune> {
    const response = await axiosInstance.get<{ data?: TodaysFortune }>('/fortune/today');
    const data = handleApiResponse(response);
    return data as TodaysFortune;
  }
}
