import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefundRequestDto {
  @ApiProperty({ description: 'BillingHistory ID to refund' })
  @IsInt()
  @Type(() => Number)
  billingHistoryId!: number;

  @ApiProperty({ description: 'User reason for refund request (min 10 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  userReason!: string;
}

export class ProcessRefundDto {
  @ApiProperty({ required: false, description: 'Admin note or rejection reason' })
  @IsOptional()
  @IsString()
  adminNote?: string;

  @ApiProperty({ required: false, description: 'Override approved amount in Korean won' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  approvedAmount?: number;
}
