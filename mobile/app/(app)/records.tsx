import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { BETTING_UTILS } from '@/constants/betting';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';
import { useUserBets, useBetStatistics } from '@/lib/hooks/useBets';
import {
  Card,
  Section,
  Button,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  InfoBanner,
  StatCard,
} from '@/components/ui';

export default function BettingScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('active');

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

  const getBetStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return GOLD_THEME.STATUS.WARNING;
      case 'COMPLETED':
        return GOLD_THEME.STATUS.SUCCESS;
      case 'CANCELLED':
        return GOLD_THEME.STATUS.ERROR;
      default:
        return GOLD_THEME.STATUS.INFO;
    }
  };

  const getBetResultColor = (result: string) => {
    switch (result) {
      case 'WIN':
        return GOLD_THEME.STATUS.SUCCESS;
      case 'LOSS':
        return GOLD_THEME.STATUS.ERROR;
      case 'PENDING':
        return GOLD_THEME.STATUS.WARNING;
      default:
        return GOLD_THEME.STATUS.INFO;
    }
  };

  return (
    <PageLayout>
      {/* 안내 배너 - 신규 컴포넌트 사용 */}
      <InfoBanner
        type='info'
        message='외부에서 구매한 마권을 기록하고 관리하세요'
        icon='information-circle'
      />

      {/* 통계 요약 - 신규 Section & StatCard 사용 */}
      <Section>
        <ThemedText type='title' style={styles.sectionTitle}>
          마권 기록 통계
        </ThemedText>
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

      {/* 탭 네비게이션 - Section 컴포넌트 사용 */}
      <Section>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
            onPress={() => setSelectedTab('active')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              대기 중
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              완료된 기록
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Section>

      {/* 마권 목록 - 신규 컴포넌트 사용 */}
      <Section>
        <ThemedText type='title' style={styles.sectionTitle}>
          {selectedTab === 'active' ? '대기 중' : '완료된 기록'}
        </ThemedText>
        {betsLoading ? (
          <LoadingSpinner message='마권 기록을 불러오는 중...' />
        ) : betsError ? (
          <ErrorState
            error={betsError}
            title='마권 기록을 불러오는데 실패했습니다'
            onRetry={() => window.location.reload()}
          />
        ) : bets.length > 0 ? (
          bets.map((bet: any) => (
            <View key={bet.id} style={styles.betItem}>
              <View style={styles.betHeader}>
                <ThemedText type='subtitle' style={styles.betRaceName}>
                  {bet.raceName}
                </ThemedText>
                <View
                  style={[styles.betStatus, { backgroundColor: getBetStatusColor(bet.status) }]}
                >
                  <ThemedText type='small' style={styles.betStatusText}>
                    {bet.status === 'PENDING'
                      ? '대기중'
                      : bet.status === 'COMPLETED'
                      ? '완료'
                      : '취소'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.betDetails}>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={styles.betDetailLabel}>
                    마권 타입:
                  </ThemedText>
                  <ThemedText type='caption' style={styles.betDetailValue}>
                    {BETTING_UTILS.getBetTypeLabel(bet.betType)}
                  </ThemedText>
                </View>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={styles.betDetailLabel}>
                    선택한 마:
                  </ThemedText>
                  <ThemedText type='caption' style={styles.betDetailValue}>
                    {bet.selectedHorses.join(', ')}번
                  </ThemedText>
                </View>
                <View style={styles.betDetailRow}>
                  <ThemedText type='caption' style={styles.betDetailLabel}>
                    구매 금액:
                  </ThemedText>
                  <ThemedText type='caption' style={styles.betDetailValue}>
                    {bet.amount.toLocaleString()}원
                  </ThemedText>
                </View>
                {bet.result !== 'PENDING' && (
                  <View style={styles.betDetailRow}>
                    <ThemedText type='caption' style={styles.betDetailLabel}>
                      결과:
                    </ThemedText>
                    <ThemedText
                      type='caption'
                      style={[styles.betDetailValue, { color: getBetResultColor(bet.result) }]}
                    >
                      {bet.result === 'WIN' ? '당첨' : '미당첨'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
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

      {/* 새 기록 버튼 - 신규 Button 컴포넌트 사용 */}
      <Button
        title='마권 기록 등록'
        onPress={() => router.push('/betting-register')}
        variant='primary'
        size='large'
        icon='add-circle'
        style={styles.newBetButton}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },
  tabText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  tabTextActive: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },
  betItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betRaceName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },
  betStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  betStatusText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },
  betDetails: {
    gap: 8,
  },
  betDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  betDetailLabel: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  betDetailValue: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
  },
  newBetButton: {
    marginBottom: 20,
  },
});
