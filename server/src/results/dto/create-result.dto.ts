import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateResultDto {
  @ApiProperty({ description: '경주 ID', example: 'race-123' })
  @IsString()
  raceId: string;

  @ApiProperty({ description: '경주일 (YYYYMMDD)', example: '20250111' })
  @IsString()
  rcDate: string;

  @ApiProperty({ description: '경주번호', example: '1' })
  @IsString()
  rcNo: string;

  @ApiProperty({ description: '경주명', example: '1경주' })
  @IsString()
  rcName: string;

  @ApiProperty({ description: '경주장 코드', example: '1' })
  @IsString()
  meet: string;

  @ApiProperty({ description: '경주장명', example: '서울' })
  @IsString()
  meetName: string;

  @ApiProperty({ description: '경주 거리', example: '1200' })
  @IsString()
  rcDist: string;

  @ApiProperty({ description: '순위', example: '1' })
  @IsString()
  rcRank: string;

  @ApiProperty({ description: '마명', example: '천리마' })
  @IsString()
  hrName: string;

  @ApiProperty({ description: '마번', example: '3' })
  @IsString()
  hrNo: string;

  @ApiProperty({ description: '기수명', example: '김기수' })
  @IsString()
  jkName: string;

  @ApiProperty({ description: '조교사명', example: '이조교' })
  @IsString()
  trName: string;

  @ApiProperty({ description: '기록 (시간)', example: '1:11.2' })
  @IsString()
  rcTime: string;

  @ApiProperty({ description: '착순', example: '1' })
  @IsString()
  ord: string;

  @ApiProperty({ description: '상금', required: false })
  @IsOptional()
  @IsNumber()
  rcPrize?: number;

  @ApiProperty({ description: '단승 배당률', required: false })
  @IsOptional()
  @IsNumber()
  winOdds?: number;

  @ApiProperty({ description: '복승 배당률', required: false })
  @IsOptional()
  @IsNumber()
  plcOdds?: number;
}
