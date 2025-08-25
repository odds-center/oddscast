import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useCreateBet } from '@/lib/hooks/useBets';
import { BET_CONSTANTS, BET_TYPES, BetType } from '@/lib/types/bet';
import { showBetErrorMessage, showBetSuccessMessage } from '@/utils/alert';
import { calculatePotentialWin, generateBetDescription, getBetTypeLabel } from '@/utils/betUtils';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface BettingScreenProps {
  raceId: string;
  raceName: string;
  onBetPlaced?: () => void;
}

export const BettingScreen: React.FC<BettingScreenProps> = ({ raceId, raceName, onBetPlaced }) => {
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.WIN);
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [betAmount, setBetAmount] = useState(BET_CONSTANTS.DEFAULT_BET_AMOUNT);
  const [betReason, setBetReason] = useState('');

  const createBetMutation = useCreateBet();

  // 승식 선택
  const handleBetTypeSelect = (betType: BetType) => {
    setSelectedBetType(betType);
    setSelectedHorses([]); // 마 선택 초기화
  };

  // 마 선택/해제
  const handleHorseSelect = (horseNumber: string) => {
    if (selectedHorses.includes(horseNumber)) {
      setSelectedHorses(selectedHorses.filter((h) => h !== horseNumber));
    } else {
      const betTypeInfo = BET_TYPES.find((bt) => bt.value === selectedBetType);
      if (betTypeInfo && selectedHorses.length < betTypeInfo.maxHorses) {
        setSelectedHorses([...selectedHorses, horseNumber]);
      }
    }
  };

  // 마권 금액 변경
  const handleBetAmountChange = (amount: number) => {
    setBetAmount(amount as typeof BET_CONSTANTS.DEFAULT_BET_AMOUNT);
  };

  // 마권 구매
  const handleCreateBet = async () => {
    if (selectedHorses.length === 0) {
      showBetErrorMessage('마를 선택해주세요.');
      return;
    }

    if (betAmount < BET_CONSTANTS.MIN_BET_AMOUNT) {
      showBetErrorMessage(`최소 마권 금액은 ${BET_CONSTANTS.MIN_BET_AMOUNT}포인트입니다.`);
      return;
    }

    const betName = generateBetDescription(selectedBetType, {
      horses: selectedHorses,
    });

    try {
      await createBetMutation.mutateAsync({
        raceId,
        betType: selectedBetType,
        betName,
        betAmount,
        selections: { horses: selectedHorses, positions: [] },
        betReason,
      });

      showBetSuccessMessage('마권이 성공적으로 구매되었습니다!');
      onBetPlaced?.();
      // 화면 초기화
      setSelectedHorses([]);
      setBetAmount(BET_CONSTANTS.DEFAULT_BET_AMOUNT);
      setBetReason('');
    } catch (error) {
      showBetErrorMessage('마권 구매에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 마권 구매 가능 여부 확인
  const canPlaceBet = selectedHorses.length > 0 && betAmount >= BET_CONSTANTS.MIN_BET_AMOUNT;

  // 선택된 승식 정보
  const currentBetTypeInfo = BET_TYPES.find((bt) => bt.value === selectedBetType);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <ThemedText type='title' style={styles.title}>
            마권 구매
          </ThemedText>
          <ThemedText type='subtitle' style={styles.raceName}>
            {raceName}
          </ThemedText>
        </ThemedView>

        {/* 승식 선택 */}
        <ThemedView style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            승식 선택
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.betTypeScroll}
          >
            {BET_TYPES.map((betType) => (
              <TouchableOpacity
                key={betType.value}
                style={[
                  styles.betTypeButton,
                  selectedBetType === betType.value && styles.betTypeButtonSelected,
                ]}
                onPress={() => handleBetTypeSelect(betType.value)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.betTypeText,
                    selectedBetType === betType.value && styles.betTypeTextSelected,
                  ]}
                >
                  {betType.label}
                </ThemedText>
                <ThemedText
                  type='caption'
                  style={[
                    styles.betTypeDescription,
                    selectedBetType === betType.value && styles.betTypeTextSelected,
                  ]}
                >
                  {betType.description}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* 마 선택 */}
        <ThemedView style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            마 선택 ({selectedHorses.length}/{currentBetTypeInfo?.maxHorses || 1})
          </ThemedText>
          <ThemedView style={styles.horseGrid}>
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
          </ThemedView>
        </ThemedView>

        {/* 마권 금액 */}
        <ThemedView style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            마권 금액
          </ThemedText>
          <ThemedView style={styles.betAmountContainer}>
            <ThemedText type='stat' style={styles.currentAmount}>
              {betAmount.toLocaleString()} 포인트
            </ThemedText>
            <ThemedView style={styles.amountButtons}>
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
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 예상 당첨금 */}
        {selectedHorses.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type='subtitle' style={styles.sectionTitle}>
              예상 당첨금
            </ThemedText>
            <ThemedView style={styles.summarySection}>
              <ThemedText type='subtitle' style={styles.summaryTitle}>
                예상 당첨 정보
              </ThemedText>
              <ThemedView style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  선택한 마:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {selectedHorses.join(', ')}번
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  마권 금액:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {betAmount.toLocaleString()} 포인트
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.summaryItem}>
                <ThemedText type='caption' style={styles.summaryLabel}>
                  예상 당첨금:
                </ThemedText>
                <ThemedText type='caption' style={styles.summaryValue}>
                  {calculatePotentialWin(betAmount, 3.5).toLocaleString()} 포인트
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* 마권 구매 버튼 */}
        <TouchableOpacity
          style={[styles.betButton, !canPlaceBet && styles.betButtonDisabled]}
          onPress={handleCreateBet}
          disabled={!canPlaceBet || createBetMutation.isPending}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.betButtonText}>
            {createBetMutation.isPending ? '마권 구매 중...' : '마권 구매하기'}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  raceName: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
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
    borderColor: 'transparent',
  },
  betTypeButtonSelected: {
    borderColor: 'transparent',
  },
  betTypeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  betTypeTextSelected: {
    color: 'transparent',
  },
  betTypeDescription: {
    fontSize: 12,
    textAlign: 'center',
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
    borderColor: 'transparent',
  },
  horseButtonSelected: {
    borderColor: 'transparent',
  },
  horseNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  horseNumberSelected: {
    color: 'transparent',
  },
  betAmountContainer: {
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
    borderColor: 'transparent',
  },
  amountButtonSelected: {
    borderColor: 'transparent',
  },
  amountButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountButtonTextSelected: {
    color: 'transparent',
  },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  betButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  betButtonDisabled: {
    opacity: 0.5,
  },
  betButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
