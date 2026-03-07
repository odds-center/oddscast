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
    betType: string;
    horses: string;
    amount: number;
    isWin?: boolean;
    dividend?: number;
    payout?: number;
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
    winRate: number;
    roi: number;
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
//# sourceMappingURL=bet.types.d.ts.map