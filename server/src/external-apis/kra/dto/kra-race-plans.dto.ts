// KRA API72_2 경주계획표 응답 DTO
// Swagger 문서 기반 정확한 응답 구조 정의
export class KraRacePlansResponseDto {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: {
      item: KraRacePlan[] | KraRacePlan; // API 응답에 따라 단일 또는 배열
    };
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
}

// 경주계획표 상세 정보 (API72_2 응답 명세에 맞춤)
export class KraRacePlan {
  // 경주 기본 정보
  meet: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산경남)
  meet_name: string; // 시행경마장명
  rc_date: string; // 경주일자 (YYYYMMDD)
  rc_no: string; // 경주번호
  rc_name: string; // 경주명
  rc_dist: string; // 경주거리 (미터)
  rc_grade: string; // 등급조건
  rc_condition: string; // 부담구분
  rc_prize: string; // 1착상금

  // 상금 정보
  rc_prize_2?: string; // 2착상금
  rc_prize_3?: string; // 3착상금
  rc_prize_4?: string; // 4착상금
  rc_prize_5?: string; // 5착상금
  rc_prize_bonus1?: string; // 1착부가상금
  rc_prize_bonus2?: string; // 2착부가상금
  rc_prize_bonus3?: string; // 3착부가상금

  // 경주 조건
  rc_rating_min?: string; // 레이팅하한조건
  rc_rating_max?: string; // 레이팅상한조건
  rc_age_condition?: string; // 연령조건
  rc_sex_condition?: string; // 상별조건

  // 경주 일정
  rc_start_time?: string; // 발주예정시각
  rc_end_time?: string; // 경주종료예정시각
  rc_day?: string; // 경주일수
  rc_weekday?: string; // 경주요일

  // 추가 정보
  rc_weather?: string; // 날씨 (예상)
  rc_track?: string; // 주로 (예상)
  rc_track_condition?: string; // 트랙상태 (예상)
  rc_remarks?: string; // 비고사항
}

// 요청 파라미터 DTO (API72_2 요청 명세에 맞춤)
export class KraRacePlansQueryDto {
  ServiceKey: string; // 공공데이터포털 인증키 (필수)
  pageNo: string; // 페이지번호 (필수)
  numOfRows: string; // 한 페이지 결과 수 (필수)
  meet?: string; // 시행경마장구분 (선택)
  rc_year?: string; // 경주년도 (선택)
  rc_month?: string; // 경주년월 (선택)
  rc_date?: string; // 경주일자 (선택)
  _type?: string; // 데이터형식 (기본값: json)
}

// 경마장 구분 상수
export const KRA_MEET_CODES = {
  SEOUL: '1', // 서울
  JEJU: '2', // 제주
  BUSAN: '3', // 부산경남
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

// 경주계획 요약 정보
export class KraRacePlanSummaryDto {
  rcDate: string; // 경주일자
  meet: string; // 시행경마장
  totalRaces: number; // 총 경주 수
  totalPrize: number; // 총 상금
  averageDistance: number; // 평균 경주거리
  gradeDistribution: Record<string, number>; // 등급별 분포
  distanceDistribution: Record<string, number>; // 거리별 분포
  plans: KraRacePlan[]; // 경주계획 목록
}

// 타입 가드 함수들
export function isKraRacePlanArray(items: any): items is KraRacePlan[] {
  return Array.isArray(items);
}

export function isKraRacePlanSingle(items: any): items is KraRacePlan {
  return !Array.isArray(items) && typeof items === 'object';
}

// 응답 데이터 정규화 함수
export function normalizeRacePlans(items: any): KraRacePlan[] {
  if (isKraRacePlanArray(items)) {
    return items;
  } else if (isKraRacePlanSingle(items)) {
    return [items];
  }
  return [];
}

// 경주계획 데이터 검증 함수
export function validateRacePlan(plan: KraRacePlan): boolean {
  return !!(
    plan.meet &&
    plan.rc_date &&
    plan.rc_no &&
    plan.rc_name &&
    plan.rc_dist &&
    plan.rc_prize
  );
}

// 경주계획 필터링 함수
export function filterRacePlans(
  plans: KraRacePlan[],
  options?: {
    meet?: string;
    rcDate?: string;
    rcNo?: string;
    minDistance?: number;
    maxDistance?: number;
    grade?: string;
    minPrize?: number;
    maxPrize?: number;
    minRating?: number;
    maxRating?: number;
  }
): KraRacePlan[] {
  let filteredPlans = plans.filter(validateRacePlan);

  if (options?.meet) {
    filteredPlans = filteredPlans.filter(plan => plan.meet === options.meet);
  }

  if (options?.rcDate) {
    filteredPlans = filteredPlans.filter(
      plan => plan.rc_date === options.rcDate
    );
  }

  if (options?.rcNo) {
    filteredPlans = filteredPlans.filter(plan => plan.rc_no === options.rcNo);
  }

  if (options?.minDistance) {
    filteredPlans = filteredPlans.filter(
      plan => parseInt(plan.rc_dist) >= options.minDistance!
    );
  }

  if (options?.maxDistance) {
    filteredPlans = filteredPlans.filter(
      plan => parseInt(plan.rc_dist) <= options.maxDistance!
    );
  }

  if (options?.grade) {
    filteredPlans = filteredPlans.filter(
      plan => plan.rc_grade === options.grade
    );
  }

  if (options?.minPrize) {
    filteredPlans = filteredPlans.filter(
      plan => parseInt(plan.rc_prize) >= options.minPrize!
    );
  }

  if (options?.maxPrize) {
    filteredPlans = filteredPlans.filter(
      plan => parseInt(plan.rc_prize) <= options.maxPrize!
    );
  }

  if (options?.minRating) {
    filteredPlans = filteredPlans.filter(plan => {
      const rating = parseInt(plan.rc_rating_min || '0');
      return rating >= options.minRating!;
    });
  }

  if (options?.maxRating) {
    filteredPlans = filteredPlans.filter(plan => {
      const rating = parseInt(plan.rc_rating_max || '999');
      return rating <= options.maxRating!;
    });
  }

  return filteredPlans;
}

// 경주계획 정렬 함수
export function sortRacePlans(
  plans: KraRacePlan[],
  sortBy: 'date' | 'distance' | 'prize' | 'time' | 'rcNo' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): KraRacePlan[] {
  const sortedPlans = [...plans];

  sortedPlans.sort((a, b) => {
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
        aValue = a.rc_start_time || '';
        bValue = b.rc_start_time || '';
        break;
      case 'rcNo':
        aValue = parseInt(a.rc_no);
        bValue = parseInt(b.rc_no);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  return sortedPlans;
}

// 경주계획 통계 정보 생성 함수
export function generateRacePlanStatistics(plans: KraRacePlan[]): {
  totalPlans: number;
  totalPrize: number;
  averageDistance: number;
  meetDistribution: Record<string, number>;
  gradeDistribution: Record<string, number>;
  distanceDistribution: Record<string, number>;
  dateDistribution: Record<string, number>;
} {
  const validPlans = plans.filter(validateRacePlan);

  if (validPlans.length === 0) {
    return {
      totalPlans: 0,
      totalPrize: 0,
      averageDistance: 0,
      meetDistribution: {},
      gradeDistribution: {},
      distanceDistribution: {},
      dateDistribution: {},
    };
  }

  const totalPlans = validPlans.length;

  const totalPrize = validPlans.reduce(
    (sum, plan) => sum + parseInt(plan.rc_prize || '0'),
    0
  );

  const totalDistance = validPlans.reduce(
    (sum, plan) => sum + parseInt(plan.rc_dist || '0'),
    0
  );
  const averageDistance = totalDistance / totalPlans;

  // 분포 계산
  const meetDistribution = validPlans.reduce(
    (acc, plan) => {
      acc[plan.meet] = (acc[plan.meet] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const gradeDistribution = validPlans.reduce(
    (acc, plan) => {
      acc[plan.rc_grade] = (acc[plan.rc_grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const distanceDistribution = validPlans.reduce(
    (acc, plan) => {
      const distance = parseInt(plan.rc_dist || '0');
      let category = 'Unknown';
      if (distance <= 1400) category = 'Sprint (≤1400m)';
      else if (distance <= 2000) category = 'Middle (1401-2000m)';
      else if (distance <= 2600) category = 'Long (2001-2600m)';
      else category = 'Extra Long (>2600m)';

      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dateDistribution = validPlans.reduce(
    (acc, plan) => {
      acc[plan.rc_date] = (acc[plan.rc_date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalPlans,
    totalPrize,
    averageDistance: Math.round(averageDistance),
    meetDistribution,
    gradeDistribution,
    distanceDistribution,
    dateDistribution,
  };
}
