/**
 * 예측권 잔액 DTO
 */
export class TicketBalanceDto {
  userId: string;
  availableTickets: number;
  usedTickets: number;
  expiredTickets: number;
  totalTickets: number;
}
