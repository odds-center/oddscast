import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { RACE_UTILS } from '@/constants/race';
import { useRaces } from '@/lib/hooks/useRaces';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';
import { RACES } from '@/constants/mockData';

// Mock 데이터 - 오늘의 경주 (진행중 + 예정)
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const MOCK_TODAY_RACES = [
  {
    id: '1',
    rcName: '코리안 더비',
    meetName: '서울',
    rcNo: '11',
    rcDist: '1800',
    rcGrade: 'G1',
    rcStartTime: '15:30',
    raceStatus: 'scheduled',
    rcDate: getTodayDate(),
  },
  {
    id: '2',
    rcName: '대통령배',
    meetName: '서울',
    rcNo: '10',
    rcDist: '2000',
    rcGrade: 'G1',
    rcStartTime: '15:00',
    raceStatus: 'scheduled',
    rcDate: getTodayDate(),
  },
  {
    id: '3',
    rcName: '부산배',
    meetName: '부산',
    rcNo: '9',
    rcDist: '1400',
    rcGrade: 'G2',
    rcStartTime: '14:30',
    raceStatus: 'in_progress',
    rcDate: getTodayDate(),
  },
  {
    id: '4',
    rcName: '제주 스프린트',
    meetName: '제주',
    rcNo: '8',
    rcDist: '1000',
    rcGrade: 'G3',
    rcStartTime: '14:00',
    raceStatus: 'scheduled',
    rcDate: getTodayDate(),
  },
  {
    id: '5',
    rcName: '서울 클래식',
    meetName: '서울',
    rcNo: '7',
    rcDist: '1600',
    rcGrade: 'G2',
    rcStartTime: '13:30',
    raceStatus: 'in_progress',
    rcDate: getTodayDate(),
  },
];

export default function RacesScreen() {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  // Mock 데이터 사용
  const mockRaces = RACES;

  // 선택된 지역에 따라 필터링
  const filteredRaces =
    selectedVenue === 'all' ? mockRaces : mockRaces.filter((race) => race.venue === selectedVenue);

  const handleRacePress = (raceId: string) => {
    console.log('Race selected:', raceId);
    router.push(`/race-detail/${raceId}`);
  };

  return (
    <PageLayout>
      {/* 지역 필터 */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue}
              style={[styles.filterButton, selectedVenue === venue && styles.filterButtonActive]}
              onPress={() => setSelectedVenue(venue)}
            >
              <ThemedText
                type='defaultSemiBold'
                style={[
                  styles.filterButtonText,
                  selectedVenue === venue && styles.filterButtonTextActive,
                ]}
              >
                {venue === 'all' ? '전체' : venue}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 경주 목록 */}
      {filteredRaces.length > 0 ? (
        filteredRaces.map((race) => (
          <TouchableOpacity
            key={race.id}
            style={styles.raceCard}
            onPress={() => handleRacePress(race.id)}
            activeOpacity={0.7}
          >
            <View style={styles.raceHeader}>
              <View style={styles.raceInfo}>
                <ThemedText type='title' style={styles.raceName}>
                  {race.raceName}
                </ThemedText>
                <ThemedText type='caption' style={styles.raceDetails}>
                  {race.venue} • {race.raceNumber}경주 • {race.distance}m
                </ThemedText>
              </View>
              <View style={styles.raceGrade}>
                <ThemedText type='caption' style={styles.gradeText}>
                  {race.grade}
                </ThemedText>
              </View>
            </View>

            {/* 트랙 컨디션 */}
            <View style={styles.trackConditionRow}>
              <View style={styles.conditionItem}>
                <Ionicons
                  name={
                    race.trackCondition.weather === 'sunny'
                      ? 'sunny'
                      : race.trackCondition.weather === 'cloudy'
                      ? 'cloudy'
                      : race.trackCondition.weather === 'rainy'
                      ? 'rainy'
                      : 'cloud'
                  }
                  size={16}
                  color={GOLD_THEME.TEXT.SECONDARY}
                />
                <ThemedText type='caption' style={styles.conditionText}>
                  {race.trackCondition.temperature}°C
                </ThemedText>
              </View>
              <View style={styles.conditionItem}>
                <Ionicons name='water' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText type='caption' style={styles.conditionText}>
                  습도 {race.trackCondition.humidity}%
                </ThemedText>
              </View>
              <View style={styles.conditionItem}>
                <Ionicons name='speedometer' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText type='caption' style={styles.conditionText}>
                  {race.trackCondition.surface === 'fast'
                    ? '빠름'
                    : race.trackCondition.surface === 'good'
                    ? '양호'
                    : race.trackCondition.surface === 'soft'
                    ? '습함'
                    : '무거움'}
                </ThemedText>
              </View>
            </View>

            {/* AI 예측 */}
            <View style={styles.aiAnalysisSection}>
              <View style={styles.aiHeader}>
                <Ionicons name='analytics' size={18} color={GOLD_THEME.GOLD.LIGHT} />
                <ThemedText type='defaultSemiBold' style={styles.aiTitle}>
                  AI 예측
                </ThemedText>
                <View style={styles.confidenceBadge}>
                  <ThemedText type='caption' style={styles.confidenceText}>
                    신뢰도 {race.aiAnalysis.confidence}%
                  </ThemedText>
                </View>
              </View>
              <ThemedText type='caption' style={styles.aiRecommendation}>
                {race.aiAnalysis.recommendation}
              </ThemedText>
            </View>

            <View style={styles.raceFooter}>
              <View style={styles.raceTime}>
                <Ionicons name='time' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText type='caption' style={styles.timeText}>
                  {race.date.split(' ')[1] || ''}
                </ThemedText>
              </View>
              <View style={styles.prizeInfo}>
                <Ionicons name='trophy' size={16} color={GOLD_THEME.GOLD.LIGHT} />
                <ThemedText type='caption' style={styles.prizeText}>
                  {(race.prize / 10000).toLocaleString()}만원
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name='calendar-outline' size={48} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='body' style={styles.emptyText}>
            {selectedVenue === 'all'
              ? '등록된 경주가 없습니다.'
              : `${selectedVenue}에 등록된 경주가 없습니다.`}
          </ThemedText>
        </View>
      )}

      {/* 오늘의 경주 안내 */}
      <View style={styles.infoSection}>
        <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText type='caption' style={styles.infoText}>
          오늘 진행되는 경주만 표시됩니다. 과거 기록은 &quot;결과&quot; 탭에서 확인하세요.
        </ThemedText>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScrollContent: {
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  filterButtonActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },
  filterButtonText: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  filterButtonTextActive: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  raceCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    marginBottom: 4,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  raceDetails: {
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  raceGrade: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  gradeText: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  raceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raceTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  raceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.6,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 20,
  },
  trackConditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginVertical: 6,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  conditionText: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  aiAnalysisSection: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GOLD_THEME.GOLD.LIGHT,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiTitle: {
    color: GOLD_THEME.GOLD.LIGHT,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },
  aiRecommendation: {
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 18,
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prizeText: {
    color: GOLD_THEME.GOLD.LIGHT,
    fontWeight: '600',
  },
});
