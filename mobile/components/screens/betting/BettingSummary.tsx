import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Bet, BetStatus } from '@/lib/types/bet';
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
      <ThemedView style={styles.container}>
        <ThemedText>마권 정보 로딩 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>마권 현황</ThemedText>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{totalBets}</ThemedText>
          <ThemedText style={styles.statLabel}>총 마권</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{totalAmount.toLocaleString()}</ThemedText>
          <ThemedText style={styles.statLabel}>총 마권금</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{totalPayout.toLocaleString()}</ThemedText>
          <ThemedText style={styles.statLabel}>총 상금</ThemedText>
        </View>
      </View>

      {recentBets.length > 0 && (
        <View style={styles.recentBets}>
          <ThemedText style={styles.recentTitle}>최근 마권</ThemedText>
          {recentBets.map((bet) => (
            <View key={bet.id} style={styles.betItem}>
              <ThemedText style={styles.betType}>{bet.betType}</ThemedText>
              <ThemedText style={styles.betAmount}>{bet.betAmount.toLocaleString()}P</ThemedText>
              <ThemedText style={[styles.betStatus, { color: getStatusColor(bet.betStatus) }]}>
                {getStatusText(bet.betStatus)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'WIN':
      return '#4CAF50';
    case 'LOSS':
      return '#F44336';
    case 'PENDING':
      return '#FF9800';
    case 'CANCELLED':
      return '#9E9E9E';
    default:
      return '#2196F3';
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
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  recentBets: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  betType: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  betAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginRight: 16,
  },
  betStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
});
