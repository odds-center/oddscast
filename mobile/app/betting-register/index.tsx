import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useRaces } from '@/lib/hooks/useRaces';
import { BetApi } from '@/lib/api/betApi';
import { CreateBetRequest, BetType } from '@/lib/types/bet';
import moment from 'moment';

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
  },
  {
    key: BetType.PLACE,
    label: '복승식',
    description: '1-3등 안에 들어올 말 맞추기',
    icon: 'podium' as const,
  },
  {
    key: BetType.QUINELLA,
    label: '연승식',
    description: '1-2등 2마리 맞추기 (순서무관)',
    icon: 'people' as const,
  },
  {
    key: BetType.QUINELLA_PLACE,
    label: '복연승식',
    description: '1-3등 중 2마리 맞추기 (순서무관)',
    icon: 'people-outline' as const,
  },
  {
    key: BetType.EXACTA,
    label: '쌍승식',
    description: '1-2등 순서대로 맞추기',
    icon: 'swap-vertical' as const,
  },
  {
    key: BetType.TRIFECTA,
    label: '삼복승식',
    description: '1-3등 3마리 맞추기 (순서무관)',
    icon: 'grid' as const,
  },
  {
    key: BetType.TRIPLE,
    label: '삼쌍승식',
    description: '1-3등 순서대로 맞추기',
    icon: 'list' as const,
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
  const [showRaceSelector, setShowRaceSelector] = useState(false);
  const [showBetTypeSelector, setShowBetTypeSelector] = useState(false);

  // 오늘의 경주 데이터 조회
  const { data: racesData, isLoading: racesLoading } = useRaces({
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
    setShowRaceSelector(false);
  };

  const handleBetTypeSelect = (betType: BetType) => {
    setFormData((prev) => ({ ...prev, betType }));
    setShowBetTypeSelector(false);
  };

  const handleHorseInput = (text: string) => {
    // 마번 입력 처리 (예: "3,7,12" 또는 "3 7 12")
    const horses = text.split(/[,\s]+/).filter((h) => h.trim());
    setFormData((prev) => ({ ...prev, horses }));
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.raceId) {
      Alert.alert('오류', '경주를 선택해주세요.');
      return;
    }
    if (formData.horses.length === 0) {
      Alert.alert('오류', '마번을 입력해주세요.');
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
    <PageLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
          </TouchableOpacity>
          <ThemedText type='title' style={styles.title}>
            베팅 기록 등록
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoSection}>
          <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='caption' style={styles.infoText}>
            외부에서 구매한 마권을 기록하고 관리하세요
          </ThemedText>
        </View>

        {/* 경주 선택 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            경주 선택
          </ThemedText>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowRaceSelector(true)}>
            <View style={styles.selectorContent}>
              <Ionicons name='trophy' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.selectorText}>
                {selectedRace ? (
                  <>
                    <ThemedText type='body' style={styles.selectorMainText}>
                      {selectedRace.rcName}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.selectorSubText}>
                      {selectedRace.meetName} • {selectedRace.rcNo}경주 • {selectedRace.rcDist}m
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type='body' style={styles.selectorPlaceholder}>
                    경주를 선택하세요
                  </ThemedText>
                )}
              </View>
              <Ionicons name='chevron-down' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 베팅 타입 선택 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            베팅 타입
          </ThemedText>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowBetTypeSelector(true)}
          >
            <View style={styles.selectorContent}>
              <Ionicons name='list' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.selectorText}>
                <ThemedText type='body' style={styles.selectorMainText}>
                  {getBetTypeLabel(formData.betType)}
                </ThemedText>
                <ThemedText type='caption' style={styles.selectorSubText}>
                  {getBetTypeDescription(formData.betType)}
                </ThemedText>
              </View>
              <Ionicons name='chevron-down' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 마번 입력 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            마번 입력
          </ThemedText>
          <View style={styles.inputContainer}>
            <Ionicons name='paw' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <TextInput
              style={styles.textInput}
              placeholder='마번을 입력하세요 (예: 3,7,12)'
              placeholderTextColor={GOLD_THEME.TEXT.SECONDARY}
              value={formData.horses.join(', ')}
              onChangeText={handleHorseInput}
              keyboardType='numeric'
            />
          </View>
          <ThemedText type='caption' style={styles.inputHelp}>
            여러 마리를 선택할 때는 쉼표(,) 또는 공백으로 구분하세요
          </ThemedText>
        </View>

        {/* 베팅 금액 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            베팅 금액
          </ThemedText>
          <View style={styles.inputContainer}>
            <Ionicons name='cash' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <TextInput
              style={styles.textInput}
              placeholder='베팅 금액을 입력하세요'
              placeholderTextColor={GOLD_THEME.TEXT.SECONDARY}
              value={formData.amount}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: text }))}
              keyboardType='numeric'
            />
            <ThemedText type='body' style={styles.currencyUnit}>
              원
            </ThemedText>
          </View>
        </View>

        {/* 배당률 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            배당률 (선택사항)
          </ThemedText>
          <View style={styles.inputContainer}>
            <Ionicons name='trending-up' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <TextInput
              style={styles.textInput}
              placeholder='배당률을 입력하세요 (예: 3.5)'
              placeholderTextColor={GOLD_THEME.TEXT.SECONDARY}
              value={formData.odds}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, odds: text }))}
              keyboardType='numeric'
            />
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.section}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            메모 (선택사항)
          </ThemedText>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder='추가 메모를 입력하세요'
              placeholderTextColor={GOLD_THEME.TEXT.SECONDARY}
              value={formData.notes}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 등록 버튼 */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <ThemedText type='default' style={styles.submitButtonText}>
            베팅 기록 등록
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* 경주 선택 모달 */}
      {showRaceSelector && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowRaceSelector(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='subtitle' style={styles.modalTitle}>
                경주 선택
              </ThemedText>
              <TouchableOpacity onPress={() => setShowRaceSelector(false)}>
                <Ionicons name='close' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.raceList} showsVerticalScrollIndicator={false}>
              {races.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name='calendar-outline' size={48} color={GOLD_THEME.TEXT.SECONDARY} />
                  <ThemedText type='body' style={styles.emptyStateText}>
                    오늘 진행되는 경주가 없습니다
                  </ThemedText>
                </View>
              ) : (
                races.map((race: any) => (
                  <TouchableOpacity
                    key={race.id}
                    style={styles.raceItem}
                    onPress={() => handleRaceSelect(race)}
                  >
                    <View style={styles.raceInfo}>
                      <ThemedText type='body' style={styles.raceName}>
                        {race.rcName}
                      </ThemedText>
                      <ThemedText type='caption' style={styles.raceDetails}>
                        {race.meetName} • {race.rcNo}경주 • {race.rcDist}m • {race.rcStartTime}
                      </ThemedText>
                    </View>
                    <Ionicons name='chevron-forward' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 베팅 타입 선택 모달 */}
      {showBetTypeSelector && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBetTypeSelector(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='subtitle' style={styles.modalTitle}>
                베팅 타입 선택
              </ThemedText>
              <TouchableOpacity onPress={() => setShowBetTypeSelector(false)}>
                <Ionicons name='close' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.betTypeList} showsVerticalScrollIndicator={false}>
              {BET_TYPES.map((betType) => (
                <TouchableOpacity
                  key={betType.key}
                  style={[
                    styles.betTypeItem,
                    formData.betType === betType.key && styles.betTypeItemSelected,
                  ]}
                  onPress={() => handleBetTypeSelect(betType.key as BetType)}
                >
                  <View style={styles.betTypeIcon}>
                    <Ionicons
                      name={betType.icon}
                      size={24}
                      color={
                        formData.betType === betType.key
                          ? GOLD_THEME.GOLD.LIGHT
                          : GOLD_THEME.TEXT.SECONDARY
                      }
                    />
                  </View>
                  <View style={styles.betTypeInfo}>
                    <ThemedText type='body' style={styles.betTypeLabel}>
                      {betType.label}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.betTypeDescription}>
                      {betType.description}
                    </ThemedText>
                  </View>
                  {formData.betType === betType.key && (
                    <Ionicons name='checkmark-circle' size={24} color={GOLD_THEME.GOLD.LIGHT} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 10,
    fontWeight: '600',
  },
  selectorButton: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    padding: 14,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorText: {
    flex: 1,
  },
  selectorMainText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectorSubText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 2,
  },
  selectorPlaceholder: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    padding: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
  },
  currencyUnit: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '500',
  },
  inputHelp: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 6,
    lineHeight: 16,
  },
  textAreaContainer: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    padding: 14,
  },
  textArea: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: GOLD_THEME.GOLD.LIGHT,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    margin: 16,
    maxHeight: '70%',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  modalTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: 'bold',
  },
  raceList: {
    maxHeight: 400,
  },
  raceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  raceDetails: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 2,
  },
  betTypeList: {
    maxHeight: 400,
  },
  betTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  betTypeItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: GOLD_THEME.GOLD.LIGHT,
  },
  betTypeIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  betTypeInfo: {
    flex: 1,
  },
  betTypeLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  betTypeDescription: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
});
