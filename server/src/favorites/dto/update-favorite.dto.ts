import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { FavoritePriority } from '../entities/favorite.entity';

export class UpdateFavoriteDto {
  @ApiProperty({
    description: '대상 이름',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetName?: string;

  @ApiProperty({
    description: '대상 상세 데이터',
    required: false,
  })
  @IsOptional()
  targetData?: any;

  @ApiProperty({
    description: '메모',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: '우선순위',
    enum: FavoritePriority,
    required: false,
  })
  @IsEnum(FavoritePriority)
  @IsOptional()
  priority?: FavoritePriority;

  @ApiProperty({
    description: '태그 목록',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
