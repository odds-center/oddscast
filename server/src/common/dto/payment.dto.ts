import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class PurchaseDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pgTransactionId?: string;
}

export class PaymentSubscribeDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiProperty()
  @IsString()
  paymentMethod: string;
}

export class PaymentPurchaseDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pgTransactionId?: string;
}

export class UseTicketDto {
  @ApiProperty()
  @IsString()
  raceId: string;

  /** true 시 기존 예측 무시하고 새로 AI 예측 생성 (다시 예측, 예측권 1장 추가 소비) */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  regenerate?: boolean;
}
