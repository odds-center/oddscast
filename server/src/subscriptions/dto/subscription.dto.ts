import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiPropertyOptional({ description: '플랜 이름 (LIGHT, PREMIUM)' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingKey?: string;
}

export class ActivateSubscriptionDto {
  @ApiProperty()
  @IsString()
  billingKey: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
