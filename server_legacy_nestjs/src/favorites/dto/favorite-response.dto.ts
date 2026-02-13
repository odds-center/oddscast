import { ApiProperty } from '@nestjs/swagger';
import { Favorite, FavoriteType } from '../entities/favorite.entity';

export class FavoriteResponseDto {
  @ApiProperty({ description: '즐겨찾기 ID', example: 'favorite-123' })
  id: string;

  @ApiProperty({ description: '사용자 ID', example: 'user-123' })
  userId: string;

  @ApiProperty({
    description: '즐겨찾기 타입',
    enum: FavoriteType,
    example: FavoriteType.HORSE,
  })
  type: FavoriteType;

  @ApiProperty({ description: '대상 ID', example: 'horse-123' })
  targetId: string;

  @ApiProperty({ description: '대상 이름', example: '천리마' })
  targetName: string;

  @ApiProperty({
    description: '추가 대상 데이터',
    example: { venue: '제주', grade: 'G3' },
    required: false,
  })
  targetData?: Record<string, any>;

  @ApiProperty({
    description: '메모',
    example: '우수한 성적을 보이는 말',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: '태그 목록',
    example: ['빠른말', '안정적'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  constructor(favorite: Favorite) {
    this.id = favorite.id;
    this.userId = favorite.userId;
    this.type = favorite.type;
    this.targetId = favorite.targetId;
    this.targetName = favorite.targetName;
    this.targetData = favorite.targetData;
    this.notes = favorite.notes;
    this.tags = favorite.tags;
    this.createdAt = favorite.createdAt;
    this.updatedAt = favorite.updatedAt;
  }
}
