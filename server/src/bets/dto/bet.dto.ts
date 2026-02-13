import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BetType, BetStatus, BetResult } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class SelectionsDto {
  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  horses: string[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  positions?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  combinations?: string[][];
}

export class CreateBetDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  raceId: number;

  @ApiProperty({ enum: BetType })
  @IsEnum(BetType)
  betType: BetType;

  @ApiProperty()
  @IsString()
  betName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  betDescription?: string;

  @ApiProperty()
  @IsNumber()
  betAmount: number;

  @ApiProperty({ type: SelectionsDto })
  @ValidateNested()
  @Type(() => SelectionsDto)
  selections: SelectionsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  betReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidenceLevel?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  analysisData?: any;
}

export class UpdateBetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  betName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  betDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  betAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  betReason?: string;

  @ApiProperty({ required: false, enum: BetStatus })
  @IsOptional()
  @IsEnum(BetStatus)
  betStatus?: BetStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BetFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  raceId?: number;

  @ApiProperty({ required: false, enum: BetType })
  @IsOptional()
  @IsEnum(BetType)
  betType?: BetType;

  @ApiProperty({ required: false, enum: BetStatus })
  @IsOptional()
  @IsEnum(BetStatus)
  betStatus?: BetStatus;

  @ApiProperty({ required: false, enum: BetResult })
  @IsOptional()
  @IsEnum(BetResult)
  betResult?: BetResult;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class CreateBetSlipDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  raceId: number;

  // Assuming bets in a slip are simplified or refer to CreateBetDto structure
  // For simplicity, using any[] here but should be typed strictly if possible
  @ApiProperty()
  @IsArray()
  bets: any[];
}
