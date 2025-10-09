import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RankingType } from '../entities/user-ranking.entity';

export class RankingQueryDto {
  @ApiPropertyOptional({
    enum: RankingType,
    description: '랭킹 타입',
    default: RankingType.OVERALL,
  })
  @IsEnum(RankingType)
  @IsOptional()
  type?: RankingType = RankingType.OVERALL;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '페이지 번호',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;
}
