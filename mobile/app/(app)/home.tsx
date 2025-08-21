import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRaces } from '@/lib/hooks/useRaces';
import { RaceCard } from '@/components/screens/races/RaceCard';
import { BettingSummary } from '@/components/screens/betting/BettingSummary';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { PageLayout, Section, Button } from '@/components/common';
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
    <PageLayout
      title='골든레이스'
      subtitle='오늘의 경마를 확인하고 베팅하세요'
      rightComponent={<NotificationBadge count={notificationCount?.count || 0} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* 베팅 요약 */}
      <Section title='베팅 현황' variant='elevated'>
        <BettingSummary
          totalBets={betsData?.total || 0}
          recentBets={recentBets}
          isLoading={betsLoading}
        />
      </Section>

      {/* 오늘의 경주 */}
      <Section title='오늘의 경주' variant='elevated'>
        {racesLoading ? (
          <View style={styles.loadingContainer}>
            <ThemedText type='body'>경주 정보를 불러오는 중...</ThemedText>
          </View>
        ) : upcomingRaces.length > 0 ? (
          upcomingRaces.map((race) => (
            <RaceCard key={race.id} race={race} onPress={() => handleRacePress(race.id)} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.emptyText}>
              오늘 예정된 경주가 없습니다.
            </ThemedText>
          </View>
        )}
      </Section>

      {/* 빠른 액션 */}
      <Section title='빠른 액션' variant='outlined'>
        <View style={styles.actionButtons}>
          <Button
            title='베팅하기'
            onPress={() => router.push('/betting')}
            variant='primary'
            size='large'
            fullWidth
          />
          <Button
            title='경주 보기'
            onPress={() => router.push('/races')}
            variant='outline'
            size='large'
            fullWidth
          />
        </View>
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
  },
});
