import { axiosInstance } from '../utils/axios';

export interface SubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  price: number;
  ticketsPerMonth: number;
  pricePerTicket: number;
  discountPercentage: number;
  isActive: boolean;
  isRecommended: boolean;
  features: string[];
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
