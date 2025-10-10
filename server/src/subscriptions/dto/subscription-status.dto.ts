import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';

/**
 * 구독 상태 DTO
 */
export class SubscriptionStatusDto {
  id: string;
  userId: string;
  planId: SubscriptionPlan;
  price: number;
  status: SubscriptionStatus;
  nextBillingDate: Date | null;
  lastBilledAt: Date | null;
  startedAt: Date;
  cancelledAt: Date | null;

  // 추가 정보
  isActive: boolean;
  monthlyTickets: number;
  daysUntilRenewal: number | null;
}

