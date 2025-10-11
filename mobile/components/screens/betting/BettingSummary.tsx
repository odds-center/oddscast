import { ThemedText } from '@/components/ThemedText';
import { Bet } from '@/lib/types/bet';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BettingSummaryProps {
  totalBets: number;
  recentBets: Bet[];
  isLoading: boolean;
}

export function BettingSummary({ totalBets, recentBets, isLoading }: BettingSummaryProps) {
  const totalAmount = recentBets.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalPayout = recentBets.reduce((sum, bet) => sum + (bet.actualWin || 0), 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ThemedText>마권 정보 로딩 중...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type='subtitle' style={styles.title}>
        마권 현황
      </ThemedText>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText type='stat' style={styles.statValue}>
            {totalBets}
          </ThemedText>
          <ThemedText type='caption' style={styles.statLabel}>
            총 마권
          </ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText type='stat' style={styles.statValue}>
            {totalAmount.toLocaleString()}
          </ThemedText>
          <ThemedText type='caption' style={styles.statLabel}>
            총 마권금
          </ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText type='stat' style={styles.statValue}>
            {totalPayout.toLocaleString()}
          </ThemedText>
          <ThemedText type='caption' style={styles.statLabel}>
            총 상금
          </ThemedText>
        </View>
      </View>

      {recentBets.length > 0 && (
        <View style={styles.recentBets}>
          <ThemedText type='subtitle' style={styles.recentTitle}>
            최근 마권
          </ThemedText>
          {recentBets.map((bet) => (
            <View key={bet.id} style={styles.betItem}>
              <ThemedText type='default' style={styles.betType}>
                {bet.betType}
              </ThemedText>
              <ThemedText type='default' style={styles.betAmount}>
                {bet.betAmount.toLocaleString()}P
              </ThemedText>
              <ThemedText
                type='caption'
                style={[styles.betStatus, { color: getStatusColor(bet.betStatus) }]}
              >
                {getStatusText(bet.betStatus)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'WIN':
      return '#FFD700'; // 진한 골드
    case 'LOSS':
      return '#B8860B'; // 다크골든로드
    case 'PENDING':
      return '#DAA520'; // 골든로드
    case 'CANCELLED':
      return '#CD853F'; // 페루
    default:
      return '#FFD700'; // 진한 골드
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'WIN':
      return '당첨';
    case 'LOSS':
      return '미당첨';
    case 'PENDING':
      return '대기중';
    case 'CANCELLED':
      return '취소됨';
    case 'ACTIVE':
      return '진행중';
    case 'SETTLED':
      return '정산됨';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  recentBets: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  recentTitle: {
    marginBottom: 12,
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  betType: {
    fontSize: 14,
    flex: 1,
  },
  betAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 16,
  },
  betStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
});
