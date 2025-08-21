import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useCreateBet } from '@/lib/hooks/useBets';
import { BET_CONSTANTS, BET_TYPES, BetType } from '@/lib/types/bet';
import { showBetErrorMessage, showBetSuccessMessage } from '@/utils/alert';
import { calculatePotentialWin, generateBetDescription, getBetTypeLabel } from '@/utils/betUtils';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
        <View style={styles.header}>
          <ThemedText style={styles.title}>마권 구매</ThemedText>
          <ThemedText style={styles.raceName}>{raceName}</ThemedText>
        </View>

        {/* 승식 선택 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>승식 선택</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.betTypeScroll}
          >
            {BET_TYPES.map((betType) => (
              <TouchableOpacity
                key={betType.value}
                style={[
                  styles.betTypeButton,
                  selectedBetType === betType.value && styles.betTypeButtonSelected,
                ]}
                onPress={() => handleBetTypeSelect(betType.value)}
              >
                <ThemedText
                  style={[
                    styles.betTypeText,
                    selectedBetType === betType.value && styles.betTypeTextSelected,
                  ]}
                >
                  {betType.label}
                </ThemedText>
                <ThemedText style={styles.betTypeDescription}>{betType.description}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 마 선택 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            마 선택 ({selectedHorses.length}/{currentBetTypeInfo?.maxHorses || 1})
          </ThemedText>
          <View style={styles.horseGrid}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((horseNumber) => {
              const horseStr = horseNumber.toString();
              const isSelected = selectedHorses.includes(horseStr);

              return (
                <TouchableOpacity
                  key={horseNumber}
                  style={[styles.horseButton, isSelected && styles.horseButtonSelected]}
                  onPress={() => handleHorseSelect(horseStr)}
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
          <ThemedText style={styles.sectionTitle}>마권 금액</ThemedText>
          <View style={styles.betAmountContainer}>
            <ThemedText style={styles.currentAmount}>
              {betAmount.toLocaleString()} 포인트
            </ThemedText>
            <View style={styles.amountButtons}>
              {BET_CONSTANTS.BET_AMOUNT_STEPS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.amountButton, betAmount === amount && styles.amountButtonSelected]}
                  onPress={() => handleBetAmountChange(amount)}
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

        {/* 마권 정보 요약 */}
        {canPlaceBet && (
          <View style={styles.summarySection}>
            <ThemedText style={styles.summaryTitle}>마권 정보 요약</ThemedText>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>승식:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {getBetTypeLabel(selectedBetType)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>선택한 마:</ThemedText>
              <ThemedText style={styles.summaryValue}>{selectedHorses.join(', ')}번</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>마권 금액:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {betAmount.toLocaleString()} 포인트
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>예상 당첨금:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {calculatePotentialWin(betAmount, 3.5).toLocaleString()} 포인트
              </ThemedText>
            </View>
          </View>
        )}

        {/* 마권 구매 버튼 */}
        <TouchableOpacity
          style={[styles.betButton, !canPlaceBet && styles.betButtonDisabled]}
          onPress={handleCreateBet}
          disabled={!canPlaceBet || createBetMutation.isPending}
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
    backgroundColor: Colors.light.background,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  raceName: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  betTypeScroll: {
    flexGrow: 0,
  },
  betTypeButton: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  betTypeButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '20',
  },
  betTypeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  betTypeTextSelected: {
    color: Colors.light.primary,
  },
  betTypeDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.card,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  horseButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  horseNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  horseNumberSelected: {
    color: Colors.light.white,
  },
  betAmountContainer: {
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.primary,
  },
  amountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  amountButton: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  amountButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountButtonTextSelected: {
    color: Colors.light.white,
  },
  summarySection: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  betButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  betButtonDisabled: {
    backgroundColor: Colors.light.textSecondary,
  },
  betButtonText: {
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
