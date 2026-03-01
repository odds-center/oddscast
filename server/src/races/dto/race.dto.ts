import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcName?: string;

  @ApiProperty({
    example: '서울',
    description: 'KRA API 기준 경마장명: 서울, 제주, 부산경남',
  })
  @IsString()
  meet: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetName?: string;

  @ApiProperty({ example: '20260212', description: 'YYYYMMDD' })
  @IsString()
  rcDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcDay?: string;

  @ApiProperty({ example: '01' })
  @IsString()
  rcNo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcDist?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rcPrize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weather?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  track?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateRaceDto extends PartialType(CreateRaceDto) {}

export class CreateRaceEntryDto {
  @ApiProperty()
  @IsString()
  hrNo: string;

  @ApiProperty()
  @IsString()
  hrName: string;

  @ApiProperty()
  @IsString()
  jkName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  wgBudam?: number;
}

export class RaceFilterDto {
  @ApiPropertyOptional({ description: '검색어 (rcName, meet, rcNo)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'YYYYMMDD 또는 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: '날짜 범위 시작 (YYYYMMDD)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: '날짜 범위 끝 (YYYYMMDD)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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
