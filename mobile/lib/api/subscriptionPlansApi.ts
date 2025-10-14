import { axiosInstance } from '../utils/axios';

/**
 * 구독 플랜 인터페이스 (DB 스키마 기준)
 */
export interface SubscriptionPlan {
  id: string;
  planName: string; // LIGHT, PREMIUM
  displayName: string; // 라이트 플랜, 프리미엄 플랜
  description: string;
  originalPrice: number; // VAT 전 가격
  vat: number; // 부가세
  totalPrice: number; // 최종 가격 (VAT 포함)
  baseTickets: number; // 기본 예측권
  bonusTickets: number; // 보너스 예측권
  totalTickets: number; // 총 예측권
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 구독 플랜 목록 조회 (인증 불필요)
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await axiosInstance.get<SubscriptionPlan[]>('/subscriptions/plans');
  return response.data;
};
