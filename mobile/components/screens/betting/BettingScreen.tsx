import { ThemedText } from '@/components/ThemedText';
import { BETTING_CONSTANTS, BETTING_UTILS } from '@/constants/betting';
import { useCreateBet } from '@/lib/hooks/useBets';
import { useUserPointBalance } from '@/lib/hooks/usePoints';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { showWarningMessage, showErrorMessage, showSuccessMessage } from '@/utils/alert';

interface BettingScreenProps {
  raceId?: string;
  raceName?: string;
  onBetPlaced?: () => void;
}

export const BettingScreen: React.FC<BettingScreenProps> = ({
  raceId = 'race-1',
  raceName = '서울마장주요',
  onBetPlaced,
}) => {
  const [selectedBetType, setSelectedBetType] = useState<string>(BETTING_CONSTANTS.TYPES.WIN);
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [betAmount, setBetAmount] = useState<number>(BETTING_CONSTANTS.AMOUNTS.DEFAULT);
  const [betReason, setBetReason] = useState('');

  // API 훅들
  const createBetMutation = useCreateBet();
  const { data: pointBalance, isLoading: pointsLoading } = useUserPointBalance();

  // 승식 선택
  const handleBetTypeSelect = (betType: string) => {
    setSelectedBetType(betType);
    setSelectedHorses([]); // 마 선택 초기화
  };

  // 마 선택/해제
  const handleHorseSelect = (horseNumber: string) => {
    if (selectedHorses.includes(horseNumber)) {
      setSelectedHorses(selectedHorses.filter((h) => h !== horseNumber));
    } else {
      const maxHorses = getMaxHorsesForBetType(selectedBetType);
      if (selectedHorses.length < maxHorses) {
        setSelectedHorses([...selectedHorses, horseNumber]);
      }
    }
  };

  // 마권 금액 변경
  const handleBetAmountChange = (amount: number) => {
    setBetAmount(amount);
  };

  // 마권 구매
  const handleCreateBet = async () => {
    if (selectedHorses.length === 0) {
      showWarningMessage('마를 선택해주세요');
      return;
    }

    if (betAmount < BETTING_CONSTANTS.AMOUNTS.MIN) {
      showWarningMessage(`최소 마권 금액은 ${BETTING_CONSTANTS.AMOUNTS.MIN}원입니다`);
      return;
    }

    if (pointBalance && betAmount > pointBalance.currentPoints) {
      showErrorMessage('잔액이 부족합니다');
      return;
    }

    try {
      await createBetMutation.mutateAsync({
        raceId,
        betType: selectedBetType as any,
        betName: `${selectedBetType} - ${selectedHorses.join(', ')}번마`,
        betDescription: `${selectedBetType} 베팅`,
        betAmount,
        betReason,
        selections: {
          horses: selectedHorses,
        },
      });

      showSuccessMessage('마권이 성공적으로 등록되었습니다', '🎯 완료');
      onBetPlaced?.();

      // 화면 초기화
      setSelectedHorses([]);
      setBetAmount(BETTING_CONSTANTS.AMOUNTS.DEFAULT);
      setBetReason('');
    } catch (error) {
      console.error('마권 구매 실패:', error);
      showErrorMessage('마권 등록에 실패했습니다');
    }
  };

  // 베팅 타입별 최대 마 수
  const getMaxHorsesForBetType = (betType: string): number => {
    switch (betType) {
      case BETTING_CONSTANTS.TYPES.WIN:
      case BETTING_CONSTANTS.TYPES.PLACE:
        return 1;
      case BETTING_CONSTANTS.TYPES.QUINELLA:
      case BETTING_CONSTANTS.TYPES.EXACTA:
        return 2;
      case BETTING_CONSTANTS.TYPES.TRIFECTA:
        return 3;
      case BETTING_CONSTANTS.TYPES.SUPERFECTA:
        return 4;
      default:
        return 1;
    }
  };

  // 마권 구매 가능 여부 확인
  const canPlaceBet = selectedHorses.length > 0 && betAmount >= BETTING_CONSTANTS.AMOUNTS.MIN;
  const maxHorses = getMaxHorsesForBetType(selectedBetType);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <ThemedText type='largeTitle' style={styles.title}>
          마권 구매
        </ThemedText>
        <ThemedText type='subtitle' style={styles.raceName}>
          {raceName}
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 승식 선택 */}
        <View style={styles.section}>
          <ThemedText type='title' style={styles.sectionTitle}>
            승식 선택
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.betTypeScroll}
          >
            {Object.entries(BETTING_CONSTANTS.TYPES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.betTypeButton,
                  selectedBetType === value && styles.betTypeButtonSelected,
                ]}
                onPress={() => handleBetTypeSelect(value)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.betTypeText,
                    selectedBetType === value && styles.betTypeTextSelected,
                  ]}
                >
                  {BETTING_UTILS.getBetTypeLabel(value)}
                </ThemedText>
                <ThemedText
                  type='caption'
                  style={[
                    styles.betTypeDescription,
                    selectedBetType === value && styles.betTypeTextSelected,
                  ]}
                >
                  {getBetTypeDescription(value)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 마 선택 */}
        <View style={styles.section}>
          <ThemedText type='title' style={styles.sectionTitle}>
            마 선택 ({selectedHorses.length}/{maxHorses})
          </ThemedText>
          <View style={styles.horseGrid}>
            {Array.from({ length: 20 }, (_, i) => {
              const horseNumber = String(i + 1);
              const isSelected = selectedHorses.includes(horseNumber);
              return (
                <TouchableOpacity
                  key={horseNumber}
                  style={[styles.horseButton, isSelected && styles.horseButtonSelected]}
                  onPress={() => handleHorseSelect(horseNumber)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[styles.horseNumber, isSelected && styles.horseNumberSelected]}
                  >
                    {horseNumber}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 마권 금액 */}
        <View style={styles.section}>
          <ThemedText type='title' style={styles.sectionTitle}>
            마권 금액
          </ThemedText>
          <View style={styles.betAmountContainer}>
            <ThemedText type='stat' style={styles.currentAmount}>
              {betAmount.toLocaleString()}원
            </ThemedText>
            <View style={styles.amountButtons}>
              {[1000, 2000, 5000, 10000, 20000, 50000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.amountButton, betAmount === amount && styles.amountButtonSelected]}
                  onPress={() => handleBetAmountChange(amount)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.amountButtonText,
                      betAmount === amount && styles.amountButtonTextSelected,
                    ]}
                  >
                    {amount.toLocaleString()}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 베팅 사유 */}
        <View style={styles.section}>
          <ThemedText type='title' style={styles.sectionTitle}>
            베팅 사유 (선택사항)
          </ThemedText>
          <TextInput
            style={styles.reasonInput}
            value={betReason}
            onChangeText={setBetReason}
            placeholder='베팅 사유를 입력하세요...'
            placeholderTextColor='#999'
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 예상 당첨금 */}
        {selectedHorses.length > 0 && (
          <View style={styles.section}>
            <ThemedText type='title' style={styles.sectionTitle}>
              예상 당첨금
            </ThemedText>
            <View style={styles.summarySection}>
              <ThemedText type='subtitle' style={styles.summaryTitle}>
                예상 당첨 정보
              </ThemedText>
              <View style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  선택한 마:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {selectedHorses.join(', ')}번
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  마권 금액:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {betAmount.toLocaleString()}원
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  예상 당첨금:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {(betAmount * 3.5).toLocaleString()}원
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* 마권 구매 버튼 */}
        <TouchableOpacity
          style={[styles.betButton, !canPlaceBet && styles.betButtonDisabled]}
          onPress={handleCreateBet}
          disabled={!canPlaceBet}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.betButtonText}>마권 구매하기</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// 베팅 타입별 설명
const getBetTypeDescription = (betType: string): string => {
  switch (betType) {
    case BETTING_CONSTANTS.TYPES.WIN:
      return '1등 예상';
    case BETTING_CONSTANTS.TYPES.PLACE:
      return '1-3등 예상';
    case BETTING_CONSTANTS.TYPES.QUINELLA:
      return '1-2등 순서 무관';
    case BETTING_CONSTANTS.TYPES.EXACTA:
      return '1-2등 순서 예상';
    case BETTING_CONSTANTS.TYPES.TRIFECTA:
      return '1-2-3등 순서 예상';
    case BETTING_CONSTANTS.TYPES.SUPERFECTA:
      return '1-2-3-4등 순서 예상';
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    color: '#B48A3C',
  },
  raceName: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#E5C99C',
  },
  betTypeScroll: {
    flexGrow: 0,
  },
  betTypeButton: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
  },
  betTypeButtonSelected: {
    borderColor: '#B48A3C',
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
  },
  betTypeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  betTypeTextSelected: {
    color: '#E5C99C',
  },
  betTypeDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    color: '#FFFFFF',
  },
  horseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
  },
  horseButtonSelected: {
    borderColor: '#B48A3C',
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
  },
  horseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  horseNumberSelected: {
    color: '#E5C99C',
  },
  betAmountContainer: {
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E5C99C',
  },
  amountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  amountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
  },
  amountButtonSelected: {
    borderColor: '#B48A3C',
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
  },
  amountButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  amountButtonTextSelected: {
    color: '#E5C99C',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    textAlignVertical: 'top',
  },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  summaryTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#E5C99C',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5C99C',
  },
  betButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#B48A3C',
  },
  betButtonDisabled: {
    opacity: 0.5,
  },
  betButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
