import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFavoriteDto } from './create-favorite.dto';

export class BulkAddFavoritesDto {
  @ApiProperty({
    description: '추가할 즐겨찾기 목록',
    type: [CreateFavoriteDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFavoriteDto)
  favorites: CreateFavoriteDto[];
}
