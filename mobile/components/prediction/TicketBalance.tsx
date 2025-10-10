import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePredictions } from '../../lib/hooks/usePredictions';
import { useRouter } from 'expo-router';

/**
 * 예측권 잔액 컴포넌트
 */
export function TicketBalance() {
  const router = useRouter();
  const { balance, balanceLoading, availableTickets } = usePredictions();

  if (balanceLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎫 예측권</Text>
        <TouchableOpacity
          onPress={() => router.push('/subscription/plans')}
          style={styles.buyButton}
        >
          <Text style={styles.buyButtonText}>충전</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>사용 가능</Text>
        <Text style={styles.balanceValue}>{availableTickets}장</Text>
      </View>

      {balance && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>사용</Text>
            <Text style={styles.statValue}>{balance.usedTickets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>만료</Text>
            <Text style={styles.statValue}>{balance.expiredTickets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>총</Text>
            <Text style={styles.statValue}>{balance.totalTickets}</Text>
          </View>
        </View>
      )}

      {availableTickets === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>예측권이 없습니다</Text>
          <TouchableOpacity
            onPress={() => router.push('/subscription/plans')}
            style={styles.subscribeButton}
          >
            <Text style={styles.subscribeButtonText}>구독하기 (19,800원/월)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/purchase/single')}
            style={styles.singleBuyButton}
          >
            <Text style={styles.singleBuyButtonText}>1장 구매 (1,000원)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#F5F5F7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    color: '#999',
  },
  emptyState: {
    marginTop: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  singleBuyButton: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  singleBuyButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
