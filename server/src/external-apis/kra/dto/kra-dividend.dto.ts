// KRA API160_1 확정배당율 통합 정보 응답 DTO
// Swagger 문서 기반 정확한 응답 구조 정의
export class KraDividendResponseDto {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: {
      item: KraDividendItem[] | KraDividendItem; // API 응답에 따라 단일 또는 배열
    };
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
}

// 확정배당율 상세 정보 (API160_1 응답 명세에 맞춤)
export class KraDividendItem {
  odds: string; // 확정배당율
  pool: string; // 승식구분 (WIN, PLC, QPL, QNL, EXA, TLA, TRI)
  chulNo: string; // 1착마 출주번호
  chulNo2: string; // 2착마 출주번호 (복승식 이상)
  chulNo3: string; // 3착마 출주번호 (삼복승식, 삼쌍승식)
  rcNo: string; // 경주번호
  meet: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)
  rcDate: string; // 경주일 (YYYYMMDD)
}

// 요청 파라미터 DTO (API160_1 요청 명세에 맞춤)
export class KraDividendQueryDto {
  ServiceKey: string; // 공공데이터포털 인증키 (필수)
  pageNo: string; // 페이지번호 (필수)
  numOfRows: string; // 한 페이지 결과 수 (필수)
  pool?: string; // 승식구분 (선택)
  rc_date?: string; // 경주일 YYYYMMDD (선택)
  rc_month?: string; // 경주월 YYYYMM (선택)
  rc_no?: string; // 경주번호 (선택)
  meet?: string; // 시행경마장구분 (선택)
  _type?: string; // 데이터형식 (기본값: json)
}

// 승식구분 상수 (API160_1 명세에 맞춤)
export const KRA_POOL_TYPES = {
  WIN: 'WIN', // 단승식: 1등으로 도착할 말 1두 적중
  PLC: 'PLC', // 연승식: 1~3등 안에 들어올 말 1두 적중 (7두 이하 시 2등까지)
  QPL: 'QPL', // 복연승식: 1~3등 안에 들어올 말 2두 순서 무관 적중
  QNL: 'QNL', // 복승식: 1등과 2등으로 들어올 말 2두 순서 무관 적중
  EXA: 'EXA', // 쌍승식: 1등과 2등으로 들어올 말 2두 순서대로 적중
  TLA: 'TLA', // 삼복승식: 1,2,3등으로 들어올 말 3두 순서 무관 적중
  TRI: 'TRI', // 삼쌍승식: 1,2,3등으로 들어올 말 3두 순서대로 적중
} as const;

// 시행경마장 구분 상수 (API160_1 기준)
export const KRA_MEET_CODES = {
  SEOUL: '1', // 서울
  JEJU: '2', // 제주
  BUSAN: '3', // 부산
} as const;

// API 응답 상태 코드 (Swagger 문서 기반)
export const KRA_RESPONSE_CODES = {
  SUCCESS: '00', // 성공
  INVALID_PARAM: '10', // 잘못된 요청 파라미터 에러
  SYSTEM_ERROR: '99', // 시스템 에러
} as const;

// 확정배당율 요약 정보
export class KraDividendSummaryDto {
  rcDate: string; // 경주일자
  meet: string; // 시행경마장
  rcNo: string; // 경주번호
  totalPayout: number; // 총 배당금
  dividends: {
    win: { horse: string; rate: number; amount: number };
    place: Array<{ horse: string; rate: number; amount: number }>;
    quinella: { horses: string[]; rate: number; amount: number };
    exacta: { horses: string[]; rate: number; amount: number };
    trifecta: { horses: string[]; rate: number; amount: number };
  };
}

// 베팅 계산용 DTO
export class KraDividendCalculationDto {
  betType: string; // 베팅 타입
  betAmount: number; // 베팅 금액
  selectedHorses: string[]; // 선택한 말 번호들
  expectedPayout: number; // 예상 배당금
}

// API 에러 응답 타입
export class KraErrorResponseDto {
  header: {
    resultCode: string;
    resultMsg: string;
  };
}

// 타입 가드 함수들
export function isKraDividendItemArray(items: any): items is KraDividendItem[] {
  return Array.isArray(items);
}

export function isKraDividendItemSingle(items: any): items is KraDividendItem {
  return !Array.isArray(items) && typeof items === 'object';
}

// 응답 데이터 정규화 함수
export function normalizeDividendItems(items: any): KraDividendItem[] {
  if (isKraDividendItemArray(items)) {
    return items;
  } else if (isKraDividendItemSingle(items)) {
    return [items];
  }
  return [];
}
