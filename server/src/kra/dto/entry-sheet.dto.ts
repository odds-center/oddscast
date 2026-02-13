export interface EntrySheetItemDto {
  meet: string; // 시행경마장명 (e.g., "서울")
  rcDate: string; // 경주일자 (YYYYMMDD)
  rcDay: string; // 경주요일 (e.g., "토요일")
  rcNo: string; // 경주번호
  chulNo: string; // 출주번호 (마번)
  hrName: string; // 마명
  hrNameEn: string; // 영문마명
  hrNo: string; // 마번(고유번호)
  prd: string; // 산지
  sex: string; // 성별
  age: string; // 연령 (comes as string in XML usually)
  wgBudam: string; // 부담중량
  rating: string; // 레이팅
  jkName: string; // 기수명
  jkNameEn: string; // 영문기수이름
  jkNo: string; // 기수번호
  trName: string; // 조교사명
  trNo: string; // 조교사번호
  owName: string; // 마주명
  owNo: string; // 마주번호
  rcDist: string; // 경주거리
  dusu: string; // 두수
  rank: string; // 등급조건
  stTime: string; // 출발시각
  budam: string; // 부담구분
  rcName: string; // 경주명
  chaksun1: string; // 1착상금
  chaksunT: string; // 통산수득상금
  rcCntT: string; // 통산출주횟수
  ord1CntT: string; // 통산1위횟수
}

export interface EntrySheetResponseDto {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: EntrySheetItemDto[] | EntrySheetItemDto;
      };
      numOfRows: string;
      pageNo: string;
      totalCount: string;
    };
  };
}
