import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { BetType } from '../entities/bet.entity';

export class BetSelectionsDto {
  @ApiProperty({ description: '선택한 마번들', type: [String] })
  @IsArray()
  @IsString({ each: true })
  horses: string[];

  @ApiProperty({
    description: '순서 (쌍승식 마권의 경우)',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  positions?: number[];

  @ApiProperty({
    description: '조합 (복합 마권의 경우)',
    type: [[String]],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsArray({ each: true })
  @IsString({ each: true })
  combinations?: string[][];
}

export class CreateBetDto {
  @ApiProperty({ description: '경주 ID' })
  @IsString()
  raceId: string;

  @ApiProperty({ description: '승식', enum: BetType })
  @IsEnum(BetType)
  betType: BetType;

  @ApiProperty({ description: '마권명' })
  @IsString()
  betName: string;

  @ApiProperty({ description: '마권 설명', required: false })
  @IsOptional()
  @IsString()
  betDescription?: string;

  @ApiProperty({ description: '마권 금액 (포인트)' })
  @IsNumber()
  @Min(100)
  betAmount: number;

  @ApiProperty({ description: '선택 정보' })
  @IsObject()
  selections: BetSelectionsDto;

  @ApiProperty({ description: '마권 구매 이유', required: false })
  @IsOptional()
  @IsString()
  betReason?: string;

  @ApiProperty({ description: '신뢰도 (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceLevel?: number;

  @ApiProperty({ description: '분석 데이터', required: false })
  @IsOptional()
  @IsObject()
  analysisData?: any;

  @ApiProperty({ description: '사용자 ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
