import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRaces } from '@/lib/hooks/useRaces';
import { RaceCard } from '@/components/screens/races/RaceCard';
import { BettingSummary } from '@/components/screens/betting/BettingSummary';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useBets } from '@/lib/hooks/useBets';
import { useUnreadNotificationCount } from '@/lib/hooks/useNotifications';

export default function HomeScreen() {
  const router = useRouter();
  const { data: racesData, isLoading: racesLoading, refetch: refetchRaces } = useRaces();
  const { data: betsData, isLoading: betsLoading, refetch: refetchBets } = useBets();
  const { data: notificationCount } = useUnreadNotificationCount();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchRaces(), refetchBets()]);
    setRefreshing(false);
  }, [refetchRaces, refetchBets]);

  const handleRacePress = (raceId: string) => {
    router.push(`/races/${raceId}`);
  };

  const upcomingRaces = racesData?.races?.slice(0, 5) || [];
  const recentBets = betsData?.bets?.slice(0, 3) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 헤더 */}
        <PageHeader
          title='골든레이스'
          subtitle='오늘의 경마를 확인하고 베팅하세요'
          rightComponent={<NotificationBadge count={notificationCount?.count || 0} />}
        />

        {/* 베팅 요약 */}
        <BettingSummary
          totalBets={betsData?.total || 0}
          recentBets={recentBets}
          isLoading={betsLoading}
        />

        {/* 오늘의 경마 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>오늘의 경마</ThemedText>
          {racesLoading ? (
            <ThemedText>로딩 중...</ThemedText>
          ) : upcomingRaces.length > 0 ? (
            upcomingRaces.map((race) => (
              <RaceCard key={race.id} race={race} onPress={() => handleRacePress(race.id)} />
            ))
          ) : (
            <ThemedText>오늘 예정된 경마가 없습니다.</ThemedText>
          )}
        </ThemedView>

        {/* 빠른 베팅 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>빠른 베팅</ThemedText>
          <ThemedText>곧 추가될 예정입니다.</ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});
