import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateResultDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  raceId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ord?: string;

  @ApiPropertyOptional({ description: 'NORMAL|FALL|DQ|WITHDRAWN' })
  @IsOptional()
  @IsString()
  ordType?: string;

  @ApiProperty()
  @IsString()
  hrNo: string;

  @ApiProperty()
  @IsString()
  hrName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jkName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  chaksun1?: number;
}

export class UpdateResultDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ord?: string;

  @ApiPropertyOptional({ description: 'NORMAL|FALL|DQ|WITHDRAWN' })
  @IsOptional()
  @IsString()
  ordType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  chaksun1?: number;
}

export class BulkCreateResultDto {
  @ApiProperty({ type: [CreateResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResultDto)
  results: CreateResultDto[];
}

export class ResultFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meet?: string;

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
}

export class ResultStatisticsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meet?: string;
}

export class ResultSearchDto {
  @ApiPropertyOptional({ description: '마명, 마번, 기수명 검색' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meet?: string;

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
}

export class BulkUpdateResultItemDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ord?: string;

  @ApiPropertyOptional({ description: 'NORMAL|FALL|DQ|WITHDRAWN' })
  @IsOptional()
  @IsString()
  ordType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  chaksun1?: number;
}

export class BulkUpdateResultDto {
  @ApiProperty({ type: [BulkUpdateResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateResultItemDto)
  updates: BulkUpdateResultItemDto[];
}
