import { BetType, BET_TYPES } from '@/lib/types/bet';

// 승식 라벨 가져오기
export const getBetTypeLabel = (betType: BetType): string => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  return betTypeInfo?.label || betType;
};

// 마권 설명 생성
export const generateBetDescription = (
  betType: BetType,
  selections: { horses: string[] }
): string => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  if (!betTypeInfo) return '알 수 없는 마권';

  const horseNumbers = selections.horses.join(', ');

  switch (betType) {
    case BetType.WIN:
      return `${horseNumbers}번마 단승식`;
    case BetType.PLACE:
      return `${horseNumbers}번마 복승식`;
    case BetType.QUINELLA:
      return `${horseNumbers}번마 연승식`;
    case BetType.QUINELLA_PLACE:
      return `${horseNumbers}번마 복연승식`;
    case BetType.EXACTA:
      return `${horseNumbers}번마 쌍승식`;
    case BetType.TRIFECTA:
      return `${horseNumbers}번마 삼복승식`;
    case BetType.TRIPLE:
      return `${horseNumbers}번마 삼쌍승식`;
    default:
      return `${horseNumbers}번마 ${betTypeInfo.label}`;
  }
};

// 승식별 최대 마 수 가져오기
export const getMaxHorsesForBetType = (betType: BetType): number => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  return betTypeInfo?.maxHorses || 1;
};

// 승식별 최소 마 수 가져오기
export const getMinHorsesForBetType = (betType: BetType): number => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  return betTypeInfo?.minHorses || 1;
};

// 마권 구매 가능 여부 확인
export const canPlaceBet = (
  betType: BetType,
  selectedHorses: string[],
  betAmount: number
): boolean => {
  const minHorses = getMinHorsesForBetType(betType);
  const maxHorses = getMaxHorsesForBetType(betType);

  const validHorseCount = selectedHorses.length >= minHorses && selectedHorses.length <= maxHorses;
  const validAmount = betAmount >= 100 && betAmount <= 100000;

  return validHorseCount && validAmount;
};

// 예상 당첨금 계산 (간단한 예시)
export const calculatePotentialWin = (betAmount: number, odds: number): number => {
  return Math.round(betAmount * odds);
};

// 마권 위험도 계산
export const calculateRiskLevel = (betType: BetType, odds: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (odds <= 2.0) return 'LOW';
  if (odds <= 5.0) return 'MEDIUM';
  return 'HIGH';
};

// 마권 수익률 계산
export const calculateROI = (betAmount: number, payout: number): number => {
  if (betAmount === 0) return 0;
  return ((payout - betAmount) / betAmount) * 100;
};

// 마권 상태에 따른 색상 반환
export const getBetStatusColor = (status: string): string => {
  switch (status) {
    case 'WIN':
      return '#4CAF50';
    case 'LOSS':
      return '#F44336';
    case 'PENDING':
      return '#FF9800';
    case 'ACTIVE':
      return '#2196F3';
    case 'CANCELLED':
      return '#9E9E9E';
    case 'SETTLED':
      return '#4CAF50';
    default:
      return '#666666';
  }
};

// 마권 결과 텍스트 반환
export const getBetResultText = (result: string): string => {
  switch (result) {
    case 'WIN':
      return '당첨';
    case 'LOSS':
      return '미당첨';
    case 'PUSH':
      return '무승부';
    case 'VOID':
      return '무효';
    default:
      return result || '대기중';
  }
};

// 마권 상태 텍스트 반환
export const getBetStatusText = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return '대기중';
    case 'ACTIVE':
      return '진행중';
    case 'WIN':
      return '당첨';
    case 'LOSS':
      return '미당첨';
    case 'CANCELLED':
      return '취소됨';
    case 'SETTLED':
      return '정산됨';
    default:
      return status;
  }
};

// 승식별 설명 가져오기
export const getBetTypeDescription = (betType: BetType): string => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  return betTypeInfo?.description || '설명 없음';
};

// 승식별 예시 가져오기
export const getBetTypeExample = (betType: BetType): string => {
  const betTypeInfo = BET_TYPES.find((bt) => bt.value === betType);
  return betTypeInfo?.example || '예시 없음';
};
