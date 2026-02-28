import { axiosInstance, handleApiResponse } from '@/lib/api/axios';

export interface WeeklyPreviewContent {
  highlights?: string;
  horsesToWatch?: string[];
  trackConditions?: string;
  raceDates?: string[];
}

export interface WeeklyPreviewResponse {
  weekLabel: string | null;
  content: WeeklyPreviewContent | null;
}

export default class WeeklyPreviewApi {
  static async getLatest(week?: string): Promise<WeeklyPreviewResponse> {
    const params = week ? { week } : {};
    const response = await axiosInstance.get<{ data?: WeeklyPreviewResponse }>(
      '/weekly-preview',
      { params },
    );
    const data = handleApiResponse(response);
    return (data as WeeklyPreviewResponse) ?? { weekLabel: null, content: null };
  }
}
