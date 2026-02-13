// 경마 관련 타입 — @goldenrace/shared DTO re-export
export type { RaceDto, RaceDetailDto, RaceEntryDto, RaceResultDto, DividendDto, RaceListResponseDto } from '@goldenrace/shared';

/** @deprecated RaceDto 사용 권장 */
export interface Race {
  id: string;
  meet: string;
  meetName: string;
  rcDate: string; // KRA API 응답 - string
  rcNo: string;
  rcName: string;
  rcDist: string;
  rank: string; // KRA: 등급조건 (rcGrade)
  rcCondition: string;
  rcPrize: number;
  rcRatingMin?: string;
  rcRatingMax?: string;
  rcAgeCondition?: string;
  rcSexCondition?: string;
  stTime?: string; // KRA: 출발시각
  rcStartTime?: string; // mock/legacy 호환
  rcEndTime?: string; // KRA API 응답 - string
  rcDay?: string;
  rcWeekday?: string;
  weather?: string;
  track?: string; // KRA: 주로상태
  rcPrize2?: number;
  rcPrize3?: number;
  rcPrize4?: number;
  rcPrize5?: number;
  rcPrizeBonus1?: number;
  rcPrizeBonus2?: number;
  rcPrizeBonus3?: number;
  rcRemarks?: string;
  apiVersion: string;
  dataSource: string;
  createdBy?: string;
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
  totalPrize?: number;
  totalEntries?: number;
  raceStatus: string;
}

export interface RaceDetail extends Race {
  entryDetails?: EntryDetail[];
  results?: RaceResult[];
  dividendRates?: DividendRate[];
}

export interface EntryDetail {
  id: string;
  raceId: string;
  hrNo: string;
  hrName: string;
  hrNameEn?: string;
  jkName: string;
  jkNameEn?: string;
  trName: string;
  trNameEn?: string;
  owName: string;
  owNameEn?: string;
  entryNumber: string;
  postPosition?: string;
  entryStatus: string;
  hrWeight?: string;
  hrRating?: string;
  totalStarts?: number;
  ord1CntT?: number; // KRA: 통산1위횟수 (totalWins)
  totalPlaces?: number;
  totalWinRate?: number;
  totalPlaceRate?: number;
  totalPrize?: number;
  yearStarts?: number;
  yearWins?: number;
  yearPlaces?: number;
  yearWinRate?: number;
  yearPlaceRate?: number;
  yearPrize?: number;
  halfYearPrize?: number;
}

export interface RaceResult {
  id: string;
  raceId: string;
  ord: string; // KRA: 순위
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  owName: string;
  rcTime: string;
  chaksun1?: number;
  track?: string;
  weather?: string;
}

export interface DividendRate {
  id: string;
  raceId: string;
  pool: string;
  poolName: string;
  odds: number;
  chulNo: string;
  chulNo2?: string;
  chulNo3?: string;
  rcName: string;
  raceDistance: string;
  raceGrade: string;
  raceCondition: string;
  weather?: string;
  track?: string;
  trackCondition?: string;
  totalEntries?: number;
  winningCombinations?: number;
  impliedProbability?: number;
  profitMargin?: number;
}

export interface RaceFilters {
  meet?: string;
  date?: string;
  month?: string;
  year?: string;
  grade?: string;
  distance?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface RacePlansFilters {
  meet?: string;
  date?: string;
  month?: string;
  year?: string;
  grade?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// API 요청/응답을 위한 추가 타입들
export interface CreateRaceRequest {
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDist: string;
  rank: string; // KRA: 등급조건 (rcGrade)
  rcCondition: string;
  rcPrize: number;
  rcStartTime?: string;
  rcEndTime?: string;
  weather?: string;
  track?: string; // KRA: 주로상태
}

export interface UpdateRaceRequest {
  meetName?: string;
  rcName?: string;
  rcDist?: string;
  rank?: string; // KRA: 등급조건 (기존 rcGrade)
  rcCondition?: string;
  rcPrize?: number;
  rcStartTime?: string;
  rcEndTime?: string;
  weather?: string;
  track?: string; // KRA: 주로상태
  raceStatus?: string;
}

export interface RaceStatistics {
  totalRaces: number;
  totalEntries: number;
  totalPrize: number;
  averageEntries: number;
  byMeet: Record<
    string,
    {
      count: number;
      totalEntries: number;
      totalPrize: number;
    }
  >;
  byGrade: Record<
    string,
    {
      count: number;
      totalEntries: number;
      totalPrize: number;
    }
  >;
  byMonth: Record<
    string,
    {
      count: number;
      totalEntries: number;
      totalPrize: number;
    }
  >;
}

export interface RaceAnalysis {
  raceId: string;
  totalEntries: number;
  averageRating: number;
  favoriteHorses: {
    hrNo: string;
    hrName: string;
    odds: number;
    confidence: number;
  }[];
  trackAnalysis: {
    trackType: string;
    trackCondition: string;
    weatherImpact: string;
    historicalPerformance: {
      date: string;
      winner: string;
      time: string;
      trackCondition: string;
    }[];
  };
  bettingTrends: {
    mostPopularBetType: string;
    averageBetAmount: number;
    totalBets: number;
  };
}

export interface RaceSchedule {
  id: string;
  meet: string;
  meetName: string;
  date: string;
  races: {
    rcNo: string;
    rcName: string;
    rcDist: string;
    rank: string; // KRA: 등급조건 (rcGrade)
    rcStartTime: string;
    totalEntries: number;
    raceStatus: string;
  }[];
}

export interface RaceCalendar {
  year: number;
  month?: number;
  meets: {
    meet: string;
    meetName: string;
    dates: {
      date: string;
      raceCount: number;
      totalPrize: number;
    }[];
  }[];
}

export interface RaceSearchFilters {
  meet?: string;
  grade?: string;
  distance?: string;
  status?: string;
  page?: number;
  limit?: number;
}
