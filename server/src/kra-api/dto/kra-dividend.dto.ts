export class KraDividendResponseDto {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: KraDividendItem[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export class KraDividendItem {
  rcDate: string; // 경주일자 (YYYYMMDD)
  rcNo: string; // 경주번호
  rcCnt: string; // 경주차수
  meet: string; // 시행경마장 (1: 서울, 2: 부산경남, 3: 제주)
  meetName: string; // 시행경마장명
  rcName: string; // 경주명
  rcDist: string; // 경주거리
  rcGrade: string; // 경주등급
  rcAge: string; // 나이제한
  rcSex: string; // 성별제한
  rcWeight: string; // 부담중량
  rcPrize: string; // 상금
  rcCondition: string; // 경주조건
  rcTime: string; // 경주시간
  rcStatus: string; // 경주상태
  winHorse: string; // 우승말 번호
  winDividend: string; // 우승말 배당률
  placeHorses: string[]; // 연승말 번호들
  placeDividends: string[]; // 연승말 배당률들
  quinellaHorses: string[]; // 복승말 번호들
  quinellaDividend: string; // 복승 배당률
  exactaHorses: string[]; // 정확한 순서 말 번호들
  exactaDividend: string; // 정확한 순서 배당률
  trifectaHorses: string[]; // 삼복승 말 번호들
  trifectaDividend: string; // 삼복승 배당률
}

export class KraDividendQueryDto {
  serviceKey: string; // 인증키
  meet?: string; // 시행경마장
  rcYear?: string; // 경주년
  rcMonth?: string; // 경주월
  rcDay?: string; // 경주일
  rcNo?: string; // 경주번호
  pageNo?: number; // 페이지 번호
  numOfRows?: number; // 한 페이지 결과 수
  _type?: string; // 응답 형식 (json, xml)
}

export class KraDividendSummaryDto {
  rcDate: string; // 경주일자
  meet: string; // 시행경마장
  meetName: string; // 시행경마장명
  rcNo: string; // 경주번호
  rcName: string; // 경주명
  totalPayout: number; // 총 배당금
  dividends: {
    win: { horse: string; rate: number; amount: number };
    place: Array<{ horse: string; rate: number; amount: number }>;
    quinella: { horses: string[]; rate: number; amount: number };
    exacta: { horses: string[]; rate: number; amount: number };
    trifecta: { horses: string[]; rate: number; amount: number };
  };
}

export class KraDividendCalculationDto {
  betType: string; // 베팅 유형
  betAmount: number; // 베팅 금액
  horseNumbers: string[]; // 선택한 말 번호들
  expectedPayout: number; // 예상 배당금
  dividendRate: number; // 배당률
}
