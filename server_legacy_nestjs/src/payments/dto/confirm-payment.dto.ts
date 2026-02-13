import { IsString, IsNumber, Min } from 'class-validator';

/**
 * 결제 승인 DTO
 */
export class ConfirmPaymentDto {
  @IsString()
  paymentKey: string; // Toss 결제 키

  @IsString()
  orderId: string; // 주문 ID

  @IsNumber()
  @Min(100)
  amount: number; // 결제 금액
}

