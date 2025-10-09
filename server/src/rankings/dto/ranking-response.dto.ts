import { ApiProperty } from '@nestjs/swagger';
import { RankingType } from '../entities/user-ranking.entity';

export class RankingUserDto {
  @ApiProperty({ description: '랭킹 ID' })
  id: string;

  @ApiProperty({ description: '순위' })
  rank: number;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;

  @ApiProperty({ description: '사용자 아바타', required: false })
  avatar?: string;

  @ApiProperty({ description: '승률 (%)' })
  winRate: number;

  @ApiProperty({ description: '총 베팅 수' })
  totalBets: number;

  @ApiProperty({ description: '총 수익' })
  totalWinnings: number;

  @ApiProperty({ description: '현재 사용자 여부' })
  isCurrentUser: boolean;

  @ApiProperty({ description: '점수' })
  score: number;

  @ApiProperty({ description: 'ROI (%)' })
  roi: number;
}

export class RankingsResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ type: [RankingUserDto], description: '랭킹 목록' })
  data: RankingUserDto[];

  @ApiProperty({ description: '전체 항목 수' })
  total: number;

  @ApiProperty({ enum: RankingType, description: '랭킹 타입' })
  type: RankingType;

  @ApiProperty({ description: '현재 페이지', required: false })
  page?: number;

  @ApiProperty({ description: '페이지당 항목 수', required: false })
  limit?: number;
}

export class MyRankingResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ type: RankingUserDto, description: '내 랭킹 정보' })
  data: RankingUserDto;
}
