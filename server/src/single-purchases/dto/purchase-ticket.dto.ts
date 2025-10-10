import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * 예측권 구매 DTO
 */
export class PurchaseTicketDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number; // 구매 개수 (기본 1개)

  @IsOptional()
  @IsString()
  paymentMethod?: string; // 결제 수단

  @IsOptional()
  @IsString()
  pgTransactionId?: string; // PG사 거래 ID (결제 완료 후)
}

