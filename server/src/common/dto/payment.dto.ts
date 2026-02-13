import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
}
