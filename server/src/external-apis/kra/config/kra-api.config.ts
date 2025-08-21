export interface KraApiEndpoint {
  name: string;
  url: string;
  description: string;
  dailyLimit?: number;
  rateLimit?: number; // 분당 요청 제한
}

export interface KraApiConfig {
  baseUrls: Record<string, KraApiEndpoint>;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  defaultDailyLimit: number;
  defaultRateLimit: number;
}

export const KRA_API_ENDPOINTS: Record<string, KraApiEndpoint> = {
  RACE_PLANS: {
    name: '경주계획표',
    url: 'https://apis.data.go.kr/B551015/API72_2',
    description: '전국 경마공원 경주계획표 (경주일자, 경주번호, 경주차수 등)',
    dailyLimit: 10000,
    rateLimit: 100, // 분당 100회
  },
  DIVIDEND_RATES: {
    name: '확정배당율',
    url: 'https://apis.data.go.kr/B551015/API160_1',
    description: '한국마사회 확정배당율 통합 정보',
    dailyLimit: 10000,
    rateLimit: 100,
  },
  RACE_RECORDS: {
    name: '경주기록',
    url: 'https://apis.data.go.kr/B551015/API4_3',
    description: '경주 결과 및 기록 정보',
    dailyLimit: 10000,
    rateLimit: 100,
  },
  ENTRY_DETAILS: {
    name: '출마표',
    url: 'https://apis.data.go.kr/B551015/API26_2',
    description: '경주별 출마 말 상세 정보',
    dailyLimit: 10000,
    rateLimit: 100,
  },
};

export const KRA_MEETS = {
  SEOUL: { code: '1', name: '서울', fullName: '서울경마공원' },
  BUSAN: { code: '2', name: '부산경남', fullName: '부산경남경마공원' },
  JEJU: { code: '3', name: '제주', fullName: '제주경마공원' },
} as const;

export const KRA_RACE_GRADES = {
  SPECIAL: { code: 'S', name: '특별', description: '특별경주' },
  GRADE1: { code: '1', name: '1급', description: '1급경주' },
  GRADE2: { code: '2', name: '2급', description: '2급경주' },
  GRADE3: { code: '3', name: '3급', description: '3급경주' },
  OPEN: { code: 'O', name: '오픈', description: '오픈경주' },
  CONDITION: { code: 'C', name: '컨디션', description: '컨디션경주' },
} as const;

export const KRA_BET_TYPES = {
  WIN: { code: 'W', name: '단승', description: '1위 예측' },
  PLACE: { code: 'P', name: '연승', description: '1-2위 예측' },
  QUINELLA: { code: 'Q', name: '복승', description: '1-2위 순서 무관' },
  EXACTA: { code: 'E', name: '정확한 순서', description: '1-2위 정확한 순서' },
  TRIFECTA: { code: 'T', name: '삼복승', description: '1-2-3위 순서 무관' },
} as const;

export const getKraApiConfig = (apiKey: string): KraApiConfig => ({
  baseUrls: KRA_API_ENDPOINTS,
  apiKey,
  timeout: 10000, // 10초
  maxRetries: 3,
  defaultDailyLimit: 10000,
  defaultRateLimit: 100,
});

export const getEndpointConfig = (endpointKey: string): KraApiEndpoint => {
  const endpoint = KRA_API_ENDPOINTS[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown KRA API endpoint: ${endpointKey}`);
  }
  return endpoint;
};

export const getMeetInfo = (meetCode: string) => {
  return Object.values(KRA_MEETS).find(meet => meet.code === meetCode);
};

export const getRaceGradeInfo = (gradeCode: string) => {
  return Object.values(KRA_RACE_GRADES).find(grade => grade.code === gradeCode);
};

export const getBetTypeInfo = (betTypeCode: string) => {
  return Object.values(KRA_BET_TYPES).find(type => type.code === betTypeCode);
};
