import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { BETTING_UTILS } from '@/constants/betting';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';
import { useUserBets, useBetStatistics } from '@/lib/hooks/useBets';

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
      {/* 안내 배너 */}
      <View style={styles.infoBanner}>
        <Ionicons name='information-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText style={styles.infoBannerText}>
          외부에서 구매한 마권을 기록하고 관리하세요
        </ThemedText>
      </View>

      {/* 통계 요약 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          마권 기록 통계
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statsLoading ? '...' : betStats.totalBets}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 기록
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statsLoading ? '...' : betStats.wonBets}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              적중
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statsLoading ? '...' : `${betStats.winRate.toFixed(1)}%`}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              승률
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statsLoading ? '...' : betStats.totalWinnings.toLocaleString()}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              수익 (기록)
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.section}>
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
      </View>

      {/* 마권 목록 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          {selectedTab === 'active' ? '대기 중' : '완료된 기록'}
        </ThemedText>
        {betsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='body' style={styles.loadingText}>
              마권 기록을 불러오는 중...
            </ThemedText>
          </View>
        ) : betsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name='alert-circle' size={48} color={GOLD_THEME.STATUS.ERROR} />
            <ThemedText type='body' style={styles.errorText}>
              마권 기록을 불러오는데 실패했습니다.
            </ThemedText>
          </View>
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
          <View style={styles.emptyContainer}>
            <Ionicons name='document-text-outline' size={60} color={GOLD_THEME.TEXT.TERTIARY} />
            <ThemedText type='body' style={styles.emptyText}>
              {selectedTab === 'active'
                ? '대기 중인 마권 기록이 없습니다.'
                : '마권 기록이 없습니다.'}
            </ThemedText>
            <ThemedText type='caption' style={styles.emptySubtext}>
              외부에서 구매한 마권을 등록해보세요
            </ThemedText>
          </View>
        )}
      </View>

      {/* 새 기록 버튼 */}
      <TouchableOpacity
        style={styles.newBetButton}
        onPress={() => router.push('/betting-register')}
      >
        <Ionicons name='add-circle' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
        <ThemedText style={styles.newBetButtonText}>마권 기록 등록</ThemedText>
      </TouchableOpacity>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(180, 138, 60, 0.15)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  infoBannerText: {
    flex: 1,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
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
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 16,
    width: '45%',
  },
  statNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    opacity: 0.5,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
  },
  newBetButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  newBetButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: GOLD_THEME.STATUS.ERROR,
  },
});
