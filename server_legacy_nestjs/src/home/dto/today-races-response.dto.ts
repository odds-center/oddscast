import { ApiProperty } from '@nestjs/swagger';
import { Race } from '../../races/entities/race.entity';

export class TrackConditionDto {
  @ApiProperty({ description: '날씨', example: 'sunny' })
  weather: string;

  @ApiProperty({ description: '온도', example: 22 })
  temperature: number;

  @ApiProperty({ description: '습도', example: 55 })
  humidity: number;

  @ApiProperty({ description: '트랙 상태', example: 'fast' })
  surface: string;
}

export class AIAnalysisDto {
  @ApiProperty({ description: 'AI 신뢰도 (%)', example: 78 })
  confidence: number;

  @ApiProperty({
    description: 'AI 추천 내용',
    example: '천리마(3번)를 중심으로 단승 및 연승복식 추천',
  })
  recommendation: string;

  @ApiProperty({ description: '예측 요인 목록' })
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
}

export class HorseBettingStatsDto {
  @ApiProperty({ description: '총 마권 구매 수', example: 1250 })
  totalBets: number;

  @ApiProperty({ description: '총 구매 금액 (원)', example: 25000000 })
  totalAmount: number;

  @ApiProperty({ description: '인기 순위 (1-5)', example: 1 })
  popularityRank: number;
}

export class HorseWithStatsDto {
  @ApiProperty({ description: '말 ID' })
  id: string;

  @ApiProperty({ description: '말 이름', example: '천리마' })
  horseName: string;

  @ApiProperty({ description: '기수 이름', example: '박태종' })
  jockey: string;

  @ApiProperty({ description: '조교사 이름', example: '김영수' })
  trainer: string;

  @ApiProperty({ description: '게이트 번호', example: 3 })
  gateNumber: number;

  @ApiProperty({ description: '예측률', example: 85 })
  predictionRate: number;

  @ApiProperty({ description: '마령', example: 4 })
  age: number;

  @ApiProperty({ description: '마체중 (kg)', example: 520 })
  weight: number;

  @ApiProperty({ description: '총 출전횟수', example: 25 })
  totalRaces: number;

  @ApiProperty({ description: '1착 횟수', example: 8 })
  wins: number;

  @ApiProperty({ description: '승률', example: 32 })
  winRate: number;

  @ApiProperty({ description: 'AI 예측 점수 (0-100)', example: 92 })
  aiScore: number;

  @ApiProperty({ description: '최근 컨디션', example: '1-1-2' })
  form: string;

  @ApiProperty({ description: '평균 속도 (m/s)', example: 16.5 })
  avgSpeed: number;

  @ApiProperty({ description: '최근 경주 기록' })
  recentRecords: Array<{
    date: string;
    venue: string;
    rank: number;
    time: string;
  }>;

  @ApiProperty({ description: '마권 구매 통계' })
  bettingStats: HorseBettingStatsDto;
}

export class RaceWithAnalysisDto extends Race {
  @ApiProperty({ description: '트랙 컨디션' })
  trackCondition: TrackConditionDto;

  @ApiProperty({ description: 'AI 분석' })
  aiAnalysis: AIAnalysisDto;

  @ApiProperty({ description: '출전마 목록 (베팅 통계 포함)' })
  horses: HorseWithStatsDto[];
}

export class TodayRacesResponseDto {
  @ApiProperty({ description: '오늘의 경주 목록' })
  races: RaceWithAnalysisDto[];

  @ApiProperty({ description: '총 경주 수', example: 5 })
  total: number;

  @ApiProperty({ description: '조회 날짜', example: '2025-01-11' })
  date: string;
}
