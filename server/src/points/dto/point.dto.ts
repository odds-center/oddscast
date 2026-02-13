import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
  Min,
} from 'class-validator';
import { PointTransactionType, PointStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePointTransactionDto {
  @ApiProperty({ enum: PointTransactionType })
  @IsEnum(PointTransactionType)
  type: PointTransactionType;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePointTransactionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: PointStatus })
  @IsOptional()
  @IsEnum(PointStatus)
  status?: PointStatus;
}

export class PointTransferDto {
  @ApiProperty()
  @IsString()
  toUserId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;
}

export class PurchaseTicketDto {
  @ApiProperty({ description: '구매 수량', default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PointAdjustmentDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ enum: ['ADMIN_ADJUSTMENT', 'REFUND', 'CORRECTION'] })
  @IsString()
  type: 'ADMIN_ADJUSTMENT' | 'REFUND' | 'CORRECTION';
}
