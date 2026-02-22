// Horse racing-related types — @oddscast/shared DTO re-export
export type { RaceDto, RaceDetailDto, RaceEntryDto, RaceResultDto, DividendDto, RaceListResponseDto } from '@oddscast/shared';

/** @deprecated Use RaceDto instead */
export interface Race {
  id: string;
  meet: string;
  meetName: string;
  rcDate: string; // KRA API response - string
  rcNo: string;
  rcName: string;
  rcDist: string;
  rank: string; // KRA: grade condition (rcGrade)
  rcCondition: string;
  rcPrize: number;
  rcRatingMin?: string;
  rcRatingMax?: string;
  rcAgeCondition?: string;
  rcSexCondition?: string;
  stTime?: string; // KRA: start time
  rcStartTime?: string; // mock/legacy compatibility
  rcEndTime?: string; // KRA API response - string
  rcDay?: string;
  rcWeekday?: string;
  weather?: string;
  track?: string; // KRA: track condition
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
  createdAt: Date; // Custom schema - Date
  updatedAt: Date; // Custom schema - Date
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
  ord1CntT?: number; // KRA: total wins (totalWins)
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
  ord: string; // KRA: rank
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

// Additional types for API requests/responses
export interface CreateRaceRequest {
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDist: string;
  rank: string; // KRA: grade condition (rcGrade)
  rcCondition: string;
  rcPrize: number;
  rcStartTime?: string;
  rcEndTime?: string;
  weather?: string;
  track?: string; // KRA: track condition
}

export interface UpdateRaceRequest {
  meetName?: string;
  rcName?: string;
  rcDist?: string;
  rank?: string; // KRA: grade condition (existing rcGrade)
  rcCondition?: string;
  rcPrize?: number;
  rcStartTime?: string;
  rcEndTime?: string;
  weather?: string;
  track?: string; // KRA: track condition
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
    rank: string; // KRA: grade condition (rcGrade)
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
