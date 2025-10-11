import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRaceDto {
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

  @ApiProperty({ description: '경주 시간', example: '14:00', required: false })
  @IsOptional()
  @IsString()
  rcTime?: string;

  @ApiProperty({ description: '경주 시작 시간', example: '14:00', required: false })
  @IsOptional()
  @IsString()
  rcStartTime?: string;

  @ApiProperty({ description: '경주 상태', example: 'scheduled', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '경주 등급', example: 'G1', required: false })
  @IsOptional()
  @IsString()
  rcGrade?: string;

  @ApiProperty({ description: '출주 마필 수', required: false })
  @IsOptional()
  @IsNumber()
  rcEntry?: number;
}

