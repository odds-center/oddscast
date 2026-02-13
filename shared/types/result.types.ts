/**
 * 경주 결과 공통 타입
 * webapp, mobile, admin, server
 */

export interface RaceResultItem {
  id: string;
  raceId: string;
  ord: string | number;
  hrNo: string;
  hrName: string;
  jkName?: string;
  trName?: string;
  owName?: string;
  rcRank?: string;
  rcTime?: string;
  rcPrize?: number;
  rcDist?: string;
  rank?: string; // KRA: 등급조건 (기존 rcGrade)
  rcCondition?: string;
}

export interface ResultListResponse {
  results: RaceResultItem[];
  total: number;
  page: number;
  totalPages: number;
}
