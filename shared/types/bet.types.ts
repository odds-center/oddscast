/**
 * 베팅 관련 공통 타입
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */

/**
 * 베팅 기록
 */
export interface Bet {
  id: string;
  userId: string;
  raceId: string;

  // 베팅 정보
  betType: string; // 승식 (단승, 연승, 복승, 쌍승, 삼복승, 삼쌍승)
  horses: string; // 선택한 말 (예: "1-2-3")
  amount: number; // 베팅 금액

  // 결과
  isWin?: boolean;
  dividend?: number; // 배당률
  payout?: number; // 환급금

  // 타임스탬프
  bettedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 베팅 생성 요청
 */
export interface CreateBetRequest {
  raceId: string;
  betType: string;
  horses: string;
  amount: number;
}

/**
 * 베팅 통계
 */
export interface BetStats {
  totalBets: number;
  totalAmount: number;
  totalPayout: number;
  winCount: number;
  loseCount: number;
  winRate: number; // %
  roi: number; // %
}

/**
 * 베팅 내역 응답
 */
export interface BetHistoryResponse {
  bets: Bet[];
  stats: BetStats;
  total: number;
  page: number;
  limit: number;
}
