import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { FavoriteType } from '../entities/favorite.entity';

export class CreateFavoriteDto {
  @ApiProperty({
    description: '즐겨찾기 타입',
    enum: FavoriteType,
    example: FavoriteType.HORSE,
  })
  @IsEnum(FavoriteType)
  type: FavoriteType;

  @ApiProperty({
    description: '대상 ID',
    example: 'horse-123',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: '대상 이름',
    example: '천리마',
  })
  @IsString()
  targetName: string;

  @ApiProperty({
    description: '추가 대상 데이터',
    example: { venue: '제주', grade: 'G3' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  targetData?: Record<string, any>;

  @ApiProperty({
    description: '메모',
    example: '우수한 성적을 보이는 말',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: '태그 목록',
    example: ['빠른말', '안정적'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
