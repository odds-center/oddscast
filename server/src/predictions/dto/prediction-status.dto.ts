/**
 * 예측 상태 DTO
 * - 예측 없을 때 또는 생성 중일 때 반환
 */
export class PredictionStatusDto {
  status: 'available' | 'pending' | 'generating' | 'failed';
  message: string;
  raceId: string;
  estimatedTime?: number; // 예상 완료 시간 (초)
  lastUpdated?: Date;
}

/**
 * 예측 상태 메시지
 */
export const PREDICTION_STATUS_MESSAGES = {
  GENERATING: '예측을 생성하고 있습니다. 잠시만 기다려주세요.',
  PENDING: '예측 결과를 확인하고 있습니다.',
  UPDATING: '최신 정보로 예측을 업데이트하는 중입니다.',
  RETRY: '예측 생성 중 오류가 발생했습니다. 재시도 중입니다.',
  FAILED: '예측 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;
