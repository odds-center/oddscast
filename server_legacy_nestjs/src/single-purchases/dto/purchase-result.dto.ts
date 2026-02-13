import { PredictionTicket } from '../../prediction-tickets/entities/prediction-ticket.entity';

/**
 * 구매 결과 DTO
 */
export class PurchaseResultDto {
  purchaseId: string;
  tickets: PredictionTicket[];
  totalAmount: number;
  paymentMethod: string;
  pgTransactionId: string;
  purchasedAt: Date;
}
