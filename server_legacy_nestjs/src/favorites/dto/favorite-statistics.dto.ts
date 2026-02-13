import { ApiProperty } from '@nestjs/swagger';
import { FavoriteType } from '../entities/favorite.entity';

export class FavoriteStatisticsDto {
  @ApiProperty({ description: '전체 즐겨찾기 개수', example: 25 })
  totalFavorites: number;

  @ApiProperty({
    description: '타입별 즐겨찾기 개수',
    example: {
      HORSE: 15,
      JOCKEY: 5,
      TRAINER: 3,
      RACE: 2,
    },
  })
  favoritesByType: Record<FavoriteType, number>;

  @ApiProperty({ description: '최근 추가된 즐겨찾기 개수 (7일)', example: 3 })
  recentFavorites: number;

  @ApiProperty({ description: '가장 많이 즐겨찾기된 타입', example: 'HORSE' })
  mostFavoritedType: FavoriteType;
}
