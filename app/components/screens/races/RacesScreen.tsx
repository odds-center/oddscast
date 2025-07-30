import { PageHeader } from '@/components/common';
import { ThemedText as Text } from '@/components/ThemedText';
import { Subtitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { useRaces, useKRARaceRecords, useKRARacePlans } from '@/lib/hooks';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import RaceCard from './RaceCard';

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];
  const { colors, spacing, radii, shadows, fonts } = useAppTheme();

  // TanStack Query 훅 사용 - 실제 API 데이터만 사용
  const {
    data: races = [],
    isLoading,
    error,
  } = useRaces({
    limit: 50,
    offset: 0,
  });

  // KRA API 테스트 훅
  const { refetch: refetchKRARecords } = useKRARaceRecords({
    date: '20240730',
    venue: '1',
    pageNo: 1,
    numOfRows: 10,
  });

  const { refetch: refetchKRAPlans } = useKRARacePlans({
    year: '2024',
    month: '07',
    day: '30',
    venue: '1',
    pageNo: 1,
    numOfRows: 10,
  });

  // KRA API 테스트 함수
  const testKraApi = async () => {
    try {
      console.log('Testing KRA API...');

      // KRA 경주기록 API 테스트
      const recordsResult = await refetchKRARecords();
      console.log('KRA Records:', recordsResult.data);

      // KRA 경주계획표 API 테스트
      const plansResult = await refetchKRAPlans();
      console.log('KRA Plans:', plansResult.data);
    } catch (err: any) {
      console.error('KRA API test failed:', err);
    }
  };

  // 선택된 지역에 따라 필터링
  const filteredRaces =
    selectedVenue === 'all' ? races : races.filter((race: any) => race.venue === selectedVenue);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.m,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.small,
    },
    filterContainer: {
      paddingHorizontal: spacing.l,
      marginBottom: spacing.m,
    },
    filterScroll: {
      paddingRight: spacing.l,
    },
    filterButton: {
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      borderRadius: radii.round,
      backgroundColor: colors.card,
      marginRight: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: '#1A1A1A', // Dark text for better contrast on gold background
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.l,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: spacing.m,
      borderRadius: radii.m,
      marginRight: spacing.s,
      ...shadows.small,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.s,
    },
    racesContainer: {
      flex: 1,
    },
    racesContent: {
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      marginTop: spacing.m,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: spacing.s,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={{ marginTop: spacing.m }}>경주 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name='alert-circle-outline' size={64} color={colors.error} />
        <Text style={{ marginTop: spacing.m, color: colors.error }}>
          오류가 발생했습니다: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title='경주 일정'
        subtitle='오늘의 경마 일정을 확인하세요'
        rightComponent={
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            <TouchableOpacity style={styles.notificationButton} onPress={testKraApi}>
              <Ionicons name='refresh' size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => console.log('Notification button pressed')}
            >
              <Ionicons name='notifications-outline' size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Venue Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue}
              style={[styles.filterButton, selectedVenue === venue && styles.filterButtonActive]}
              onPress={() => setSelectedVenue(venue)}
            >
              <Text
                type='defaultSemiBold'
                style={[styles.filterText, selectedVenue === venue && styles.filterTextActive]}
              >
                {venue === 'all' ? '전체' : venue}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='calendar' size={20} color={colors.primary} />
          </View>
          <View>
            <Text type='defaultSemiBold' style={{ color: colors.text }}>
              {filteredRaces.length}
            </Text>
            <Text type='caption' style={{ color: colors.textSecondary }}>
              오늘의 경주
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trophy' size={20} color={colors.primary} />
          </View>
          <View>
            <Text type='defaultSemiBold' style={{ color: colors.text }}>
              {filteredRaces.filter((race: any) => race.grade === 'G1').length}
            </Text>
            <Text type='caption' style={{ color: colors.textSecondary }}>
              G1 경주
            </Text>
          </View>
        </View>
      </View>

      {/* Races List */}
      <View style={styles.racesContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.racesContent}
        >
          {filteredRaces.length > 0 ? (
            filteredRaces.map((race: any) => <RaceCard key={race.id} race={race} />)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name='calendar-outline' size={64} color={colors.textTertiary} />
              <Text type='title' style={[styles.emptyText, { color: colors.textTertiary }]}>
                경주 정보가 없습니다
              </Text>
              <Text type='caption' style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                선택한 지역에 오늘의 경주가 없습니다
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
