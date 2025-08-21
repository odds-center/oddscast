// KRA API4_3 경주기록 정보 응답 DTO
// Swagger 문서 기반 정확한 응답 구조 정의
export class KraRaceRecordsResponseDto {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: {
      item: KraRaceRecord[] | KraRaceRecord; // API 응답에 따라 단일 또는 배열
    };
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
}

// 경주기록 상세 정보 (API4_3 응답 명세에 맞춤)
export class KraRaceRecord {
  // 경주 기본 정보
  meet: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)
  meet_name: string; // 시행경마장명
  rc_date: string; // 경주일자 (YYYYMMDD)
  rc_no: string; // 경주번호
  rc_name: string; // 경주명
  rc_dist: string; // 경주거리 (미터)
  rc_grade: string; // 등급조건
  rc_prize: string; // 1착상금
  rc_condition: string; // 부담구분
  rc_weather: string; // 날씨
  rc_track: string; // 주로
  rc_start_time?: string; // 경주시작시간
  rc_end_time?: string; // 경주종료시간
  
  // 출전마 정보
  hr_no: string; // 출주번호
  hr_name: string; // 마명
  hr_name_en?: string; // 영문마명
  hr_number?: string; // 마번
  hr_nationality?: string; // 국적
  hr_age?: string; // 연령
  hr_gender?: string; // 성별
  hr_weight?: string; // 부담중량
  hr_rating?: string; // 레이팅(등급)
  
  // 기수 정보
  jk_name: string; // 기수명
  jk_name_en?: string; // 영문기수명
  jk_no?: string; // 기수번호
  
  // 조교사 정보
  tr_name?: string; // 조교사명
  tr_name_en?: string; // 영문조교사명
  tr_no?: string; // 조교사번호
  
  // 마주 정보
  ow_name?: string; // 마주명
  ow_name_en?: string; // 영문마주명
  ow_no?: string; // 마주번호
  
  // 경주 결과
  ord: string; // 순위
  rc_time: string; // 경주기록
  rc_rank?: string; // 순위 (문자열)
  rc_prize_2?: string; // 2착상금
  rc_prize_3?: string; // 3착상금
  rc_prize_4?: string; // 4착상금
  rc_prize_5?: string; // 5착상금
  
  // 추가 정보
  rc_day?: string; // 경주일수
  rc_weekday?: string; // 경주요일
  rc_age_condition?: string; // 연령조건
  rc_sex_condition?: string; // 상별조건
  rc_track_condition?: string; // 트랙상태
  rc_prize_bonus1?: string; // 부가상금1
  rc_prize_bonus2?: string; // 부가상금2
  rc_prize_bonus3?: string; // 부가상금3
  
  // 구간별 기록
  rc_time_400?: string; // 400m 기록
  rc_time_600?: string; // 600m 기록
  rc_time_800?: string; // 800m 기록
  rc_time_1000?: string; // 1000m 기록
  rc_time_1200?: string; // 1200m 기록
  rc_time_1400?: string; // 1400m 기록
  rc_time_1600?: string; // 1600m 기록
  rc_time_1800?: string; // 1800m 기록
  rc_time_2000?: string; // 2000m 기록
  
  // 착차 정보
  rc_gap?: string; // 착차
  rc_gap_400?: string; // 400m 착차
  rc_gap_600?: string; // 600m 착차
  rc_gap_800?: string; // 800m 착차
  rc_gap_1000?: string; // 1000m 착차
  rc_gap_1200?: string; // 1200m 착차
  rc_gap_1400?: string; // 1400m 착차
  rc_gap_1600?: string; // 1600m 착차
  rc_gap_1800?: string; // 1800m 착차
  rc_gap_2000?: string; // 2000m 착차
  
  // 마체중 정보
  hr_weight_before?: string; // 경주전 마체중
  hr_weight_after?: string; // 경주후 마체중
  hr_weight_change?: string; // 마체중 변화
}

// 요청 파라미터 DTO (API4_3 요청 명세에 맞춤)
export class KraRaceRecordsQueryDto {
  ServiceKey: string; // 공공데이터포털 인증키 (필수)
  pageNo: string; // 페이지번호 (필수)
  numOfRows: string; // 한 페이지 결과 수 (필수)
  meet?: string; // 시행경마장구분 (선택)
  rc_year?: string; // 경주연도 (선택)
  rc_month?: string; // 경주년월 (선택)
  rc_date?: string; // 경주일자 (선택)
  rc_no?: string; // 경주번호 (선택)
  _type?: string; // 데이터형식 (기본값: json)
}

// 경마장 구분 상수
export const KRA_MEET_CODES = {
  SEOUL: '1', // 서울
  JEJU: '2', // 제주
  BUSAN: '3', // 부산
} as const;

// 경주 등급 상수
export const KRA_RACE_GRADES = {
  OPEN: 'OPEN', // 오픈
  SPECIAL: 'SPECIAL', // 특별
  GENERAL: 'GENERAL', // 일반
  CONDITION: 'CONDITION', // 조건
  MAIDEN: 'MAIDEN', // 미혼
  CLAIMING: 'CLAIMING', // 클레임
} as const;

// 경주 거리 상수 (미터)
export const KRA_RACE_DISTANCES = {
  SPRINT: [1000, 1200, 1400], // 단거
  MIDDLE: [1600, 1800, 2000], // 중거
  LONG: [2200, 2400, 2600], // 장거
  EXTRA_LONG: [2800, 3000, 3200], // 초장거
} as const;

// API 응답 상태 코드
export const KRA_RESPONSE_CODES = {
  SUCCESS: '00', // 성공
  INVALID_PARAM: '10', // 잘못된 요청 파라미터 에러
  SYSTEM_ERROR: '99', // 시스템 에러
} as const;

// 경주 결과 요약 정보
export class KraRaceSummaryDto {
  rcDate: string; // 경주일자
  meet: string; // 시행경마장
  rcNo: string; // 경주번호
  rcName: string; // 경주명
  rcDist: number; // 경주거리
  rcGrade: string; // 등급
  totalPrize: number; // 총 상금
  participants: number; // 출전마 수
  weather: string; // 날씨
  track: string; // 트랙
  results: KraRaceResultDto[]; // 경주 결과
}

// 경주 결과 정보
export class KraRaceResultDto {
  rank: number; // 순위
  horseNo: string; // 출주번호
  horseName: string; // 마명
  jockeyName: string; // 기수명
  trainerName?: string; // 조교사명
  ownerName?: string; // 마주명
  finishTime: string; // 경주기록
  prize: number; // 상금
  gap?: string; // 착차
}

// 타입 가드 함수들
export function isKraRaceRecordArray(items: any): items is KraRaceRecord[] {
  return Array.isArray(items);
}

export function isKraRaceRecordSingle(items: any): items is KraRaceRecord {
  return !Array.isArray(items) && typeof items === 'object';
}

// 응답 데이터 정규화 함수
export function normalizeRaceRecords(items: any): KraRaceRecord[] {
  if (isKraRaceRecordArray(items)) {
    return items;
  } else if (isKraRaceRecordSingle(items)) {
    return [items];
  }
  return [];
}

// 경주 기록 검증 함수
export function validateRaceRecord(record: KraRaceRecord): boolean {
  return !!(
    record.meet &&
    record.rc_date &&
    record.rc_no &&
    record.hr_no &&
    record.hr_name &&
    record.jk_name &&
    record.ord &&
    record.rc_time
  );
}

// 경주 기록 필터링 함수
export function filterRaceRecords(
  records: KraRaceRecord[],
  options?: {
    meet?: string;
    rcDate?: string;
    rcNo?: string;
    minDistance?: number;
    maxDistance?: number;
    grade?: string;
    minPrize?: number;
    maxPrize?: number;
  }
): KraRaceRecord[] {
  let filteredRecords = records.filter(validateRaceRecord);

  if (options?.meet) {
    filteredRecords = filteredRecords.filter(
      record => record.meet === options.meet
    );
  }

  if (options?.rcDate) {
    filteredRecords = filteredRecords.filter(
      record => record.rc_date === options.rcDate
    );
  }

  if (options?.rcNo) {
    filteredRecords = filteredRecords.filter(
      record => record.rc_no === options.rcNo
    );
  }

  if (options?.minDistance) {
    filteredRecords = filteredRecords.filter(
      record => parseInt(record.rc_dist) >= options.minDistance!
    );
  }

  if (options?.maxDistance) {
    filteredRecords = filteredRecords.filter(
      record => parseInt(record.rc_dist) <= options.maxDistance!
    );
  }

  if (options?.grade) {
    filteredRecords = filteredRecords.filter(
      record => record.rc_grade === options.grade
    );
  }

  if (options?.minPrize) {
    filteredRecords = filteredRecords.filter(
      record => parseInt(record.rc_prize) >= options.minPrize!
    );
  }

  if (options?.maxPrize) {
    filteredRecords = filteredRecords.filter(
      record => parseInt(record.rc_prize) <= options.maxPrize!
    );
  }

  return filteredRecords;
}

// 경주 기록 정렬 함수
export function sortRaceRecords(
  records: KraRaceRecord[],
  sortBy: 'date' | 'distance' | 'prize' | 'time' | 'rank' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): KraRaceRecord[] {
  const sortedRecords = [...records];

  sortedRecords.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'date':
        aValue = a.rc_date;
        bValue = b.rc_date;
        break;
      case 'distance':
        aValue = parseInt(a.rc_dist);
        bValue = parseInt(b.rc_dist);
        break;
      case 'prize':
        aValue = parseInt(a.rc_prize);
        bValue = parseInt(b.rc_prize);
        break;
      case 'time':
        aValue = parseFloat(a.rc_time);
        bValue = parseFloat(b.rc_time);
        break;
      case 'rank':
        aValue = parseInt(a.ord);
        bValue = parseInt(b.ord);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  return sortedRecords;
}
