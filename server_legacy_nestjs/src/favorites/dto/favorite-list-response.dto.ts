import { ApiProperty } from '@nestjs/swagger';
import { FavoriteResponseDto } from './favorite-response.dto';

export class FavoriteListResponseDto {
  @ApiProperty({ description: '즐겨찾기 목록', type: [FavoriteResponseDto] })
  favorites: FavoriteResponseDto[];

  @ApiProperty({ description: '총 개수', example: 25 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '총 페이지 수', example: 3 })
  totalPages: number;
}
