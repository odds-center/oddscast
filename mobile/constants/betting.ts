// 베팅 관련 상수
export const BETTING_CONSTANTS = {
  // 베팅 타입
  TYPES: {
    WIN: 'WIN', // 단승
    PLACE: 'PLACE', // 복승
    QUINELLA: 'QUINELLA', // 연승
    EXACTA: 'EXACTA', // 정확한 순서
    TRIFECTA: 'TRIFECTA', // 삼복승
    SUPERFECTA: 'SUPERFECTA', // 사복승
  },

  // 베팅 상태
  STATUS: {
    PENDING: 'PENDING', // 대기중
    ACTIVE: 'ACTIVE', // 활성
    WON: 'WON', // 당첨
    LOST: 'LOST', // 미당첨
    CANCELLED: 'CANCELLED', // 취소됨
    REFUNDED: 'REFUNDED', // 환불됨
  },

  // 베팅 결과
  RESULTS: {
    WIN: 'WIN',
    LOSE: 'LOSE',
    DRAW: 'DRAW',
    CANCELLED: 'CANCELLED',
    PENDING: 'PENDING',
  },

  // 베팅 금액
  AMOUNTS: {
    MIN: 100, // 최소 베팅 금액
    MAX: 1000000, // 최대 베팅 금액
    DEFAULT: 1000, // 기본 베팅 금액
  },

  // 배당률
  ODDS: {
    MIN: 1.0,
    MAX: 999.0,
    DEFAULT: 2.0,
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    INSUFFICIENT_POINTS: '포인트가 부족합니다.',
    INVALID_AMOUNT: '올바르지 않은 베팅 금액입니다.',
    RACE_NOT_FOUND: '경주를 찾을 수 없습니다.',
    BETTING_CLOSED: '베팅이 마감되었습니다.',
    ALREADY_BET: '이미 베팅하신 경주입니다.',
    BET_CREATION_FAILED: '베팅 생성에 실패했습니다.',
    BET_UPDATE_FAILED: '베팅 수정에 실패했습니다.',
    BET_CANCELLATION_FAILED: '베팅 취소에 실패했습니다.',
  },

  // 성공 메시지
  SUCCESS_MESSAGES: {
    BET_CREATED: '베팅이 성공적으로 생성되었습니다.',
    BET_UPDATED: '베팅이 성공적으로 수정되었습니다.',
    BET_CANCELLED: '베팅이 성공적으로 취소되었습니다.',
    BET_WON: '축하합니다! 베팅에 당첨되었습니다!',
  },

  // 베팅 제한
  LIMITS: {
    MAX_BETS_PER_RACE: 10, // 경주당 최대 베팅 수
    MAX_BETS_PER_USER: 50, // 사용자당 최대 베팅 수
    MIN_TIME_BEFORE_RACE: 5 * 60 * 1000, // 경주 시작 5분 전까지 베팅 가능
  },
} as const;

// 베팅 유틸리티 함수
export const BETTING_UTILS = {
  // 베팅 타입 라벨
  getBetTypeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      [BETTING_CONSTANTS.TYPES.WIN]: '단승',
      [BETTING_CONSTANTS.TYPES.PLACE]: '복승',
      [BETTING_CONSTANTS.TYPES.QUINELLA]: '연승',
      [BETTING_CONSTANTS.TYPES.EXACTA]: '정확한 순서',
      [BETTING_CONSTANTS.TYPES.TRIFECTA]: '삼복승',
      [BETTING_CONSTANTS.TYPES.SUPERFECTA]: '사복승',
    };
    return labels[type] || type;
  },

  // 베팅 상태 라벨
  getBetStatusLabel: (status: string): string => {
    const labels: Record<string, string> = {
      [BETTING_CONSTANTS.STATUS.PENDING]: '대기중',
      [BETTING_CONSTANTS.STATUS.ACTIVE]: '진행중',
      [BETTING_CONSTANTS.STATUS.WON]: '당첨',
      [BETTING_CONSTANTS.STATUS.LOST]: '미당첨',
      [BETTING_CONSTANTS.STATUS.CANCELLED]: '취소됨',
      [BETTING_CONSTANTS.STATUS.REFUNDED]: '환불됨',
    };
    return labels[status] || status;
  },

  // 베팅 결과 라벨
  getBetResultLabel: (result: string): string => {
    const labels: Record<string, string> = {
      [BETTING_CONSTANTS.RESULTS.WIN]: '당첨',
      [BETTING_CONSTANTS.RESULTS.LOSE]: '미당첨',
      [BETTING_CONSTANTS.RESULTS.DRAW]: '무승부',
      [BETTING_CONSTANTS.RESULTS.CANCELLED]: '취소',
      [BETTING_CONSTANTS.RESULTS.PENDING]: '대기중',
    };
    return labels[result] || result;
  },

  // 베팅 상태 색상
  getBetStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      [BETTING_CONSTANTS.STATUS.PENDING]: '#FF9800', // 주황
      [BETTING_CONSTANTS.STATUS.ACTIVE]: '#2196F3', // 파랑
      [BETTING_CONSTANTS.STATUS.WON]: '#4CAF50', // 초록
      [BETTING_CONSTANTS.STATUS.LOST]: '#F44336', // 빨강
      [BETTING_CONSTANTS.STATUS.CANCELLED]: '#9E9E9E', // 회색
      [BETTING_CONSTANTS.STATUS.REFUNDED]: '#FF9800', // 주황
    };
    return colors[status] || '#666666';
  },

  // 베팅 결과 색상
  getBetResultColor: (result: string): string => {
    const colors: Record<string, string> = {
      [BETTING_CONSTANTS.RESULTS.WIN]: '#4CAF50', // 초록
      [BETTING_CONSTANTS.RESULTS.LOSE]: '#F44336', // 빨강
      [BETTING_CONSTANTS.RESULTS.DRAW]: '#FF9800', // 주황
      [BETTING_CONSTANTS.RESULTS.CANCELLED]: '#9E9E9E', // 회색
      [BETTING_CONSTANTS.RESULTS.PENDING]: '#2196F3', // 파랑
    };
    return colors[result] || '#666666';
  },
} as const;
