import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * 결제 취소 DTO
 */
export class CancelPaymentDto {
  @IsString()
  paymentKey: string; // Toss 결제 키

  @IsString()
  cancelReason: string; // 취소 사유

  @IsOptional()
  @IsNumber()
  @Min(100)
  cancelAmount?: number; // 취소 금액 (부분 취소 가능)
}
