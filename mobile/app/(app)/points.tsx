import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context';
import { usePointTransactions, useUserPointBalance, useAddPoints } from '@/lib/hooks/usePoints';
import { showPointSuccessMessage, showErrorMessage } from '@/utils/alert';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PointsScreen() {
  const { user } = useAuth();
  const {
    data: pointBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useUserPointBalance(user?.id || '');
  const {
    data: transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = usePointTransactions(user?.id || '');
  const addPointsMutation = useAddPoints();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addDescription, setAddDescription] = useState('');

  const handleAddPoints = () => {
    setIsAddModalVisible(true);
  };

  const handleConfirmAddPoints = async () => {
    if (!addAmount || !addDescription) {
      showErrorMessage('오류', '금액과 설명을 입력해주세요.');
      return;
    }

    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount <= 0) {
      showErrorMessage('오류', '올바른 금액을 입력해주세요.');
      return;
    }

    try {
      await addPointsMutation.mutateAsync({
        userId: user?.id!,
        transactionData: {
          amount,
          type: 'EARNED' as any,
          description: addDescription,
        },
      });

      showPointSuccessMessage(`${amount}P가 추가되었습니다.`);
      setIsAddModalVisible(false);
      setAddAmount('');
      setAddDescription('');

      // 데이터 새로고침
      refetchBalance();
      refetchTransactions();
    } catch (error) {
      showErrorMessage('오류', '포인트 추가에 실패했습니다.');
      console.error('Add points error:', error);
    }
  };

  const handleTransferPoints = () => {
    showPointSuccessMessage('포인트 이체 기능이 곧 추가될 예정입니다.');
  };

  const getTransactionTypeText = (type: string): string => {
    switch (type) {
      case 'ADMIN_ADJUSTMENT':
        return '적립';
      case 'BET_PLACED':
        return '사용';
      case 'BET_WON':
        return '당첨';
      case 'BET_LOST':
        return '미당첨';
      case 'EVENT_BONUS':
        return '보너스';
      case 'EXPIRY':
        return '만료';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'ADMIN_ADJUSTMENT':
      case 'BET_WON':
      case 'EVENT_BONUS':
        return '#4CAF50';
      case 'BET_PLACED':
      case 'BET_LOST':
      case 'EXPIRY':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const formatAmount = (amount: number): string => {
    return amount > 0 ? `+${amount}` : `${amount}`;
  };

  if (balanceLoading || transactionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText type='body'>로딩 중...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <ThemedText type='title'>포인트</ThemedText>
          <ThemedText type='subtitle'>포인트 잔액과 내역을 확인하세요</ThemedText>
        </ThemedView>

        {/* 포인트 잔액 */}
        <ThemedView style={styles.balanceContainer}>
          <ThemedText type='subtitle' style={styles.balanceTitle}>
            현재 포인트
          </ThemedText>
          <ThemedText
            type='largeTitle'
            lightColor='#B48A3C'
            darkColor='#E5C99C'
            style={styles.balanceAmount}
          >
            {pointBalance?.currentPoints || 0}P
          </ThemedText>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <ThemedText type='caption' style={styles.balanceStatLabel}>
                총 적립
              </ThemedText>
              <ThemedText type='stat' style={styles.balanceStatValue}>
                {pointBalance?.totalPointsEarned || 0}P
              </ThemedText>
            </View>
            <View style={styles.balanceStat}>
              <ThemedText type='caption' style={styles.balanceStatLabel}>
                총 사용
              </ThemedText>
              <ThemedText type='stat' style={styles.balanceStatValue}>
                {pointBalance?.totalPointsSpent || 0}P
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* 액션 버튼들 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddPoints}>
            <ThemedText type='defaultSemiBold' style={styles.actionButtonText}>
              포인트 추가
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleTransferPoints}>
            <ThemedText type='defaultSemiBold' style={styles.actionButtonText}>
              포인트 이체
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 포인트 내역 */}
        <ThemedView style={styles.transactionsContainer}>
          <ThemedText type='subtitle' style={styles.transactionsTitle}>
            포인트 내역
          </ThemedText>
          {transactions?.transactions && transactions.transactions.length > 0 ? (
            transactions.transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <ThemedText type='defaultSemiBold' style={styles.transactionDescription}>
                    {transaction.description}
                  </ThemedText>
                  <ThemedText type='caption' style={styles.transactionType}>
                    {getTransactionTypeText(transaction.transactionType)}
                  </ThemedText>
                </View>
                <View style={styles.transactionAmount}>
                  <ThemedText
                    type='stat'
                    style={[
                      styles.transactionAmountText,
                      { color: getTransactionTypeColor(transaction.transactionType) },
                    ]}
                  >
                    {formatAmount(transaction.amount)}
                  </ThemedText>
                  <ThemedText type='small' style={styles.transactionTime}>
                    {new Date(transaction.transactionTime).toLocaleDateString('ko-KR')}
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <ThemedText type='body' style={styles.noTransactionsText}>
              포인트 내역이 없습니다.
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>

      {/* 포인트 추가 모달 */}
      <Modal
        visible={isAddModalVisible}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type='title' style={styles.modalTitle}>
              포인트 추가
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText type='defaultSemiBold' style={styles.inputLabel}>
                금액
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder='추가할 포인트 금액'
                keyboardType='numeric'
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type='defaultSemiBold' style={styles.inputLabel}>
                설명
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={addDescription}
                onChangeText={setAddDescription}
                placeholder='포인트 추가 사유'
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddModalVisible(false)}
              >
                <ThemedText type='defaultSemiBold' style={styles.cancelButtonText}>
                  취소
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmAddPoints}
                disabled={addPointsMutation.isPending}
              >
                <ThemedText type='defaultSemiBold' style={styles.confirmButtonText}>
                  {addPointsMutation.isPending ? '추가 중...' : '추가'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  balanceContainer: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceTitle: {
    marginBottom: 8,
    opacity: 0.8,
  },
  balanceAmount: {
    marginBottom: 20,
    textAlign: 'center',
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  balanceStatValue: {
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#B48A3C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  transactionsContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  transactionsTitle: {
    marginBottom: 16,
    opacity: 0.9,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },
  transactionDescription: {
    marginBottom: 4,
  },
  transactionType: {
    opacity: 0.7,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    marginBottom: 4,
  },
  transactionTime: {
    opacity: 0.6,
  },
  noTransactionsText: {
    textAlign: 'center',
    paddingVertical: 40,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#B48A3C',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});
