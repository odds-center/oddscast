// KRA API15_2 경주마 성적 정보 응답 DTO
// Swagger 문서 기반 정확한 응답 구조 정의
export class KraRaceHorseResultsResponseDto {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: {
      item: KraRaceHorseResult[] | KraRaceHorseResult; // API 응답에 따라 단일 또는 배열
    };
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
}

// 경주마 성적 정보 상세 (API15_2 응답 명세에 맞춤)
export class KraRaceHorseResult {
  // 경주마 기본 정보
  meet: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)
  meet_name: string; // 시행경마장명
  hr_name: string; // 마명
  hr_number: string; // 마번
  hr_origin: string; // 산지
  hr_sex: string; // 성별
  hr_age: string; // 나이
  hr_debut_date: string; // 데뷔일자

  // 최근 경주 정보
  rc_date: string; // 최근 경주일자
  rc_no: string; // 최근 경주번호
  rc_rank: string; // 최근 경주순위
  rc_time: string; // 최근 경주기록
  rc_weight: string; // 최근 경주부담중량
  rc_rating: string; // 최근 경주레이팅
  rc_horse_weight: string; // 최근 경주마체중
  rc_name: string; // 최근 경주명
  rc_burden_type: string; // 최근 경주부담종류
  rc_grade: string; // 최근 경주등급
  rc_distance: string; // 최근 경주거리

  // 통산 성적
  total_starts: string; // 통산 총출주회수
  total_wins: string; // 통산 1착회수
  total_places: string; // 통산 2착회수
  total_win_rate: string; // 통산 승률
  total_place_rate: string; // 통산 복승률
  total_prize: string; // 통산 착순상금

  // 최근 1년 성적
  year_starts: string; // 최근1년 총출주회수
  year_wins: string; // 최근1년 1착회수
  year_places: string; // 최근1년 2착회수
  year_win_rate: string; // 최근1년 승률
  year_place_rate: string; // 최근1년 복승률
  year_prize: string; // 최근1년 착순상금

  // 최근 6개월 성적
  half_year_prize: string; // 최근6개월 수득상금

  // 추가 정보
  rc_jockey: string; // 최근 경주 기수명
  rc_trainer: string; // 최근 경주 조교사명
  rc_owner: string; // 최근 경주 마주명
  rc_weather: string; // 최근 경주 날씨
  rc_track: string; // 최근 경주 트랙
  rc_track_condition: string; // 최근 경주 트랙상태
}

// 요청 파라미터 DTO (API15_2 요청 명세에 맞춤)
export class KraRaceHorseResultsQueryDto {
  ServiceKey: string; // 공공데이터포털 인증키 (필수)
  pageNo: string; // 페이지번호 (필수)
  numOfRows: string; // 한 페이지 결과 수 (필수)
  meet?: string; // 시행경마장구분 (선택)
  hr_name?: string; // 마명 (선택)
  hr_number?: string; // 마번 (선택)
  _type?: string; // 데이터형식 (기본값: json)
}

// 경마장 구분 상수
export const KRA_MEET_CODES = {
  SEOUL: '1', // 서울
  JEJU: '2', // 제주
  BUSAN: '3', // 부산
} as const;

// 경주마 성별 상수
export const KRA_HORSE_SEX = {
  MALE: 'M', // 수컷
  FEMALE: 'F', // 암컷
  GELDING: 'G', // 거세마
} as const;

// 경주마 나이 그룹 상수
export const KRA_HORSE_AGE_GROUPS = {
  YOUNG: [2, 3], // 유년마
  PRIME: [4, 5, 6], // 전성기
  MATURE: [7, 8], // 성숙마
  VETERAN: [9, 10], // 베테랑
  OLD: [11, 12], // 노령마
} as const;

// API 응답 상태 코드
export const KRA_RESPONSE_CODES = {
  SUCCESS: '00', // 성공
  INVALID_PARAM: '10', // 잘못된 요청 파라미터 에러
  SYSTEM_ERROR: '99', // 시스템 에러
} as const;

// 경주마 성적 요약 정보
export class KraRaceHorseSummaryDto {
  hrName: string; // 마명
  hrNumber: string; // 마번
  meet: string; // 시행경마장
  totalStarts: number; // 통산 출주회수
  totalWins: number; // 통산 1착회수
  totalPlaces: number; // 통산 2착회수
  totalWinRate: number; // 통산 단승률
  totalPlaceRate: number; // 통산 복승률
  totalPrize: number; // 통산 상금
  recentForm: string; // 최근 경주 성적
  recentRating: number; // 최근 레이팅
  yearPerformance: {
    starts: number;
    wins: number;
    places: number;
    winRate: number; // 단승률
    placeRate: number; // 복승률
    prize: number;
  };
}

// 타입 가드 함수들
export function isKraRaceHorseResultArray(
  items: any
): items is KraRaceHorseResult[] {
  return Array.isArray(items);
}

export function isKraRaceHorseResultSingle(
  items: any
): items is KraRaceHorseResult {
  return !Array.isArray(items) && typeof items === 'object';
}

// 응답 데이터 정규화 함수
export function normalizeRaceHorseResults(items: any): KraRaceHorseResult[] {
  if (isKraRaceHorseResultArray(items)) {
    return items;
  } else if (isKraRaceHorseResultSingle(items)) {
    return [items];
  }
  return [];
}

// 경주마 성적 데이터 검증 함수
export function validateRaceHorseResult(result: KraRaceHorseResult): boolean {
  return !!(
    result.meet &&
    result.hr_name &&
    result.hr_number &&
    result.rc_date &&
    result.rc_no
  );
}

// 경주마 성적 필터링 함수
export function filterRaceHorseResults(
  results: KraRaceHorseResult[],
  options?: {
    meet?: string;
    hrName?: string;
    hrNumber?: string;
    minAge?: number;
    maxAge?: number;
    sex?: string;
    minRating?: number;
    maxRating?: number;
    minWinRate?: number;
    maxWinRate?: number;
    minStarts?: number;
    maxStarts?: number;
  }
): KraRaceHorseResult[] {
  let filteredResults = results.filter(validateRaceHorseResult);

  if (options?.meet) {
    filteredResults = filteredResults.filter(
      result => result.meet === options.meet
    );
  }

  if (options?.hrName) {
    filteredResults = filteredResults.filter(result =>
      result.hr_name.includes(options.hrName!)
    );
  }

  if (options?.hrNumber) {
    filteredResults = filteredResults.filter(
      result => result.hr_number === options.hrNumber
    );
  }

  if (options?.minAge) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.hr_age) >= options.minAge!
    );
  }

  if (options?.maxAge) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.hr_age) <= options.maxAge!
    );
  }

  if (options?.sex) {
    filteredResults = filteredResults.filter(
      result => result.hr_sex === options.sex
    );
  }

  if (options?.minRating) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.rc_rating || '0') >= options.minRating!
    );
  }

  if (options?.maxRating) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.rc_rating || '999') <= options.maxRating!
    );
  }

  if (options?.minWinRate) {
    filteredResults = filteredResults.filter(
      result => parseFloat(result.total_win_rate || '0') >= options.minWinRate!
    );
  }

  if (options?.maxWinRate) {
    filteredResults = filteredResults.filter(
      result =>
        parseFloat(result.total_win_rate || '100') <= options.maxWinRate!
    );
  }

  if (options?.minStarts) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.total_starts || '0') >= options.minStarts!
    );
  }

  if (options?.maxStarts) {
    filteredResults = filteredResults.filter(
      result => parseInt(result.total_starts || '999') <= options.maxStarts!
    );
  }

  return filteredResults;
}

// 경주마 성적 정렬 함수
export function sortRaceHorseResults(
  results: KraRaceHorseResult[],
  sortBy:
    | 'name'
    | 'age'
    | 'rating'
    | 'winRate'
    | 'starts'
    | 'prize'
    | 'recentDate' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): KraRaceHorseResult[] {
  const sortedResults = [...results];

  sortedResults.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.hr_name;
        bValue = b.hr_name;
        break;
      case 'age':
        aValue = parseInt(a.hr_age);
        bValue = parseInt(b.hr_age);
        break;
      case 'rating':
        aValue = parseInt(a.rc_rating || '0');
        bValue = parseInt(b.rc_rating || '0');
        break;
      case 'winRate':
        aValue = parseFloat(a.total_win_rate || '0');
        bValue = parseFloat(b.total_win_rate || '0');
        break;
      case 'starts':
        aValue = parseInt(a.total_starts || '0');
        bValue = parseInt(b.total_starts || '0');
        break;
      case 'prize':
        aValue = parseInt(a.total_prize || '0');
        bValue = parseInt(b.total_prize || '0');
        break;
      case 'recentDate':
        aValue = a.rc_date;
        bValue = b.rc_date;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  return sortedResults;
}

// 경주마 성적 통계 정보 생성 함수
export function generateRaceHorseStatistics(results: KraRaceHorseResult[]): {
  totalHorses: number;
  averageAge: number;
  averageRating: number;
  averageWinRate: number;
  averageStarts: number;
  totalPrize: number;
  meetDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
  sexDistribution: Record<string, number>;
  ratingDistribution: Record<string, number>;
  winRateDistribution: Record<string, number>;
} {
  const validResults = results.filter(validateRaceHorseResult);

  if (validResults.length === 0) {
    return {
      totalHorses: 0,
      averageAge: 0,
      averageRating: 0,
      averageWinRate: 0,
      averageStarts: 0,
      totalPrize: 0,
      meetDistribution: {},
      ageDistribution: {},
      sexDistribution: {},
      ratingDistribution: {},
      winRateDistribution: {},
    };
  }

  const totalHorses = validResults.length;

  const totalAge = validResults.reduce(
    (sum, result) => sum + parseInt(result.hr_age || '0'),
    0
  );
  const averageAge = totalAge / totalHorses;

  const totalRating = validResults.reduce(
    (sum, result) => sum + parseInt(result.rc_rating || '0'),
    0
  );
  const averageRating = totalRating / totalHorses;

  const totalWinRate = validResults.reduce(
    (sum, result) => sum + parseFloat(result.total_win_rate || '0'),
    0
  );
  const averageWinRate = totalWinRate / totalHorses;

  const totalStarts = validResults.reduce(
    (sum, result) => sum + parseInt(result.total_starts || '0'),
    0
  );
  const averageStarts = totalStarts / totalHorses;

  const totalPrize = validResults.reduce(
    (sum, result) => sum + parseInt(result.total_prize || '0'),
    0
  );

  // 분포 계산
  const meetDistribution = validResults.reduce(
    (acc, result) => {
      acc[result.meet] = (acc[result.meet] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const ageDistribution = validResults.reduce(
    (acc, result) => {
      const age = parseInt(result.hr_age || '0');
      let category = 'Unknown';
      if (age <= 3) category = 'Young (2-3세)';
      else if (age <= 6) category = 'Prime (4-6세)';
      else if (age <= 8) category = 'Mature (7-8세)';
      else if (age <= 10) category = 'Veteran (9-10세)';
      else category = 'Old (11세+)';

      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sexDistribution = validResults.reduce(
    (acc, result) => {
      acc[result.hr_sex] = (acc[result.hr_sex] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const ratingDistribution = validResults.reduce(
    (acc, result) => {
      const rating = parseInt(result.rc_rating || '0');
      let category = 'Unknown';
      if (rating <= 30) category = 'Low (≤30)';
      else if (rating <= 50) category = 'Medium-Low (31-50)';
      else if (rating <= 70) category = 'Medium (51-70)';
      else if (rating <= 90) category = 'Medium-High (71-90)';
      else category = 'High (>90)';

      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const winRateDistribution = validResults.reduce(
    (acc, result) => {
      const winRate = parseFloat(result.total_win_rate || '0');
      let category = 'Unknown';
      if (winRate <= 5) category = 'Low (≤5%)';
      else if (winRate <= 10) category = 'Medium-Low (5.1-10%)';
      else if (winRate <= 15) category = 'Medium (10.1-15%)';
      else if (winRate <= 20) category = 'Medium-High (15.1-20%)';
      else category = 'High (>20%)';

      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalHorses,
    averageAge: Math.round(averageAge),
    averageRating: Math.round(averageRating),
    averageWinRate: Math.round(averageWinRate * 100) / 100, // 평균 단승률
    averageStarts: Math.round(averageStarts),
    totalPrize,
    meetDistribution,
    ageDistribution,
    sexDistribution,
    ratingDistribution,
    winRateDistribution, // 단승률 분포
  };
}
