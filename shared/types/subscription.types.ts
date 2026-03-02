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
 * 예측권 (서버 API 응답 형식)
 */
export interface PredictionTicket {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  usedAt?: string | null;
  raceId?: string | null;
  predictionId?: string | null;
  issuedAt: string;
  expiresAt: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * 예측권 잔액 (available/used/expired/total 호환)
 */
export interface TicketBalance {
  totalTickets?: number;
  total?: number;
  availableTickets?: number;
  available?: number;
  usedTickets?: number;
  used?: number;
  expiredTickets?: number;
  expired?: number;
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
