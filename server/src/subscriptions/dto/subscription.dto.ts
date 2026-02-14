import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiPropertyOptional({ description: '플랜 ID (생략 시 기본 플랜)' })
  @IsOptional()
  planId?: string | number;

  @ApiPropertyOptional({ description: 'PG 빌링키 (결제 후 전달)' })
  @IsOptional()
  @IsString()
  billingKey?: string;
}

export class ActivateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'PG 빌링키 (subscribe 시 이미 있으면 생략 가능)',
  })
  @IsOptional()
  @IsString()
  billingKey?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: '취소 사유' })
  @IsOptional()
  @IsString()
  reason?: string;
}
