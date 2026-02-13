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
  hrNo: string;
  hrName: string;
  chulNo?: string;
  jkName?: string;
  trName?: string;
  owName?: string;
  wgBudam?: number;
  rcTime?: string;
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
  entryDetails?: RaceEntryDto[];
  results?: RaceResultDto[];
  dividendRates?: DividendDto[];
  dividends?: DividendDto[];
}

/** 경주 목록 응답 DTO */
export interface RaceListResponseDto {
  races: RaceDto[];
  total: number;
  page: number;
  totalPages: number;
}
