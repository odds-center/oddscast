import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePredictionDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  raceId: number;

  @ApiPropertyOptional({ description: '{ horseScores: [...] }' })
  @IsOptional()
  @IsObject()
  scores?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  analysis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preview?: string;
}

export class UpdatePredictionStatusDto {
  @ApiProperty({ enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  scores?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  analysis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accuracy?: number;

  @ApiPropertyOptional({ description: '검수 완료 시 true — preview API에서만 반환' })
  @IsOptional()
  @IsBoolean()
  previewApproved?: boolean;
}

export class PredictionFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AccuracyHistoryFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
