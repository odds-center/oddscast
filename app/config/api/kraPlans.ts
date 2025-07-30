// KRA (한국마사회) 경주계획표 API 설정
export const KRA_PLANS_CONFIG = {
  // 기본 API 설정
  baseURL: 'https://apis.data.go.kr/B551015/API72_2',

  // API 엔드포인트들
  endpoints: {
    // 전국 경마공원 경주계획표
    racePlans: '/',
  },

  // API 키 설정 (공공데이터포털 인증키)
  apiKey:
    process.env.KRA_API_KEY ||
    'yyRDa/aXc9SsDdY67IqkdXJmZgZXOzsKqnf+R/SZjR6iAxYLzKiq+gXTmdUj/Fe+FtEsMXnMYrLaiX6PZ/emsQ==',

  // 요청 제한 설정 (공공데이터포털 일일 트래픽 10,000건)
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },

  // 타임아웃 설정
  timeout: {
    request: 10000, // 10초
    response: 30000, // 30초
  },
};

// KRA 경주계획표 API 응답 타입 정의
export interface KRARacePlan {
  meet: string; // 경마장 코드
  meet_name: string; // 경마장명
  rc_date: string; // 경주일자
  rc_no: number; // 경주번호
  rc_name: string; // 경주명
  rc_dist: number; // 경주거리
  rc_grade: string; // 등급
  rc_prize: number; // 상금
  rc_condition: string; // 부담구분
  rc_weather: string; // 날씨
  rc_track: string; // 트랙
  rc_track_condition: string; // 트랙상태
  rc_start_time: string; // 시작시간
  rc_end_time: string; // 종료시간
  rc_year: string; // 경주년
  rc_month: string; // 경주월
  rc_day: string; // 경주일
  rc_round: number; // 경주차수
}

// KRA 경주계획표 API 헬퍼 함수들
export const KRA_PLANS_HELPERS = {
  // API 키 유효성 검사
  validateApiKey: (): boolean => {
    return !!KRA_PLANS_CONFIG.apiKey;
  },

  // 요청 헤더 생성 (공공데이터포털 API)
  createHeaders: (): Record<string, string> => {
    return {
      'Content-Type': 'application/json',
    };
  },

  // 날짜 형식 변환 (KRA API 형식: YYYYMMDD)
  formatDate: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  },

  // 경주장 코드 변환
  getVenueCode: (venue: string): string => {
    const venueMap: Record<string, string> = {
      서울: '1',
      부산: '2',
      제주: '3',
    };
    return venueMap[venue] || venue;
  },

  // 경주장명 변환
  getVenueName: (venueCode: string): string => {
    const venueNames: Record<string, string> = {
      '1': '서울',
      '2': '부산',
      '3': '제주',
    };
    return venueNames[venueCode] || '알 수 없음';
  },

  // 날짜 파라미터 생성 (년, 월, 일 분리)
  getDateParams: (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      rc_year: year.toString(),
      rc_month: month,
      rc_day: day,
    };
  },
};

export default KRA_PLANS_CONFIG;
