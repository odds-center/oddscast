import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsArray } from 'class-validator';

export class UpdateFavoriteDto {
  @ApiProperty({
    description: '대상 이름',
    example: '천리마',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetName?: string;

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
