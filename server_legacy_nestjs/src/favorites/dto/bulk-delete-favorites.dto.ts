import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class BulkDeleteFavoritesDto {
  @ApiProperty({
    description: '삭제할 즐겨찾기 ID 목록',
    example: ['favorite-1', 'favorite-2', 'favorite-3'],
  })
  @IsArray()
  @IsString({ each: true })
  favoriteIds: string[];
}
