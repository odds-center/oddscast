import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 즐겨찾기 = 경주(경기)만 지원 */
const ALLOWED_TYPE = ['RACE'] as const;

export class CreateFavoriteDto {
  @ApiProperty({ enum: ['RACE'], description: '경주만 지원' })
  @IsIn(ALLOWED_TYPE, { message: '즐겨찾기는 경주(RACE)만 지원합니다.' })
  type: string;

  @ApiProperty()
  @IsString()
  targetId: string;

  @ApiProperty()
  @IsString()
  targetName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  targetData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateFavoriteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  targetData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class ToggleFavoriteDto {
  @ApiProperty({ enum: ['RACE'], description: '경주만 지원' })
  @IsIn(ALLOWED_TYPE, { message: '즐겨찾기는 경주(RACE)만 지원합니다.' })
  type: string;

  @ApiProperty()
  @IsString()
  targetId: string;

  @ApiProperty()
  @IsString()
  targetName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  targetData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
