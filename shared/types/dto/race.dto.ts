/**
 * Race API 응답 DTO
 * 서버 응답 구조에 맞춤 (KRA API 필드명 기준)
 */

/** 경주 목록/상세 응답 DTO */
export interface RaceDto {
  id: string;
  meet: string;
  meetName?: string;
  rcDate: string;
  rcNo: string;
  rcName?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  rcPrize?: number;
  stTime?: string;
  rcDay?: string;
  weather?: string;
  track?: string;
  status?: string;
  /** @deprecated Use `status`. Server sets both for backward compatibility. */
  raceStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 출전마 DTO */
export interface RaceEntryDto {
  id: string;
  raceId: number;
  hrNo: string;
  hrName: string;
  hrNameEn?: string;
  jkName: string;
  jkNameEn?: string;
  trName?: string;
  trNameEn?: string;
  owName?: string;
  wgBudam?: number;
  ratingHistory?: number[] | null; // KRA API77: [rating2, rating3, rating4]
  chulNo?: string;
  dusu?: number;
  age?: number;
  sex?: string;
  prd?: string;
  chaksun1?: number;
  chaksunT?: number;
  rcCntT?: number;
  ord1CntT?: number;
  budam?: string;
  rating?: number;
  horseWeight?: string;
}

/** 경주 결과 DTO */
export interface RaceResultDto {
  id: string;
  raceId: number;
  ord?: string;
  ordInt?: number;
  ordType?: string | null; // NORMAL|FALL|DQ|WITHDRAWN
  hrNo: string;
  hrName: string;
  chulNo?: string;
  jkName?: string;
  trName?: string;
  owName?: string;
  wgBudam?: number;
  wgHr?: string; // 마체감량 (e.g. 502(-2))
  rcTime?: string;
  diffUnit?: string; // 착차
  winOdds?: number; // 단승식배당율
  plcOdds?: number; // 복승식배당율
  chaksun1?: number;
  track?: string;
  weather?: string;
}

/** 배당 DTO */
export interface DividendDto {
  id: string;
  raceId: number;
  pool?: string;
  poolName?: string;
  chulNo?: string;
  chulNo2?: string;
  chulNo3?: string;
  odds?: number;
}

/** 경주 상세 응답 DTO (entries, results 포함) */
export interface RaceDetailDto extends RaceDto {
  entries?: RaceEntryDto[];
  /** @deprecated Use `entries`. Alias kept for backward compatibility. */
  entryDetails?: RaceEntryDto[];
  results?: RaceResultDto[];
  dividends?: DividendDto[];
  /** @deprecated Use `dividends`. Alias kept for backward compatibility. */
  dividendRates?: DividendDto[];
}

/** 경주 목록 응답 DTO */
export interface RaceListResponseDto {
  races: RaceDto[];
  total: number;
  page: number;
  totalPages: number;
}
