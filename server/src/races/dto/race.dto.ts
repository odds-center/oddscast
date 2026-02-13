import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  raceName?: string;

  @ApiProperty({ example: 'SEO', description: '서울/부산/제주 코드' })
  @IsString()
  meet: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetName?: string;

  @ApiProperty({ example: '20260212', description: 'YYYYMMDD' })
  @IsString()
  rcDate: string;

  @ApiProperty({ example: '01' })
  @IsString()
  rcNo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcDist?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcGrade?: string;

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
  trackState?: string;
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
  owName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;
}

export class RaceFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

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
