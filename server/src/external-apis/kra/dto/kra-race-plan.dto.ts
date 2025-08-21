export class KraRacePlanResponseDto {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: KraRacePlanItem[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export class KraRacePlanItem {
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
}

export class KraRacePlanQueryDto {
  serviceKey: string; // 인증키
  meet?: string; // 시행경마장
  rcYear?: string; // 경주년
  rcMonth?: string; // 경주월
  rcDay?: string; // 경주일
  pageNo?: number; // 페이지 번호
  numOfRows?: number; // 한 페이지 결과 수
  _type?: string; // 응답 형식 (json, xml)
}

export class KraRacePlanSummaryDto {
  rcDate: string; // 경주일자
  meet: string; // 시행경마장
  meetName: string; // 시행경마장명
  totalRaces: number; // 총 경주 수
  races: KraRacePlanItem[];
}
