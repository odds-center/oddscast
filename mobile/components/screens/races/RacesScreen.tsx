import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { Ionicons } from '@expo/vector-icons';
import { RACE_CONSTANTS, RACE_UTILS } from '@/constants/race';

interface Race {
  id: string;
  rcName: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcDist: number;
  rcGrade: string;
  rcStartTime: string;
  raceStatus: string;
}

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  // 임시 데이터 (실제로는 API에서 가져올 예정)
  const mockRaces: Race[] = [
    {
      id: '1',
      rcName: '서울마장주요',
      meetName: '서울',
      rcDate: '2024-02-09',
      rcNo: 1,
      rcDist: 1200,
      rcGrade: 'G3',
      rcStartTime: '14:00',
      raceStatus: 'UPCOMING',
    },
    {
      id: '2',
      rcName: '부산마장주요',
      meetName: '부산',
      rcDate: '2024-02-09',
      rcNo: 2,
      rcDist: 1600,
      rcGrade: 'G2',
      rcStartTime: '14:30',
      raceStatus: 'UPCOMING',
    },
    {
      id: '3',
      rcName: '제주마장주요',
      meetName: '제주',
      rcDate: '2024-02-09',
      rcNo: 3,
      rcDist: 1800,
      rcGrade: 'G1',
      rcStartTime: '15:00',
      raceStatus: 'UPCOMING',
    },
  ];

  // 선택된 지역에 따라 필터링
  const filteredRaces =
    selectedVenue === 'all'
      ? mockRaces
      : mockRaces.filter((race) => race.meetName === selectedVenue);

  const handleRacePress = (raceId: string) => {
    console.log('Race selected:', raceId);
    // 경주 상세 페이지로 이동
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
                  {race.meetName} • {race.rcNo}경주 • {race.rcDist}m
                </ThemedText>
              </View>
              <View style={styles.raceGrade}>
                <ThemedText type='caption' style={styles.gradeText}>
                  {RACE_UTILS.getRaceGradeLabel(race.rcGrade)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.raceFooter}>
              <View style={styles.raceTime}>
                <Ionicons name='time' size={16} color='#E5C99C' />
                <ThemedText type='caption' style={styles.timeText}>
                  {race.rcStartTime}
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
                    {RACE_UTILS.getRaceStatusLabel(race.raceStatus)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name='calendar-outline' size={48} color='#E5C99C' />
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
              {mockRaces.length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 경주
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {mockRaces.filter((race) => race.rcGrade === 'G1').length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              그룹1
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {mockRaces.filter((race) => race.rcGrade === 'G2').length}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              그룹2
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {mockRaces.filter((race) => race.rcGrade === 'G3').length}
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
    color: '#B48A3C',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#B48A3C',
  },
  filterButtonText: {
    color: '#B48A3C',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  raceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
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
    color: '#FFFFFF',
  },
  raceDetails: {
    opacity: 0.8,
    color: '#FFFFFF',
  },
  raceGrade: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
  },
  gradeText: {
    color: '#E5C99C',
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
    color: '#E5C99C',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 40,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#E5C99C',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.8,
    color: '#FFFFFF',
  },
});
