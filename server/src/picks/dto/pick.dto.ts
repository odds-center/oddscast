import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickType } from '../../database/db-enums';

export const PICK_TYPE_HORSE_COUNTS: Record<PickType, number> = {
  SINGLE: 1,
  PLACE: 1,
  QUINELLA: 2,
  EXACTA: 2,
  QUINELLA_PLACE: 2,
  TRIFECTA: 3,
  TRIPLE: 3,
};

export class CreatePickDto {
  @ApiProperty({ description: '경주 ID' })
  @IsNumber()
  @Type(() => Number)
  raceId: number;

  @ApiProperty({
    enum: [
      'SINGLE',
      'PLACE',
      'QUINELLA',
      'EXACTA',
      'QUINELLA_PLACE',
      'TRIFECTA',
      'TRIPLE',
    ],
  })
  @IsEnum([
    'SINGLE',
    'PLACE',
    'QUINELLA',
    'EXACTA',
    'QUINELLA_PLACE',
    'TRIFECTA',
    'TRIPLE',
  ])
  pickType: PickType;

  @ApiProperty({ description: '고른 마번 배열', example: ['1', '5'] })
  @IsArray()
  @IsString({ each: true })
  hrNos: string[];

  @ApiPropertyOptional({ description: '마명 배열 (표시용)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hrNames?: string[];
}
