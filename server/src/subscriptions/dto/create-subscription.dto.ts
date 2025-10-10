import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SubscriptionPlan } from '../entities/subscription.entity';

/**
 * 구독 생성 DTO
 */
export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  planId?: SubscriptionPlan;

  @IsOptional()
  @IsString()
  billingKey?: string; // Toss Payments 빌링키 (결제 완료 후 발급)
}
