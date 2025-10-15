import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/utils/axios';

interface PredictionPreview {
  hasPrediction: boolean;
  raceId: string;
  confidence?: number;
  predictedAt?: string;
  updatedAt?: string;
  requiresTicket: boolean;
  hasViewed: boolean; // 이미 봤는지
  isUpdated: boolean; // 업데이트 되었는지
  lastViewedAt?: string;
  message: string;
  previewText?: string;
  status?: string;
}

/**
 * AI 예측 상태 조회 Hook
 *
 * - 예측이 있는지
 * - 이미 봤는지
 * - 업데이트 되었는지
 */
export function usePredictionStatus(raceId: string) {
  return useQuery<PredictionPreview>({
    queryKey: ['prediction-preview', raceId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/predictions/race/${raceId}/preview`);
      return response.data;
    },
    enabled: !!raceId,
    staleTime: 1000 * 60 * 5, // 5분마다 갱신
  });
}
