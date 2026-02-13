import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { FavoriteType } from '../entities/favorite.entity';

export class FavoriteToggleDto {
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
}
