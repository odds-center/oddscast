import { IsString, IsOptional } from 'class-validator';

/**
 * 구독 취소 DTO
 */
export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string; // 취소 사유
}
