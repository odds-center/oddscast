import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { BetResult, BetStatus } from '../entities/bet.entity';

export class UpdateBetDto {
  @ApiProperty({ description: '마권 상태', enum: BetStatus, required: false })
  @IsOptional()
  @IsEnum(BetStatus)
  betStatus?: BetStatus;

  @ApiProperty({ description: '마권 결과', enum: BetResult, required: false })
  @IsOptional()
  @IsEnum(BetResult)
  betResult?: BetResult;

  @ApiProperty({ description: '실제 당첨금', required: false })
  @IsOptional()
  @IsNumber()
  actualWin?: number;

  @ApiProperty({ description: '실제 배당률', required: false })
  @IsOptional()
  @IsNumber()
  actualOdds?: number;

  @ApiProperty({ description: '경주 결과', required: false })
  @IsOptional()
  @IsObject()
  raceResult?: any;

  @ApiProperty({ description: '메모', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
