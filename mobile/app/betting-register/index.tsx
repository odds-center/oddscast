import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useRaces } from '@/lib/hooks/useRaces';
import { BetApi } from '@/lib/api/betApi';
import { CreateBetRequest, BetType } from '@/lib/types/bet';
import moment from 'moment';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

interface BetFormData {
  raceId: string;
  raceName: string;
  meetName: string;
  betType: BetType;
  horses: string[];
  amount: string;
  odds: string;
  notes: string;
  betDate: string;
}

const BET_TYPES = [
  {
    key: BetType.WIN,
    label: '단승식',
    description: '1등으로 들어올 말 맞추기',
    icon: 'trophy' as const,
    requiredHorses: 1,
    orderMatters: false,
  },
  {
    key: BetType.PLACE,
    label: '복승식',
    description: '1-3등 안에 들어올 말 맞추기',
    icon: 'podium' as const,
    requiredHorses: 1,
    orderMatters: false,
  },
  {
    key: BetType.QUINELLA,
    label: '연승식',
    description: '1-2등 2마리 맞추기 (순서무관)',
    icon: 'people' as const,
    requiredHorses: 2,
    orderMatters: false,
  },
  {
    key: BetType.QUINELLA_PLACE,
    label: '복연승식',
    description: '1-3등 중 2마리 맞추기 (순서무관)',
    icon: 'people-outline' as const,
    requiredHorses: 2,
    orderMatters: false,
  },
  {
    key: BetType.EXACTA,
    label: '쌍승식',
    description: '1-2등 순서대로 맞추기',
    icon: 'swap-vertical' as const,
    requiredHorses: 2,
    orderMatters: true,
  },
  {
    key: BetType.TRIFECTA,
    label: '삼복승식',
    description: '1-3등 3마리 맞추기 (순서무관)',
    icon: 'grid' as const,
    requiredHorses: 3,
    orderMatters: false,
  },
  {
    key: BetType.TRIPLE,
    label: '삼쌍승식',
    description: '1-3등 순서대로 맞추기',
    icon: 'list' as const,
    requiredHorses: 3,
    orderMatters: true,
  },
] as const;

export default function BettingRegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<BetFormData>({
    raceId: '',
    raceName: '',
    meetName: '',
    betType: BetType.WIN,
    horses: [],
    amount: '',
    odds: '',
    notes: '',
    betDate: moment().format('YYYY-MM-DD'),
  });

  const [selectedRace, setSelectedRace] = useState<any>(null);

  // BottomSheet refs
  const raceSheetRef = useRef<BottomSheet>(null);
  const betTypeSheetRef = useRef<BottomSheet>(null);

  // BottomSheet snap points
  const raceSnapPoints = useMemo(() => ['65%', '85%'], []);
  const betTypeSnapPoints = useMemo(() => ['70%', '90%'], []);

  // BottomSheet backdrop
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // 오늘의 경주 데이터 조회
  const { data: racesData } = useRaces({
    page: 1,
    limit: 50,
    date: moment().format('YYYYMMDD'),
  });

  const races = racesData?.races || [];

  const handleRaceSelect = (race: any) => {
    setSelectedRace(race);
    setFormData((prev) => ({
      ...prev,
      raceId: race.id,
      raceName: race.rcName,
      meetName: race.meetName,
    }));
    raceSheetRef.current?.close();
  };

  const handleBetTypeSelect = (betType: BetType) => {
    // 베팅 타입 변경 시 마번 입력 초기화
    setFormData((prev) => ({ ...prev, betType, horses: [] }));
    betTypeSheetRef.current?.close();
  };

  const handleHorseInput = (index: number, value: string) => {
    const newHorses = [...formData.horses];
    newHorses[index] = value.trim();
    setFormData((prev) => ({ ...prev, horses: newHorses.filter((h) => h) }));
  };

  const getRequiredHorsesCount = (betType: BetType) => {
    return BET_TYPES.find((bt) => bt.key === betType)?.requiredHorses || 1;
  };

  const isOrderMatters = (betType: BetType) => {
    return BET_TYPES.find((bt) => bt.key === betType)?.orderMatters || false;
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.raceId) {
      Alert.alert('오류', '경주를 선택해주세요.');
      return;
    }

    const requiredCount = getRequiredHorsesCount(formData.betType);
    if (formData.horses.length !== requiredCount) {
      Alert.alert(
        '오류',
        `${getBetTypeLabel(formData.betType)}는 ${requiredCount}개의 마번이 필요합니다.`
      );
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('오류', '베팅 금액을 입력해주세요.');
      return;
    }

    try {
      // API 호출로 베팅 기록 저장
      const betData: CreateBetRequest = {
        raceId: formData.raceId,
        betType: formData.betType,
        betName: `${formData.raceName} - ${getBetTypeLabel(formData.betType)}`,
        betDescription: `마번: ${formData.horses.join(', ')}`,
        betAmount: parseFloat(formData.amount),
        selections: {
          horses: formData.horses,
        },
      };

      await BetApi.createBet(betData);

      Alert.alert('성공', '베팅 기록이 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('베팅 기록 등록 실패:', error);
      Alert.alert('오류', '베팅 기록 등록에 실패했습니다. 다시 시도해주세요.', [{ text: '확인' }]);
    }
  };

  const getBetTypeLabel = (betType: BetType) => {
    return BET_TYPES.find((bt) => bt.key === betType)?.label || betType;
  };

  const getBetTypeDescription = (betType: BetType) => {
    return BET_TYPES.find((bt) => bt.key === betType)?.description || '';
  };

  return (
    <>
      <PageLayout>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Ionicons name='ticket' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
              <ThemedText type='title' style={styles.title}>
                마권 기록 등록
              </ThemedText>
            </View>
            <ThemedText type='caption' style={styles.subtitle}>
              외부에서 구매한 마권을 기록하고 관리하세요
            </ThemedText>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 필수 정보 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='document-text' size={18} color={GOLD_THEME.GOLD.MEDIUM} />
              <ThemedText style={styles.cardTitle}>필수 정보</ThemedText>
            </View>

            {/* 경주 선택 */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>경주 선택</ThemedText>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => raceSheetRef.current?.snapToIndex(0)}
              >
                <View style={styles.selectorContent}>
                  {selectedRace ? (
                    <View style={styles.selectorText}>
                      <ThemedText style={styles.selectorMainText}>{selectedRace.rcName}</ThemedText>
                      <ThemedText style={styles.selectorSubText}>
                        {selectedRace.meetName} • {selectedRace.rcNo}R • {selectedRace.rcDist}m
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.selectorPlaceholder}>경주를 선택하세요</ThemedText>
                  )}
                  <Ionicons name='chevron-down' size={18} color={GOLD_THEME.TEXT.TERTIARY} />
                </View>
              </TouchableOpacity>
            </View>

            {/* 베팅 타입 선택 */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>베팅 타입</ThemedText>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => betTypeSheetRef.current?.snapToIndex(0)}
              >
                <View style={styles.selectorContent}>
                  <View style={styles.selectorText}>
                    <ThemedText style={styles.selectorMainText}>
                      {getBetTypeLabel(formData.betType)}
                    </ThemedText>
                    <ThemedText style={styles.selectorSubText}>
                      {getBetTypeDescription(formData.betType)}
                    </ThemedText>
                  </View>
                  <Ionicons name='chevron-down' size={18} color={GOLD_THEME.TEXT.TERTIARY} />
                </View>
              </TouchableOpacity>
            </View>

            {/* 마번 입력 */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <ThemedText style={styles.fieldLabel}>마번</ThemedText>
                {isOrderMatters(formData.betType) && (
                  <View style={styles.orderBadge}>
                    <ThemedText style={styles.orderBadgeText}>순서 중요</ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.horseInputsContainer}>
                {Array.from({ length: getRequiredHorsesCount(formData.betType) }).map(
                  (_, index) => (
                    <View key={index} style={styles.horseInputWrapper}>
                      <ThemedText style={styles.horseLabel}>
                        {isOrderMatters(formData.betType) ? `${index + 1}착` : `마 ${index + 1}`}
                      </ThemedText>
                      <TextInput
                        style={styles.horseInput}
                        placeholder='마번 입력'
                        placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
                        value={formData.horses[index] || ''}
                        onChangeText={(text) => handleHorseInput(index, text)}
                        keyboardType='numeric'
                        maxLength={2}
                      />
                    </View>
                  )
                )}
              </View>
            </View>

            {/* 베팅 금액 */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>베팅 금액</ThemedText>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder='금액 입력'
                  placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
                  value={formData.amount}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: text }))}
                  keyboardType='numeric'
                />
                <ThemedText style={styles.currencyUnit}>원</ThemedText>
              </View>
            </View>
          </View>

          {/* 추가 정보 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='add-circle-outline' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.cardTitle}>추가 정보 (선택)</ThemedText>
            </View>

            {/* 배당률 */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>배당률</ThemedText>
              <TextInput
                style={styles.simpleInput}
                placeholder='예: 3.5'
                placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
                value={formData.odds}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, odds: text }))}
                keyboardType='numeric'
              />
            </View>

            {/* 메모 */}
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <ThemedText style={styles.fieldLabel}>메모</ThemedText>
              <TextInput
                style={styles.memoInput}
                placeholder='추가 메모를 입력하세요'
                placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
                value={formData.notes}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical='top'
              />
            </View>
          </View>

          {/* 등록 버튼 */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <Ionicons name='checkmark-circle' size={22} color={GOLD_THEME.TEXT.PRIMARY} />
            <ThemedText style={styles.submitButtonText}>마권 기록 등록</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </PageLayout>

      {/* 경주 선택 BottomSheet */}
      <BottomSheet
        ref={raceSheetRef}
        index={-1}
        snapPoints={raceSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY }}
        handleIndicatorStyle={{ backgroundColor: GOLD_THEME.BORDER.PRIMARY }}
      >
        <View style={styles.sheetHeader}>
          <ThemedText style={styles.sheetTitle}>경주 선택</ThemedText>
          <ThemedText style={styles.sheetSubtitle}>오늘의 경주를 선택하세요</ThemedText>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {races.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name='calendar-outline' size={56} color={GOLD_THEME.TEXT.TERTIARY} />
              <ThemedText style={styles.emptyStateText}>오늘 진행되는 경주가 없습니다</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>다른 날짜를 확인해주세요</ThemedText>
            </View>
          ) : (
            races.map((race: any) => {
              const isSelected = selectedRace?.id === race.id;
              return (
                <TouchableOpacity
                  key={race.id}
                  style={[styles.raceCard, isSelected && styles.raceCardSelected]}
                  onPress={() => handleRaceSelect(race)}
                  activeOpacity={0.7}
                >
                  <View style={styles.raceCardHeader}>
                    <View style={styles.raceCardBadge}>
                      <Ionicons name='trophy' size={16} color={GOLD_THEME.GOLD.DARK} />
                      <ThemedText style={styles.raceCardBadgeText}>{race.rcNo}R</ThemedText>
                    </View>
                    <View style={styles.raceCardRight}>
                      <View style={styles.raceCardMeet}>
                        <ThemedText style={styles.raceCardMeetText}>{race.meetName}</ThemedText>
                      </View>
                      {isSelected && (
                        <Ionicons name='checkmark-circle' size={22} color={GOLD_THEME.GOLD.LIGHT} />
                      )}
                    </View>
                  </View>
                  <ThemedText
                    style={[styles.raceCardName, isSelected && styles.raceCardNameSelected]}
                  >
                    {race.rcName}
                  </ThemedText>
                  <View style={styles.raceCardFooter}>
                    <View style={styles.raceCardInfo}>
                      <Ionicons
                        name='speedometer'
                        size={14}
                        color={isSelected ? GOLD_THEME.GOLD.MEDIUM : GOLD_THEME.TEXT.TERTIARY}
                      />
                      <ThemedText
                        style={[
                          styles.raceCardInfoText,
                          isSelected && styles.raceCardInfoTextSelected,
                        ]}
                      >
                        {race.rcDist}m
                      </ThemedText>
                    </View>
                    <View style={styles.raceCardInfo}>
                      <Ionicons
                        name='time'
                        size={14}
                        color={isSelected ? GOLD_THEME.GOLD.MEDIUM : GOLD_THEME.TEXT.TERTIARY}
                      />
                      <ThemedText
                        style={[
                          styles.raceCardInfoText,
                          isSelected && styles.raceCardInfoTextSelected,
                        ]}
                      >
                        {race.rcStartTime}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* 베팅 타입 선택 BottomSheet */}
      <BottomSheet
        ref={betTypeSheetRef}
        index={-1}
        snapPoints={betTypeSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY }}
        handleIndicatorStyle={{ backgroundColor: GOLD_THEME.BORDER.PRIMARY }}
      >
        <View style={styles.sheetHeader}>
          <ThemedText style={styles.sheetTitle}>베팅 타입 선택</ThemedText>
          <ThemedText style={styles.sheetSubtitle}>원하는 베팅 방식을 선택하세요</ThemedText>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {BET_TYPES.map((betType) => {
            const isSelected = formData.betType === betType.key;
            return (
              <TouchableOpacity
                key={betType.key}
                style={[styles.betTypeCard, isSelected && styles.betTypeCardSelected]}
                onPress={() => handleBetTypeSelect(betType.key as BetType)}
                activeOpacity={0.7}
              >
                <View style={styles.betTypeCardContent}>
                  <View
                    style={[
                      styles.betTypeIconCircle,
                      isSelected && styles.betTypeIconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={betType.icon}
                      size={24}
                      color={isSelected ? GOLD_THEME.GOLD.LIGHT : GOLD_THEME.TEXT.SECONDARY}
                    />
                  </View>
                  <View style={styles.betTypeCardInfo}>
                    <View style={styles.betTypeCardHeader}>
                      <ThemedText
                        style={[
                          styles.betTypeCardLabel,
                          isSelected && styles.betTypeCardLabelSelected,
                        ]}
                      >
                        {betType.label}
                      </ThemedText>
                      {isSelected && (
                        <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.GOLD.LIGHT} />
                      )}
                    </View>
                    <ThemedText style={styles.betTypeCardDescription}>
                      {betType.description}
                    </ThemedText>
                    <View style={styles.betTypeCardFooter}>
                      <View style={styles.betTypeCardTag}>
                        <ThemedText style={styles.betTypeCardTagText}>
                          {betType.requiredHorses}마리
                        </ThemedText>
                      </View>
                      {betType.orderMatters && (
                        <View style={[styles.betTypeCardTag, styles.betTypeCardTagOrder]}>
                          <ThemedText
                            style={[styles.betTypeCardTagText, styles.betTypeCardTagOrderText]}
                          >
                            순서 중요
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  subtitle: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
  },
  cardTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  orderBadgeText: {
    color: GOLD_THEME.GOLD.DARK,
    fontSize: 11,
    fontWeight: '700',
  },
  selectorButton: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    marginRight: 8,
  },
  selectorMainText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    fontWeight: '600',
  },
  selectorSubText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 13,
    marginTop: 2,
  },
  selectorPlaceholder: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 15,
  },
  horseInputsContainer: {
    gap: 10,
  },
  horseInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  horseLabel: {
    minWidth: 40,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  horseInput: {
    flex: 1,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  amountInput: {
    flex: 1,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  },
  currencyUnit: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  simpleInput: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
  },
  memoInput: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    padding: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    minHeight: 90,
  },
  submitButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  },
  // BottomSheet 스타일
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // 경주 카드 스타일
  raceCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    padding: 16,
    marginBottom: 12,
  },
  raceCardSelected: {
    borderColor: GOLD_THEME.GOLD.MEDIUM,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  raceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  raceCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  raceCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  raceCardBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD_THEME.GOLD.DARK,
  },
  raceCardMeet: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 6,
  },
  raceCardMeetText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  raceCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
    marginBottom: 10,
  },
  raceCardNameSelected: {
    color: GOLD_THEME.GOLD.LIGHT,
  },
  raceCardFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  raceCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceCardInfoText: {
    fontSize: 13,
    color: GOLD_THEME.TEXT.TERTIARY,
    fontWeight: '500',
  },
  raceCardInfoTextSelected: {
    color: GOLD_THEME.GOLD.MEDIUM,
  },
  // 베팅 타입 카드 스타일
  betTypeCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
    marginBottom: 10,
    overflow: 'hidden',
  },
  betTypeCardSelected: {
    borderColor: GOLD_THEME.GOLD.MEDIUM,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  betTypeCardContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  betTypeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  betTypeIconCircleSelected: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
  betTypeCardInfo: {
    flex: 1,
  },
  betTypeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  betTypeCardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  betTypeCardLabelSelected: {
    color: GOLD_THEME.GOLD.LIGHT,
  },
  betTypeCardDescription: {
    fontSize: 13,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 18,
    marginBottom: 8,
  },
  betTypeCardFooter: {
    flexDirection: 'row',
    gap: 6,
  },
  betTypeCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  betTypeCardTagOrder: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  betTypeCardTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  betTypeCardTagOrderText: {
    color: GOLD_THEME.GOLD.DARK,
  },
  // 공통 스타일
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.TERTIARY,
    marginTop: 8,
    textAlign: 'center',
  },
});
