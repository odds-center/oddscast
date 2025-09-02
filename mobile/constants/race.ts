// 경주 관련 상수
export const RACE_CONSTANTS = {
  // 경주 상태
  STATUS: {
    UPCOMING: 'UPCOMING', // 예정
    IN_PROGRESS: 'IN_PROGRESS', // 진행중
    COMPLETED: 'COMPLETED', // 완료
    CANCELLED: 'CANCELLED', // 취소
    POSTPONED: 'POSTPONED', // 연기
  },

  // 경주 등급
  GRADES: {
    G1: 'G1', // 그룹1
    G2: 'G2', // 그룹2
    G3: 'G3', // 그룹3
    LISTED: 'LISTED', // 리스티드
    MAIDEN: 'MAIDEN', // 메이든
    HANDICAP: 'HANDICAP', // 핸디캡
  },

  // 경주장
  VENUES: {
    SEOUL: '서울',
    BUSAN: '부산',
    JEJU: '제주',
    GWANGJU: '광주',
  },

  // 경주 조건
  CONDITIONS: {
    TURF: 'TURF', // 잔디
    DIRT: 'DIRT', // 모래
    ALL_WEATHER: 'ALL_WEATHER', // 합성
  },

  // 경주 거리
  DISTANCES: {
    SHORT: 'SHORT', // 단거 (1000m 이하)
    MIDDLE: 'MIDDLE', // 중거 (1000m-1800m)
    LONG: 'LONG', // 장거 (1800m 이상)
  },

  // 경주 나이 조건
  AGE_CONDITIONS: {
    TWO_YEAR_OLD: '2YO',
    THREE_YEAR_OLD: '3YO',
    FOUR_YEAR_OLD: '4YO',
    OLDER: 'OLDER',
    ALL_AGES: 'ALL',
  },

  // 경주 성별 조건
  SEX_CONDITIONS: {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    GELDING: 'GELDING',
    ALL: 'ALL',
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    RACE_NOT_FOUND: '경주를 찾을 수 없습니다.',
    RACE_ALREADY_STARTED: '경주가 이미 시작되었습니다.',
    RACE_CANCELLED: '경주가 취소되었습니다.',
    INVALID_RACE_ID: '올바르지 않은 경주 ID입니다.',
    RACE_DATA_LOAD_FAILED: '경주 데이터 로드에 실패했습니다.',
  },

  // 성공 메시지
  SUCCESS_MESSAGES: {
    RACE_DATA_LOADED: '경주 데이터가 성공적으로 로드되었습니다.',
    FAVORITE_ADDED: '즐겨찾기에 추가되었습니다.',
    FAVORITE_REMOVED: '즐겨찾기에서 제거되었습니다.',
  },

  // 시간 관련
  TIME: {
    BETTING_CLOSE_BEFORE_RACE: 5 * 60 * 1000, // 경주 시작 5분 전 베팅 마감
    RESULT_UPDATE_DELAY: 2 * 60 * 1000, // 경주 완료 후 2분 후 결과 업데이트
  },

  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// 경주 유틸리티 함수
export const RACE_UTILS = {
  // 경주 상태 라벨
  getRaceStatusLabel: (status: string): string => {
    const labels: Record<string, string> = {
      [RACE_CONSTANTS.STATUS.UPCOMING]: '예정',
      [RACE_CONSTANTS.STATUS.IN_PROGRESS]: '진행중',
      [RACE_CONSTANTS.STATUS.COMPLETED]: '완료',
      [RACE_CONSTANTS.STATUS.CANCELLED]: '취소',
      [RACE_CONSTANTS.STATUS.POSTPONED]: '연기',
    };
    return labels[status] || status;
  },

  // 경주 등급 라벨
  getRaceGradeLabel: (grade: string): string => {
    const labels: Record<string, string> = {
      [RACE_CONSTANTS.GRADES.G1]: '그룹1',
      [RACE_CONSTANTS.GRADES.G2]: '그룹2',
      [RACE_CONSTANTS.GRADES.G3]: '그룹3',
      [RACE_CONSTANTS.GRADES.LISTED]: '리스티드',
      [RACE_CONSTANTS.GRADES.MAIDEN]: '메이든',
      [RACE_CONSTANTS.GRADES.HANDICAP]: '핸디캡',
    };
    return labels[grade] || grade;
  },

  // 경주 상태 색상 (골드 테마로 변경)
  getRaceStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      [RACE_CONSTANTS.STATUS.UPCOMING]: '#DAA520', // 골든로드 (예정)
      [RACE_CONSTANTS.STATUS.IN_PROGRESS]: '#FFD700', // 진한 골드 (진행중)
      [RACE_CONSTANTS.STATUS.COMPLETED]: '#B8860B', // 다크골든로드 (완료)
      [RACE_CONSTANTS.STATUS.CANCELLED]: '#CD853F', // 페루 (취소)
      [RACE_CONSTANTS.STATUS.POSTPONED]: '#8B7355', // 회색 골드 (연기)
    };
    return colors[status] || '#8B7355';
  },

  // 경주 등급 색상 (골드 테마로 변경)
  getRaceGradeColor: (grade: string): string => {
    const colors: Record<string, string> = {
      [RACE_CONSTANTS.GRADES.G1]: '#FFD700', // 진한 골드 (그룹1)
      [RACE_CONSTANTS.GRADES.G2]: '#DAA520', // 골든로드 (그룹2)
      [RACE_CONSTANTS.GRADES.G3]: '#B8860B', // 다크골든로드 (그룹3)
      [RACE_CONSTANTS.GRADES.LISTED]: '#CD853F', // 페루 (리스티드)
      [RACE_CONSTANTS.GRADES.MAIDEN]: '#8B7355', // 회색 골드 (메이든)
      [RACE_CONSTANTS.GRADES.HANDICAP]: '#D2691E', // 초콜릿 (핸디캡)
    };
    return colors[grade] || '#8B7355';
  },

  // 거리 라벨
  getDistanceLabel: (distance: number): string => {
    if (distance <= 1000) return '단거';
    if (distance <= 1800) return '중거';
    return '장거';
  },

  // 나이 조건 라벨
  getAgeConditionLabel: (ageCondition: string): string => {
    const labels: Record<string, string> = {
      [RACE_CONSTANTS.AGE_CONDITIONS.TWO_YEAR_OLD]: '2세',
      [RACE_CONSTANTS.AGE_CONDITIONS.THREE_YEAR_OLD]: '3세',
      [RACE_CONSTANTS.AGE_CONDITIONS.FOUR_YEAR_OLD]: '4세',
      [RACE_CONSTANTS.AGE_CONDITIONS.OLDER]: '4세 이상',
      [RACE_CONSTANTS.AGE_CONDITIONS.ALL_AGES]: '전연령',
    };
    return labels[ageCondition] || ageCondition;
  },

  // 성별 조건 라벨
  getSexConditionLabel: (sexCondition: string): string => {
    const labels: Record<string, string> = {
      [RACE_CONSTANTS.SEX_CONDITIONS.MALE]: '수말',
      [RACE_CONSTANTS.SEX_CONDITIONS.FEMALE]: '암말',
      [RACE_CONSTANTS.SEX_CONDITIONS.GELDING]: '거세마',
      [RACE_CONSTANTS.SEX_CONDITIONS.ALL]: '전체',
    };
    return labels[sexCondition] || sexCondition;
  },
} as const;
