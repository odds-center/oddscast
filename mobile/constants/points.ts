// 포인트 관련 상수
export const POINTS_CONSTANTS = {
  // 포인트 거래 타입
  TRANSACTION_TYPES: {
    EARNED: 'EARNED', // 적립
    SPENT: 'SPENT', // 사용
    REFUNDED: 'REFUNDED', // 환불
    BONUS: 'BONUS', // 보너스
    PENALTY: 'PENALTY', // 페널티
    ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT', // 관리자 조정
  },

  // 포인트 거래 상태
  TRANSACTION_STATUS: {
    PENDING: 'PENDING', // 대기중
    COMPLETED: 'COMPLETED', // 완료
    FAILED: 'FAILED', // 실패
    CANCELLED: 'CANCELLED', // 취소
  },

  // 포인트 거래 카테고리
  CATEGORIES: {
    BET_PLACED: 'BET_PLACED', // 베팅
    BET_WON: 'BET_WON', // 베팅 당첨
    BET_LOST: 'BET_LOST', // 베팅 미당첨
    EVENT_BONUS: 'EVENT_BONUS', // 이벤트 보너스
    DAILY_LOGIN: 'DAILY_LOGIN', // 일일 로그인
    REFERRAL: 'REFERRAL', // 추천인
    EXPIRY: 'EXPIRY', // 만료
    ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT', // 관리자 조정
  },

  // 포인트 금액
  AMOUNTS: {
    MIN: 1, // 최소 포인트
    MAX: 999999999, // 최대 포인트
    DEFAULT: 1000, // 기본 포인트
    DAILY_LOGIN_BONUS: 100, // 일일 로그인 보너스
    REFERRAL_BONUS: 1000, // 추천인 보너스
    EVENT_BONUS: 500, // 이벤트 보너스
    MIN_BET_AMOUNT: 100, // 최소 베팅 금액
    MAX_BET_AMOUNT: 100000, // 최대 베팅 금액
  },

  // 포인트 만료
  EXPIRY: {
    DEFAULT_DAYS: 365, // 기본 만료일 (1년)
    WARNING_DAYS: 30, // 만료 경고일 (30일 전)
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    INSUFFICIENT_POINTS: '포인트가 부족합니다.',
    INVALID_AMOUNT: '올바르지 않은 포인트 금액입니다.',
    TRANSACTION_FAILED: '포인트 거래에 실패했습니다.',
    POINTS_ADD_FAILED: '포인트 추가에 실패했습니다.',
    POINTS_DEDUCT_FAILED: '포인트 차감에 실패했습니다.',
    TRANSFER_FAILED: '포인트 이체에 실패했습니다.',
    EXPIRY_DATE_INVALID: '만료일이 올바르지 않습니다.',
  },

  // 성공 메시지
  SUCCESS_MESSAGES: {
    POINTS_ADDED: '포인트가 성공적으로 추가되었습니다.',
    POINTS_DEDUCTED: '포인트가 성공적으로 차감되었습니다.',
    TRANSFER_COMPLETED: '포인트 이체가 완료되었습니다.',
    BONUS_RECEIVED: '보너스 포인트를 받았습니다.',
  },

  // 포인트 등급
  LEVELS: {
    BRONZE: {
      NAME: 'BRONZE',
      MIN_POINTS: 0,
      MAX_POINTS: 9999,
      LABEL: '브론즈',
      COLOR: '#CD7F32',
    },
    SILVER: {
      NAME: 'SILVER',
      MIN_POINTS: 10000,
      MAX_POINTS: 49999,
      LABEL: '실버',
      COLOR: '#C0C0C0',
    },
    GOLD: {
      NAME: 'GOLD',
      MIN_POINTS: 50000,
      MAX_POINTS: 199999,
      LABEL: '골드',
      COLOR: '#FFD700',
    },
    PLATINUM: {
      NAME: 'PLATINUM',
      MIN_POINTS: 200000,
      MAX_POINTS: 999999,
      LABEL: '플래티넘',
      COLOR: '#E5E4E2',
    },
    DIAMOND: {
      NAME: 'DIAMOND',
      MIN_POINTS: 1000000,
      MAX_POINTS: Infinity,
      LABEL: '다이아몬드',
      COLOR: '#B9F2FF',
    },
  },
} as const;

// 포인트 유틸리티 함수
export const POINTS_UTILS = {
  // 거래 타입 라벨
  getTransactionTypeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      [POINTS_CONSTANTS.TRANSACTION_TYPES.EARNED]: '적립',
      [POINTS_CONSTANTS.TRANSACTION_TYPES.SPENT]: '사용',
      [POINTS_CONSTANTS.TRANSACTION_TYPES.REFUNDED]: '환불',
      [POINTS_CONSTANTS.TRANSACTION_TYPES.BONUS]: '보너스',
      [POINTS_CONSTANTS.TRANSACTION_TYPES.PENALTY]: '페널티',
      [POINTS_CONSTANTS.TRANSACTION_TYPES.ADMIN_ADJUSTMENT]: '관리자 조정',
    };
    return labels[type] || type;
  },

  // 거래 상태 라벨
  getTransactionStatusLabel: (status: string): string => {
    const labels: Record<string, string> = {
      [POINTS_CONSTANTS.TRANSACTION_STATUS.PENDING]: '대기중',
      [POINTS_CONSTANTS.TRANSACTION_STATUS.COMPLETED]: '완료',
      [POINTS_CONSTANTS.TRANSACTION_STATUS.FAILED]: '실패',
      [POINTS_CONSTANTS.TRANSACTION_STATUS.CANCELLED]: '취소',
    };
    return labels[status] || status;
  },

  // 거래 카테고리 라벨
  getCategoryLabel: (category: string): string => {
    const labels: Record<string, string> = {
      [POINTS_CONSTANTS.CATEGORIES.BET_PLACED]: '베팅',
      [POINTS_CONSTANTS.CATEGORIES.BET_WON]: '베팅 당첨',
      [POINTS_CONSTANTS.CATEGORIES.BET_LOST]: '베팅 미당첨',
      [POINTS_CONSTANTS.CATEGORIES.EVENT_BONUS]: '이벤트 보너스',
      [POINTS_CONSTANTS.CATEGORIES.DAILY_LOGIN]: '일일 로그인',
      [POINTS_CONSTANTS.CATEGORIES.REFERRAL]: '추천인',
      [POINTS_CONSTANTS.CATEGORIES.EXPIRY]: '만료',
      [POINTS_CONSTANTS.CATEGORIES.ADMIN_ADJUSTMENT]: '관리자 조정',
    };
    return labels[category] || category;
  },

  // 거래 타입 색상
  getTransactionTypeColor: (type: string): string => {
    const colors: Record<string, string> = {
      [POINTS_CONSTANTS.TRANSACTION_TYPES.EARNED]: '#4CAF50', // 초록
      [POINTS_CONSTANTS.TRANSACTION_TYPES.SPENT]: '#F44336', // 빨강
      [POINTS_CONSTANTS.TRANSACTION_TYPES.REFUNDED]: '#2196F3', // 파랑
      [POINTS_CONSTANTS.TRANSACTION_TYPES.BONUS]: '#FF9800', // 주황
      [POINTS_CONSTANTS.TRANSACTION_TYPES.PENALTY]: '#9C27B0', // 보라
      [POINTS_CONSTANTS.TRANSACTION_TYPES.ADMIN_ADJUSTMENT]: '#607D8B', // 회색
    };
    return colors[type] || '#666666';
  },

  // 거래 상태 색상
  getTransactionStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      [POINTS_CONSTANTS.TRANSACTION_STATUS.PENDING]: '#FF9800', // 주황
      [POINTS_CONSTANTS.TRANSACTION_STATUS.COMPLETED]: '#4CAF50', // 초록
      [POINTS_CONSTANTS.TRANSACTION_STATUS.FAILED]: '#F44336', // 빨강
      [POINTS_CONSTANTS.TRANSACTION_STATUS.CANCELLED]: '#9E9E9E', // 회색
    };
    return colors[status] || '#666666';
  },

  // 포인트 등급 계산
  getPointsLevel: (points: number) => {
    const levels = Object.values(POINTS_CONSTANTS.LEVELS);
    return (
      levels.find((level) => points >= level.MIN_POINTS && points <= level.MAX_POINTS) || levels[0]
    );
  },

  // 포인트 포맷팅
  formatPoints: (points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  },

  // 포인트 금액 검증
  isValidAmount: (amount: number): boolean => {
    return amount >= POINTS_CONSTANTS.AMOUNTS.MIN && amount <= POINTS_CONSTANTS.AMOUNTS.MAX;
  },

  // 포인트 만료일 계산
  calculateExpiryDate: (days: number = POINTS_CONSTANTS.EXPIRY.DEFAULT_DAYS): Date => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  },

  // 포인트 만료 경고 확인
  isExpiringSoon: (expiryDate: Date): boolean => {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= POINTS_CONSTANTS.EXPIRY.WARNING_DAYS;
  },

  // 사용자 레벨 계산
  getUserLevel: (points: number) => {
    const levels = Object.values(POINTS_CONSTANTS.LEVELS);
    return (
      levels.find((level) => points >= level.MIN_POINTS && points <= level.MAX_POINTS) || levels[0]
    );
  },

  // 다음 레벨 정보
  getNextLevel: (currentLevel: any) => {
    const levels = Object.values(POINTS_CONSTANTS.LEVELS);
    const currentIndex = levels.findIndex((level) => level.NAME === currentLevel.NAME);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  },

  // 다음 레벨까지 진행률 계산
  getProgressToNextLevel: (points: number, currentLevel: any) => {
    const nextLevel = POINTS_UTILS.getNextLevel(currentLevel);
    if (!nextLevel) return 100;

    const currentLevelPoints = currentLevel.MIN_POINTS;
    const nextLevelPoints = nextLevel.MIN_POINTS;
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  },

  // 레벨 아이콘
  getLevelIcon: (level: any) => {
    const icons: Record<string, string> = {
      BRONZE: 'star',
      SILVER: 'star',
      GOLD: 'star',
      PLATINUM: 'star',
      DIAMOND: 'diamond',
    };
    return icons[level.NAME] || 'star';
  },

  // 레벨 라벨
  getLevelLabel: (level: any) => {
    return level.LABEL || 'Unknown';
  },

  // 레벨 설명
  getLevelDescription: (level: any) => {
    const descriptions: Record<string, string> = {
      BRONZE: '초보 베터',
      SILVER: '경험 베터',
      GOLD: '전문 베터',
      PLATINUM: '마스터 베터',
      DIAMOND: '레전드 베터',
    };
    return descriptions[level.NAME] || 'Unknown Level';
  },
} as const;
