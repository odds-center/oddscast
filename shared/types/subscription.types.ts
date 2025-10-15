/**
 * 구독 관련 공통 타입
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */

/**
 * 구독 플랜
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  ticketCount: number; // 포함된 예측권 수
  bonusTickets: number; // 보너스 예측권
  description?: string;
  features?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 사용자 구독
 */
export interface Subscription {
  id: string;
  userId: string;
  planId: string;

  // 상태
  status: 'active' | 'cancelled' | 'expired';

  // 기간
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;

  // 결제
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;

  // 타임스탬프
  createdAt: Date;
  updatedAt?: Date;
  cancelledAt?: Date;
}

/**
 * 구독 생성 요청
 */
export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethod?: string;
}

/**
 * 예측권
 */
export interface PredictionTicket {
  id: string;
  userId: string;

  // 티켓 정보
  source: 'subscription' | 'single_purchase' | 'bonus';
  sourceId?: string; // 구독 ID 또는 개별 구매 ID

  // 상태
  isUsed: boolean;
  usedAt?: Date;
  usedForRaceId?: string;
  usedForPredictionId?: string;

  // 유효기간
  expiresAt?: Date;

  // 타임스탬프
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 예측권 잔액
 */
export interface TicketBalance {
  totalTickets: number;
  availableTickets: number;
  usedTickets: number;
  expiredTickets: number;
}

/**
 * 개별 구매
 */
export interface SinglePurchase {
  id: string;
  userId: string;

  // 구매 정보
  ticketCount: number;
  price: number;
  totalPrice: number;

  // 결제
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate?: Date;

  // 타임스탬프
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 개별 구매 요청
 */
export interface CreateSinglePurchaseRequest {
  ticketCount: number;
  paymentMethod?: string;
}
