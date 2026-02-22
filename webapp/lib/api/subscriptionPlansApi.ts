import { axiosInstance, handleApiResponse } from '@/lib/api/axios';

/**
 * Subscription plan interface (based on DB schema)
 */
export interface SubscriptionPlan {
  id: string;
  planName: string; // LIGHT, STANDARD, PREMIUM
  displayName: string; // Light, Standard, Premium
  description: string;
  originalPrice: number; // Price before VAT
  vat: number; // VAT
  totalPrice: number; // Final price (VAT included)
  baseTickets: number; // Base prediction tickets
  bonusTickets: number; // Bonus prediction tickets
  totalTickets: number; // Total prediction tickets
  matrixTickets: number; // Number of comprehensive prediction tickets (1 per 5,000 KRW)
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get subscription plan list (authentication not required)
 */
export default class SubscriptionPlansApi {
  /**
   * Get subscription plan list (authentication not required)
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await axiosInstance.get('/subscriptions/plans');
    const data = handleApiResponse<SubscriptionPlan[] | { plans?: SubscriptionPlan[] }>(response);
    return Array.isArray(data) ? data : (data as { plans?: SubscriptionPlan[] })?.plans ?? [];
  }
}
