// 경주 결과 관련 타입 정의
export interface RaceResultDetail {
  id: string;
  raceId: string;
  ord: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  owName: string;
  rcTime: string;
  chaksun1?: number;
  rcCondition: string;
  rcDay?: string;
  rcWeekday?: string;
  weather?: string;
  track?: string; // KRA: 주로상태
  finishTime?: string;
  margin?: string;
  odds?: number;
  popularity?: number;
}

export interface CreateRaceResultRequest {
  raceId: string;
  ord: string; // KRA: 순위
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  owName: string;
  rcTime: string;
  chaksun1?: number;
  finishTime?: string;
  margin?: string;
  odds?: number;
  popularity?: number;
}

export interface UpdateRaceResultRequest {
  ord?: string;
  rcTime?: string;
  chaksun1?: number;
  finishTime?: string;
  margin?: string;
  odds?: number;
  popularity?: number;
}

export interface RaceResultFilters {
  raceId?: string;
  hrNo?: string;
  jkName?: string;
  trName?: string;
  ord?: string;
  dateFrom?: Date; // 필터용 - Date
  dateTo?: Date; // 필터용 - Date
  page?: number;
  limit?: number;
}

export interface RaceResultListResponse {
  results: RaceResultDetail[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RaceResultStatistics {
  totalRaces: number;
  totalResults: number;
  averageTime: string;
  fastestTime: string;
  slowestTime: string;
  byRank: Record<
    string,
    {
      count: number;
      averageTime: string;
      totalPrize: number;
    }
  >;
  byJockey: Record<
    string,
    {
      count: number;
      wins: number;
      winRate: number;
      totalPrize: number;
    }
  >;
  byTrainer: Record<
    string,
    {
      count: number;
      wins: number;
      winRate: number;
      totalPrize: number;
    }
  >;
  byHorse: Record<
    string,
    {
      count: number;
      wins: number;
      winRate: number;
      totalPrize: number;
      averageTime: string;
    }
  >;
}

export interface RaceResultAnalysis {
  raceId: string;
  totalEntries: number;
  averageTime: string;
  timeDistribution: {
    timeRange: string;
    count: number;
    percentage: number;
  }[];
  rankDistribution: {
    rank: string;
    count: number;
    percentage: number;
  }[];
  performanceFactors: {
    trackCondition: string;
    weather: string;
    distance: string;
    grade: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
  bettingAnalysis: {
    favoriteHorse: string;
    favoriteOdds: number;
    actualWinner: string;
    actualOdds: number;
    upset: boolean;
  };
}

export interface RaceResultExport {
  raceId: string;
  rcName: string; // KRA: 경주명
  raceDate: string;
  results: RaceResultDetail[];
  summary: {
    totalEntries: number;
    totalPrize: number;
    averageTime: string;
    fastestTime: string;
    slowestTime: string;
  };
  exportFormat: 'csv' | 'excel' | 'pdf';
  exportDate: string;
}

export interface RaceResultComparison {
  raceId1: string;
  raceId2: string;
  race1: {
    name: string;
    date: string;
    results: RaceResultDetail[];
  };
  race2: {
    name: string;
    date: string;
    results: RaceResultDetail[];
  };
  similarities: {
    factor: string;
    value1: string;
    value2: string;
    difference: string;
  }[];
  differences: {
    factor: string;
    value1: string;
    value2: string;
    impact: string;
  }[];
}

export interface RaceResultTrend {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  trends: {
    date: string;
    totalRaces: number;
    averageTime: string;
    totalPrize: number;
    winRate: number;
  }[];
  topPerformers: {
    horses: {
      hrNo: string;
      hrName: string;
      wins: number;
      winRate: number;
      totalPrize: number;
    }[];
    jockeys: {
      name: string;
      wins: number;
      winRate: number;
      totalPrize: number;
    }[];
    trainers: {
      name: string;
      wins: number;
      winRate: number;
      totalPrize: number;
    }[];
  };
}

export interface RaceResultValidation {
  raceId: string;
  results: RaceResultDetail[];
  validationErrors: {
    type: 'MISSING_DATA' | 'INVALID_DATA' | 'CONSISTENCY_ERROR' | 'BUSINESS_RULE_VIOLATION';
    field: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    suggestedFix?: string;
  }[];
  warnings: {
    field: string;
    message: string;
    suggestion: string;
  }[];
  isValid: boolean;
  canProceed: boolean;
}
