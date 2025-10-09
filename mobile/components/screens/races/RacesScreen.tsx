import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { RACE_UTILS } from '@/constants/race';
import { useRaces } from '@/lib/hooks/useRaces';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

// Race 타입은 lib/types/api.ts에서 import

export default function RacesScreen() {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  // API 데이터 조회
  const { data: racesData, isLoading: racesLoading } = useRaces({
    page: 1,
    limit: 50,
    meet: selectedVenue === 'all' ? undefined : selectedVenue,
  });

  // 선택된 지역에 따라 필터링
  const filteredRaces = racesData?.races || [];

  const handleRacePress = (raceId: string) => {
    console.log('Race selected:', raceId);
    router.push(`/races/${raceId}`);
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
      {racesLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name='refresh' size={48} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='body' style={styles.emptyText}>
            경주 정보를 불러오는 중...
          </ThemedText>
        </View>
      ) : filteredRaces.length > 0 ? (
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

      {/* 경주 통계 */}
      <View style={styles.statsSection}>
        <ThemedText type='title' style={styles.sectionTitle}>
          경주 통계
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {racesLoading ? '...' : filteredRaces.length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 경주
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {racesLoading
                ? '...'
                : filteredRaces.filter((race: any) => race.rcGrade === 'G1').length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              그룹1
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {racesLoading
                ? '...'
                : filteredRaces.filter((race: any) => race.rcGrade === 'G2').length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              그룹2
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {racesLoading
                ? '...'
                : filteredRaces.filter((race: any) => race.rcGrade === 'G3').length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              그룹3
            </ThemedText>
          </View>
        </View>
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
  statsSection: {
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  sectionTitle: {
    marginBottom: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
});
