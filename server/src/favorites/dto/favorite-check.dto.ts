import { ApiProperty } from '@nestjs/swagger';
import { FavoriteResponseDto } from './favorite-response.dto';

export class FavoriteCheckDto {
  @ApiProperty({ description: '즐겨찾기 여부', example: true })
  isFavorite: boolean;

  @ApiProperty({
    description: '즐겨찾기 정보 (있는 경우)',
    type: FavoriteResponseDto,
    required: false,
  })
  favorite?: FavoriteResponseDto;
}
