import { IsString, IsNumber, Min } from 'class-validator';

/**
 * 빌링키 결제 DTO
 */
export class BillingPaymentDto {
  @IsString()
  billingKey: string; // 빌링키

  @IsNumber()
  @Min(100)
  amount: number; // 결제 금액

  @IsString()
  orderName: string; // 주문명
}
