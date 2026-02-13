/**
 * KRA API 상수 정의
 * 한국마사회 Open API 관련 모든 상수를 관리합니다.
 */

// ============================================
// API 엔드포인트 상수
// ============================================

export const KRA_API_BASE_URL = 'http://apis.data.go.kr';

export const KRA_API_ENDPOINTS = {
  /** 경주기록 정보 API */
  RACE_RECORDS: {
    name: '경주기록',
    apiCode: 'API4_3',
    endpoint: 'raceResult_3',
    baseUrl: `${KRA_API_BASE_URL}/B551015/API4_3`,
    fullUrl: `${KRA_API_BASE_URL}/B551015/API4_3/raceResult_3`,
    description:
      '서울, 부산경남, 제주 경마장에서 시행된 경주정보 (경주일자, 경주번호, 경주거리, 부담구분, 상금, 순위, 출전마정보, 구간별기록, 경주기록)',
    dailyLimit: 10000,
    rateLimit: 100, // 분당 요청 제한
    tps: 30, // 초당 최대 트랜잭션
  },

  /** 출전표 상세정보 API */
  ENTRY_SHEET: {
    name: '출전표',
    apiCode: 'API26_2',
    endpoint: 'entrySheet_2',
    baseUrl: `${KRA_API_BASE_URL}/B551015/API26_2`,
    fullUrl: `${KRA_API_BASE_URL}/B551015/API26_2/entrySheet_2`,
    description:
      '서울, 부산경남, 제주 경마장에서 시행예정인 경주의 출전경주마 정보',
    dailyLimit: 10000,
    rateLimit: 100,
    tps: 30,
  },

  /** 확정배당율 통합 정보 API */
  DIVIDEND_RATES: {
    name: '확정배당율',
    apiCode: 'API160',
    endpoint: 'integratedInfo',
    baseUrl: `${KRA_API_BASE_URL}/B551015/API160`,
    fullUrl: `${KRA_API_BASE_URL}/B551015/API160/integratedInfo`,
    description:
      '서울, 부산경남, 제주 경마장에서 시행된 경주의 단승식, 복승식, 연승식, 쌍승식, 삼복승 삼쌍승식 확정배당율 정보',
    dailyLimit: 10000,
    rateLimit: 100,
    tps: 30,
  },

  /** 경주계획표 API */
  RACE_PLANS: {
    name: '경주계획표',
    apiCode: 'API72_2',
    endpoint: 'racePlan_2',
    baseUrl: `${KRA_API_BASE_URL}/B551015/API72_2`,
    fullUrl: `${KRA_API_BASE_URL}/B551015/API72_2/racePlan_2`,
    description: '전국 경마공원 경주계획표 (경주일자, 경주번호, 경주차수 등)',
    dailyLimit: 10000,
    rateLimit: 100,
    tps: 30,
  },
} as const;

// ============================================
// 경마장 코드
// ============================================

export const KRA_MEETS = {
  SEOUL: {
    code: '1',
    name: '서울',
    fullName: '서울경마공원',
    englishName: 'Seoul',
  },
  BUSAN: {
    code: '2',
    name: '부산경남',
    fullName: '부산경남경마공원',
    englishName: 'Busan-Gyeongnam',
  },
  JEJU: {
    code: '3',
    name: '제주',
    fullName: '제주경마공원',
    englishName: 'Jeju',
  },
} as const;

export type MeetCode = '1' | '2' | '3';

// ============================================
// 경주 등급 코드
// ============================================

export const KRA_RACE_GRADES = {
  SPECIAL: {
    code: 'S',
    name: '특별',
    description: '특별경주',
    priority: 1,
  },
  GRADE1: {
    code: '1',
    name: '1급',
    description: '1급경주',
    priority: 2,
  },
  GRADE2: {
    code: '2',
    name: '2급',
    description: '2급경주',
    priority: 3,
  },
  GRADE3: {
    code: '3',
    name: '3급',
    description: '3급경주',
    priority: 4,
  },
  OPEN: {
    code: 'O',
    name: '오픈',
    description: '오픈경주',
    priority: 5,
  },
  CONDITION: {
    code: 'C',
    name: '컨디션',
    description: '컨디션경주',
    priority: 6,
  },
} as const;

// ============================================
// 베팅 타입 (승식구분)
// ============================================

export const KRA_BET_TYPES = {
  /** 단승식 - 1위 예측 */
  WIN: {
    code: 'WIN',
    shortCode: 'W',
    name: '단승식',
    englishName: 'Win',
    description: '1위 예측',
    minHorses: 1,
    maxHorses: 1,
  },
  /** 연승식 - 1-2위 예측 */
  PLACE: {
    code: 'PLC',
    shortCode: 'P',
    name: '연승식',
    englishName: 'Place',
    description: '1-2위 예측',
    minHorses: 1,
    maxHorses: 1,
  },
  /** 복승식 - 1-2위 순서 무관 */
  QUINELLA: {
    code: 'QNL',
    shortCode: 'Q',
    name: '복승식',
    englishName: 'Quinella',
    description: '1-2위 순서 무관',
    minHorses: 2,
    maxHorses: 2,
  },
  /** 쌍승식 - 1-2위 정확한 순서 */
  EXACTA: {
    code: 'EXA',
    shortCode: 'E',
    name: '쌍승식',
    englishName: 'Exacta',
    description: '1-2위 정확한 순서',
    minHorses: 2,
    maxHorses: 2,
  },
  /** 복연승식 */
  QUINELLA_PLACE: {
    code: 'QPL',
    shortCode: 'QP',
    name: '복연승식',
    englishName: 'Quinella Place',
    description: '1-2위 중 한 마리 포함',
    minHorses: 2,
    maxHorses: 2,
  },
  /** 삼복승식 - 1-2-3위 순서 무관 */
  TRIFECTA_BOX: {
    code: 'TLA',
    shortCode: 'TB',
    name: '삼복승식',
    englishName: 'Trifecta Box',
    description: '1-2-3위 순서 무관',
    minHorses: 3,
    maxHorses: 3,
  },
  /** 삼쌍승식 - 1-2-3위 정확한 순서 */
  TRIFECTA: {
    code: 'TRI',
    shortCode: 'T',
    name: '삼쌍승식',
    englishName: 'Trifecta',
    description: '1-2-3위 정확한 순서',
    minHorses: 3,
    maxHorses: 3,
  },
} as const;

// ============================================
// API 응답 코드
// ============================================

export const KRA_API_RESPONSE_CODES = {
  SUCCESS: '00',
  APPLICATION_ERROR: '01',
  INVALID_PARAMETER: '10',
  NO_SERVICE: '12',
  ACCESS_DENIED: '20',
  RATE_LIMIT_EXCEEDED: '22',
  INVALID_SERVICE_KEY: '30',
  EXPIRED_SERVICE_KEY: '31',
  UNREGISTERED_IP: '32',
  UNKNOWN_ERROR: '99',
} as const;

// ============================================
// API 에러 메시지
// ============================================

export const KRA_API_ERROR_MESSAGES = {
  [KRA_API_RESPONSE_CODES.SUCCESS]: 'NORMAL SERVICE',
  [KRA_API_RESPONSE_CODES.APPLICATION_ERROR]: '어플리케이션 에러',
  [KRA_API_RESPONSE_CODES.INVALID_PARAMETER]: '잘못된 요청 파라메터',
  [KRA_API_RESPONSE_CODES.NO_SERVICE]: '해당 오픈API서비스가 없거나 폐기됨',
  [KRA_API_RESPONSE_CODES.ACCESS_DENIED]: '서비스 접근거부',
  [KRA_API_RESPONSE_CODES.RATE_LIMIT_EXCEEDED]: '서비스 요청제한횟수 초과',
  [KRA_API_RESPONSE_CODES.INVALID_SERVICE_KEY]: '등록되지 않은 서비스키',
  [KRA_API_RESPONSE_CODES.EXPIRED_SERVICE_KEY]: '기한만료된 서비스키',
  [KRA_API_RESPONSE_CODES.UNREGISTERED_IP]: '등록되지 않은 IP',
  [KRA_API_RESPONSE_CODES.UNKNOWN_ERROR]: '기타 에러',
} as const;

// ============================================
// 날씨 코드
// ============================================

export const KRA_WEATHER_CODES = {
  CLEAR: { code: '1', name: '맑음', icon: '☀️' },
  CLOUDY: { code: '2', name: '흐림', icon: '☁️' },
  RAIN: { code: '3', name: '비', icon: '🌧️' },
  SNOW: { code: '4', name: '눈', icon: '❄️' },
} as const;

// ============================================
// 주로 상태 코드
// ============================================

export const KRA_TRACK_CONDITIONS = {
  FAST: { code: '1', name: '건조', description: '매우 좋음' },
  GOOD: { code: '2', name: '양호', description: '좋음' },
  YIELDING: { code: '3', name: '포화', description: '약간 젖음' },
  SOFT: { code: '4', name: '불량', description: '매우 젖음' },
  HEAVY: { code: '5', name: '중불량', description: '진흙' },
} as const;

// ============================================
// 기본 설정값
// ============================================

export const KRA_API_CONFIG = {
  /** 기본 타임아웃 (밀리초) */
  DEFAULT_TIMEOUT: 30000,

  /** 최대 재시도 횟수 */
  MAX_RETRIES: 3,

  /** 재시도 대기 시간 (밀리초) */
  RETRY_DELAY: 1000,

  /** 기본 페이지 크기 */
  DEFAULT_PAGE_SIZE: 100,

  /** 최대 페이지 크기 */
  MAX_PAGE_SIZE: 1000,

  /** 일일 요청 제한 */
  DAILY_LIMIT: 10000,

  /** 분당 요청 제한 */
  RATE_LIMIT_PER_MINUTE: 100,

  /** 응답 데이터 형식 */
  RESPONSE_TYPE: 'json',
} as const;

// ============================================
// 타입 정의
// ============================================

export type KraEndpointKey = keyof typeof KRA_API_ENDPOINTS;
export type MeetName = (typeof KRA_MEETS)[keyof typeof KRA_MEETS]['name'];
export type BetTypeCode =
  (typeof KRA_BET_TYPES)[keyof typeof KRA_BET_TYPES]['code'];
export type RaceGradeCode =
  (typeof KRA_RACE_GRADES)[keyof typeof KRA_RACE_GRADES]['code'];
export type WeatherCode =
  (typeof KRA_WEATHER_CODES)[keyof typeof KRA_WEATHER_CODES]['code'];
export type TrackConditionCode =
  (typeof KRA_TRACK_CONDITIONS)[keyof typeof KRA_TRACK_CONDITIONS]['code'];
