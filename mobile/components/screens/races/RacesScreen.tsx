import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { RACE_UTILS } from '@/constants/race';
import { useRaces } from '@/lib/hooks/useRaces';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

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

  // API 데이터 조회 (KRA API 복구 시 사용 - 오늘 날짜만)
  const todayDate = getTodayDate();
  const { data: racesData, isLoading: racesLoading } = useRaces({
    page: 1,
    limit: 50,
    date: todayDate,
    meet: selectedVenue === 'all' ? undefined : selectedVenue,
  });

  // Mock 데이터 사용 (API 데이터 없을 때)
  const apiRaces = racesData?.races || [];
  const mockRaces = apiRaces.length > 0 ? apiRaces : MOCK_TODAY_RACES;

  // 선택된 지역에 따라 필터링 (진행중 + 예정만)
  const filteredRaces = (
    selectedVenue === 'all'
      ? mockRaces
      : mockRaces.filter((race: any) => race.meetName === selectedVenue)
  ).filter((race: any) => race.raceStatus !== 'finished');

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
                  {race.rcName}
                </ThemedText>
                <ThemedText type='caption' style={styles.raceDetails}>
                  {race.meetName} • {race.rcNo || ''}경주 • {race.rcDist || ''}m
                </ThemedText>
              </View>
              <View style={styles.raceGrade}>
                <ThemedText type='caption' style={styles.gradeText}>
                  {RACE_UTILS.getRaceGradeLabel(race.rcGrade || '')}
                </ThemedText>
              </View>
            </View>

            <View style={styles.raceFooter}>
              <View style={styles.raceTime}>
                <Ionicons name='time' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText type='caption' style={styles.timeText}>
                  {race.rcStartTime || ''}
                </ThemedText>
              </View>
              <View style={styles.raceStatus}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: RACE_UTILS.getRaceStatusColor(race.raceStatus) },
                  ]}
                >
                  <ThemedText type='caption' style={styles.statusText}>
                    {RACE_UTILS.getRaceStatusLabel(race.raceStatus || '')}
                  </ThemedText>
                </View>
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
    fontSize: 12,
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
    fontSize: 12,
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
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 20,
  },
});
