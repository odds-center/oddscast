import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SubscriptionPlan } from '../entities/subscription.entity';

/**
 * 구독 생성 DTO
 */
export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  planId?: string; // 플랜 ID (UUID)

  @IsOptional()
  @IsString()
  billingKey?: string; // Toss Payments 빌링키 (결제 완료 후 발급)

  @IsOptional()
  @IsString()
  cardLast4?: string; // 카드 뒷 4자리
}
