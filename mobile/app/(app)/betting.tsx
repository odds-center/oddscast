import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { BETTING_UTILS } from '@/constants/betting';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function BettingScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('active');

  // Mock data
  const mockBets = [
    {
      id: '1',
      raceName: '서울마장주요',
      betType: 'WIN',
      selectedHorses: ['3'],
      amount: 10000,
      status: 'PENDING',
      result: 'PENDING',
      createdAt: '2024-02-09T10:00:00Z',
    },
    {
      id: '2',
      raceName: '부산마장주요',
      betType: 'QUINELLA',
      selectedHorses: ['1', '5'],
      amount: 5000,
      status: 'COMPLETED',
      result: 'WIN',
      createdAt: '2024-02-08T15:30:00Z',
    },
  ];

  const statistics = {
    totalBets: 15,
    wonBets: 8,
    winRate: 53.3,
    totalAmount: 150000,
    totalWinnings: 250000,
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
      {/* 통계 요약 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          베팅 통계
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statistics.totalBets}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 베팅
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statistics.wonBets}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              당첨
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statistics.winRate}%
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              승률
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              {statistics.totalWinnings.toLocaleString()}
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 수익
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
              활성 베팅
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              베팅 내역
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 베팅 목록 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          {selectedTab === 'active' ? '활성 베팅' : '베팅 내역'}
        </ThemedText>
        {mockBets.length > 0 ? (
          mockBets.map((bet) => (
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
                    베팅 타입:
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
                    베팅 금액:
                  </ThemedText>
                  <ThemedText type='caption' style={styles.betDetailValue}>
                    {bet.amount.toLocaleString()} 포인트
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
            <ThemedText type='body' style={styles.emptyText}>
              {selectedTab === 'active' ? '활성 베팅이 없습니다.' : '베팅 내역이 없습니다.'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* 새 베팅 버튼 */}
      <TouchableOpacity style={styles.newBetButton} onPress={() => router.push('/betting/new')}>
        <Ionicons name='add' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
        <ThemedText style={styles.newBetButtonText}>새 베팅하기</ThemedText>
      </TouchableOpacity>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
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
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
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
});
