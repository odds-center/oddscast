import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { FavoritePriority, FavoriteType } from '../entities/favorite.entity';

export class CreateFavoriteDto {
  @ApiProperty({
    description: '즐겨찾기 유형',
    enum: FavoriteType,
    example: 'HORSE',
  })
  @IsEnum(FavoriteType)
  @IsNotEmpty()
  type: FavoriteType;

  @ApiProperty({
    description: '대상 ID',
    example: 'HORSE_123456',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: '대상 이름',
    example: '천둥번개',
  })
  @IsString()
  @IsNotEmpty()
  targetName: string;

  @ApiProperty({
    description: '대상 상세 데이터',
    required: false,
  })
  @IsOptional()
  targetData?: any;

  @ApiProperty({
    description: '메모',
    required: false,
    example: '이번 시즌 유망주',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: '우선순위',
    enum: FavoritePriority,
    required: false,
    default: 'MEDIUM',
  })
  @IsEnum(FavoritePriority)
  @IsOptional()
  priority?: FavoritePriority;

  @ApiProperty({
    description: '태그 목록',
    required: false,
    example: ['유망주', '2024'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
