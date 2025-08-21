import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePointTransactions, useUserPointBalance } from '@/lib/hooks/usePoints';
import { showPointSuccessMessage } from '@/utils/alert';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PointsScreen() {
  const { data: pointBalance, isLoading: balanceLoading } = useUserPointBalance();
  const { data: transactions, isLoading: transactionsLoading } = usePointTransactions();

  const handleAddPoints = () => {
    showPointSuccessMessage('포인트 추가 기능이 곧 추가될 예정입니다.');
  };

  const handleTransferPoints = () => {
    showPointSuccessMessage('포인트 이체 기능이 곧 추가될 예정입니다.');
  };

  const getTransactionTypeText = (type: string): string => {
    switch (type) {
      case 'EARNED':
        return '획득';
      case 'SPENT':
        return '사용';
      case 'REFUNDED':
        return '환불';
      case 'BONUS':
        return '보너스';
      case 'EXPIRED':
        return '만료';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'EARNED':
      case 'BONUS':
        return '#4CAF50';
      case 'SPENT':
        return '#F44336';
      case 'REFUNDED':
        return '#2196F3';
      case 'EXPIRED':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>포인트</ThemedText>
          <ThemedText style={styles.subtitle}>포인트를 관리하고 사용하세요</ThemedText>
        </View>

        {/* 포인트 잔액 */}
        <ThemedView style={styles.balanceContainer}>
          <ThemedText style={styles.balanceTitle}>현재 포인트</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            {balanceLoading
              ? '로딩 중...'
              : `${pointBalance?.currentPoints?.toLocaleString() || 0}P`}
          </ThemedText>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <ThemedText style={styles.balanceStatLabel}>총 획득</ThemedText>
              <ThemedText style={styles.balanceStatValue}>
                {pointBalance?.totalPointsEarned?.toLocaleString() || 0}P
              </ThemedText>
            </View>
            <View style={styles.balanceStat}>
              <ThemedText style={styles.balanceStatLabel}>총 사용</ThemedText>
              <ThemedText style={styles.balanceStatValue}>
                {pointBalance?.totalPointsSpent?.toLocaleString() || 0}P
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* 포인트 액션 버튼들 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddPoints}>
            <ThemedText style={styles.actionButtonText}>포인트 추가</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleTransferPoints}>
            <ThemedText style={styles.actionButtonText}>포인트 이체</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 포인트 내역 */}
        <ThemedView style={styles.transactionsContainer}>
          <ThemedText style={styles.sectionTitle}>포인트 내역</ThemedText>
          {transactionsLoading ? (
            <ThemedText>로딩 중...</ThemedText>
          ) : transactions?.transactions && transactions.transactions.length > 0 ? (
            transactions.transactions.slice(0, 10).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <ThemedText style={styles.transactionType}>
                    {getTransactionTypeText(transaction.type)}
                  </ThemedText>
                  <ThemedText style={styles.transactionAmount}>
                    {transaction.type === 'SPENT' ? '-' : '+'}
                    {transaction.amount.toLocaleString()}P
                  </ThemedText>
                </View>
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionDescription}>
                    {transaction.description}
                  </ThemedText>
                  <ThemedText style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.transactionBalance}>
                  <ThemedText style={styles.transactionBalanceText}>
                    잔액: {transaction.balanceAfter.toLocaleString()}P
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noTransactionsText}>포인트 내역이 없습니다.</ThemedText>
          )}
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
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  balanceContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionBalance: {
    alignItems: 'flex-end',
  },
  transactionBalanceText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noTransactionsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
