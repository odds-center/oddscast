import { axiosInstance } from '../utils/axios';

/**
 * 개별 구매 설정 인터페이스
 */
export interface SinglePurchaseConfig {
  id: string;
  configName: string; // SINGLE_TICKET
  displayName: string; // 개별 예측권
  description: string;
  originalPrice: number; // VAT 전
  vat: number;
  totalPrice: number; // VAT 포함
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 개별 구매 설정 조회 (인증 필요)
 */
export const getSinglePurchaseConfig = async (): Promise<SinglePurchaseConfig> => {
  const response = await axiosInstance.get<SinglePurchaseConfig>('/single-purchases/config');
  return response.data;
};

