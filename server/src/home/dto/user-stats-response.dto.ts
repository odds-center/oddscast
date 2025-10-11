import { ApiProperty } from '@nestjs/swagger';

export class BetStatisticsDto {
  @ApiProperty({ description: '총 베팅 수', example: 150 })
  totalBets: number;

  @ApiProperty({ description: '승리한 베팅 수', example: 45 })
  wonBets: number;

  @ApiProperty({ description: '패배한 베팅 수', example: 105 })
  lostBets: number;

  @ApiProperty({ description: '승률 (%)', example: 30.0 })
  winRate: number;

  @ApiProperty({ description: '총 수익 (원)', example: 1250000 })
  totalWinnings: number;

  @ApiProperty({ description: '총 손실 (원)', example: 750000 })
  totalLosses: number;

  @ApiProperty({ description: 'ROI (투자 수익률 %)', example: 25.0 })
  roi: number;

  @ApiProperty({ description: '평균 베팅 금액 (원)', example: 10000 })
  averageBetAmount: number;

  @ApiProperty({ description: '최대 승리 금액 (원)', example: 500000 })
  maxWin: number;

  @ApiProperty({ description: '최대 손실 금액 (원)', example: 100000 })
  maxLoss: number;

  @ApiProperty({ description: '현재 연승 횟수', example: 3 })
  currentStreak: number;

  @ApiProperty({ description: '최대 연승 횟수', example: 7 })
  maxStreak: number;

  @ApiProperty({ description: '베팅 타입별 통계' })
  betsByType: {
    [betType: string]: {
      count: number;
      winRate: number;
      totalAmount: number;
    };
  };

  @ApiProperty({ description: '월별 베팅 통계' })
  monthlyStats: Array<{
    month: string;
    bets: number;
    wins: number;
    winRate: number;
    amount: number;
    profit: number;
  }>;
}

export class UserStatsResponseDto {
  @ApiProperty({ description: '베팅 통계' })
  betStatistics: BetStatisticsDto;

  @ApiProperty({ description: '구독 여부', example: true })
  isSubscribed: boolean;

  @ApiProperty({ description: '구독 플랜', example: 'PREMIUM', nullable: true })
  subscriptionPlan: string | null;

  @ApiProperty({
    description: '구독 만료일',
    example: '2025-02-11T00:00:00.000Z',
    nullable: true,
  })
  subscriptionExpiry: Date | null;
}
