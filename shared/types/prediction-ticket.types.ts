/**
 * 예측권 이력 응답 타입
 * PredictionTicket, TicketBalance는 subscription.types에 정의
 * webapp, mobile, admin, server
 */

import type { PredictionTicket } from './subscription.types';

export interface TicketHistoryResponse {
  tickets: PredictionTicket[];
  total: number;
  page: number;
  totalPages: number;
}
