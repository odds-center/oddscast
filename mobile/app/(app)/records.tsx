import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

// 디자인 시스템
import { ThemedText } from '@/components/ThemedText';
import { Card, Section, Button, LoadingSpinner, EmptyState, ErrorState, InfoBanner, StatCard, SectionHeader, Badge } from '@/components/ui';
import { PageLayout } from '@/components/common';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import { BETTING_UTILS } from '@/constants/betting';
import { useUserBets, useBetStatistics } from '@/lib/hooks/useBets';

export default function BettingScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');

  // API 데이터 조회
  const {
    data: betsData,
    isLoading: betsLoading,
    error: betsError,
  } = useUserBets({
    status: selectedTab === 'active' ? 'PENDING' : 'COMPLETED',
    page: 1,
    limit: 50,
  });

  const { data: statistics, isLoading: statsLoading } = useBetStatistics();

  const bets = betsData?.bets || [];
  const betStats = {
    totalBets: statistics?.totalBets || 0,
    wonBets: statistics?.wonBets || 0,
    winRate: statistics?.winRate || 0,
    totalAmount: statistics?.totalAmount || 0,
    totalWinnings: statistics?.totalWinnings || 0,
  };

  const getBetStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getBetResultColor = (result: string) => {
    switch (result) {
      case 'WIN':
        return Colors.status.success;
      case 'LOSS':
        return Colors.status.error;
      case 'PENDING':
        return Colors.status.warning;
      default:
        return Colors.text.primary;
    }
  };

  return (
    <PageLayout>
      {/* 안내 배너 */}
      <InfoBanner
        type='info'
        message='외부에서 구매한 마권을 기록하고 관리하세요'
        icon='information-circle'
      />

      {/* 통계 요약 */}
      <Section>
        <SectionHeader title='마권 기록 통계' />
        <View style={styles.statsGrid}>
          <StatCard
            icon='document-text'
            label='총 기록'
            value={statsLoading ? '...' : betStats.totalBets}
            variant='default'
            style={styles.statCard}
          />
          <StatCard
            icon='trophy'
            label='적중'
            value={statsLoading ? '...' : betStats.wonBets}
            variant='highlight'
            style={styles.statCard}
          />
          <StatCard
            icon='trending-up'
            label='승률'
            value={statsLoading ? '...' : `${betStats.winRate.toFixed(1)}%`}
            variant='default'
            style={styles.statCard}
          />
          <StatCard
            icon='cash'
            label='수익'
            value={statsLoading ? '...' : betStats.totalWinnings.toLocaleString()}
            subValue='(기록)'
            variant='highlight'
            style={styles.statCard}
          />
        </View>
      </Section>

      {/* 탭 네비게이션 */}
      <Section>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
            onPress={() => setSelectedTab('active')}
          >
            <ThemedText
              type='body'
              style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}
            >
              대기 중
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <ThemedText
              type='body'
              style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}
            >
              완료된 기록
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Section>

      {/* 마권 목록 */}
      <Section>
        <SectionHeader title={selectedTab === 'active' ? '대기 중' : '완료된 기록'} />

        {betsLoading ? (
          <LoadingSpinner message='마권 기록을 불러오는 중...' />
        ) : betsError ? (
          <ErrorState
            error={betsError}
            title='마권 기록을 불러오는데 실패했습니다'
            onRetry={() => window.location.reload()} // Note: window.location might not work in RN, consider refetch
          />
        ) : bets.length > 0 ? (
          bets.map((bet: any) => (
            <Card key={bet.id} variant='base' style={styles.betItem}>
              <View style={styles.betHeader}>
                <ThemedText type='subtitle' style={styles.betRaceName}>
                  {bet.raceName}
                </ThemedText>
                <Badge
                  label={
                    bet.status === 'PENDING'
                      ? '대기중'
                      : bet.status === 'COMPLETED'
                        ? '완료'
                        : '취소'
                  }
                  variant={getBetStatusVariant(bet.status)}
                />
              </View>

              <View style={styles.betDetails}>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
                    마권 타입:
                  </ThemedText>
                  <ThemedText type='body'>
                    {BETTING_UTILS.getBetTypeLabel(bet.betType)}
                  </ThemedText>
                </View>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
                    선택한 마:
                  </ThemedText>
                  <ThemedText type='body'>{bet.selectedHorses.join(', ')}번</ThemedText>
                </View>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
                    구매 금액:
                  </ThemedText>
                  <ThemedText type='body'>{bet.amount.toLocaleString()}원</ThemedText>
                </View>
                {bet.result !== 'PENDING' && (
                  <View style={styles.betDetailRow}>
                    <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
                      결과:
                    </ThemedText>
                    <ThemedText
                      type='body'
                      style={{ color: getBetResultColor(bet.result), fontWeight: 'bold' }}
                    >
                      {bet.result === 'WIN' ? '당첨' : '미당첨'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon='document-text-outline'
            title={
              selectedTab === 'active' ? '대기 중인 마권 기록이 없습니다' : '마권 기록이 없습니다'
            }
            message='외부에서 구매한 마권을 등록해보세요'
            actionText='마권 기록 등록'
            onActionPress={() => router.push('/betting-register')}
          />
        )}
      </Section>

      {/* 새 기록 버튼 */}
      <Button
        title='마권 기록 등록'
        onPress={() => router.push('/betting-register')}
        variant='primary'
        icon='add-circle'
        style={styles.newBetButton}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary.dark,
  },
  tabText: {
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  betItem: {
    marginBottom: Spacing.md,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  betRaceName: {
    flex: 1,
  },
  betDetails: {
    gap: Spacing.sm,
  },
  betDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newBetButton: {
    marginBottom: Spacing.xl,
  },
});
