import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { POINTS_CONSTANTS, POINTS_UTILS } from '@/constants/points';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function PointsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // 모의 데이터
  const userPoints = 125000;
  const userLevel = POINTS_UTILS.getUserLevel(userPoints);
  const nextLevel = POINTS_UTILS.getNextLevel(userLevel);
  const progressToNextLevel = POINTS_UTILS.getProgressToNextLevel(userPoints, userLevel);

  // 거래 내역 모의 데이터
  const transactions = [
    {
      id: '1',
      type: 'BET_WIN',
      amount: 50000,
      description: '경마 베팅 당첨',
      date: '2024-02-09',
      time: '15:30',
    },
    {
      id: '2',
      type: 'BET_LOSS',
      amount: -10000,
      description: '경마 베팅',
      date: '2024-02-08',
      time: '14:20',
    },
    {
      id: '3',
      type: 'PURCHASE',
      amount: 100000,
      description: '포인트 충전',
      date: '2024-02-07',
      time: '10:15',
    },
    {
      id: '4',
      type: 'BET_WIN',
      amount: 25000,
      description: '경마 베팅 당첨',
      date: '2024-02-06',
      time: '16:45',
    },
    {
      id: '5',
      type: 'WITHDRAW',
      amount: -30000,
      description: '포인트 출금',
      date: '2024-02-05',
      time: '09:30',
    },
  ];

  // 포인트 충전
  const handleAddPoints = () => {
    const amount = parseInt(addAmount);
    if (amount && amount >= POINTS_CONSTANTS.AMOUNTS.MIN_ADD_AMOUNT) {
      console.log(`${amount.toLocaleString()}포인트가 충전되었습니다.`);
      setAddAmount('');
      setShowAddModal(false);
    } else {
      console.log(
        `최소 충전 금액은 ${POINTS_CONSTANTS.AMOUNTS.MIN_ADD_AMOUNT.toLocaleString()}포인트입니다.`
      );
    }
  };

  // 포인트 출금
  const handleWithdrawPoints = () => {
    const amount = parseInt(withdrawAmount);
    if (amount && amount >= POINTS_CONSTANTS.AMOUNTS.MIN_WITHDRAW_AMOUNT && amount <= userPoints) {
      console.log(`${amount.toLocaleString()}포인트가 출금되었습니다.`);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    } else if (amount > userPoints) {
      console.log('보유 포인트보다 많은 금액을 출금할 수 없습니다.');
    } else {
      console.log(
        `최소 출금 금액은 ${POINTS_CONSTANTS.AMOUNTS.MIN_WITHDRAW_AMOUNT.toLocaleString()}포인트입니다.`
      );
    }
  };

  // 거래 타입별 아이콘
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BET_WIN':
        return 'trophy';
      case 'BET_LOSS':
        return 'close-circle';
      case 'PURCHASE':
        return 'add-circle';
      case 'WITHDRAW':
        return 'remove-circle';
      default:
        return 'card';
    }
  };

  // 거래 타입별 색상
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'BET_WIN':
      case 'PURCHASE':
        return '#FFD700'; // 진한 골드
      case 'BET_LOSS':
      case 'WITHDRAW':
        return '#B8860B'; // 다크골든로드
      default:
        return '#DAA520'; // 골든로드
    }
  };

  return (
    <PageLayout>
      {/* 포인트 잔액 */}
      <View style={styles.section}>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceInfo}>
            <ThemedText type='title' style={styles.balanceLabel}>
              현재 포인트
            </ThemedText>
            <ThemedText type='largeTitle' style={styles.balanceAmount}>
              {userPoints.toLocaleString()} P
            </ThemedText>
          </View>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name='add' size={20} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>충전</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Ionicons name='remove' size={20} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>출금</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 레벨 정보 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          포인트 레벨
        </ThemedText>
        <View style={styles.levelContainer}>
          <View style={styles.currentLevel}>
            <View style={styles.levelBadge}>
              <Ionicons
                name={POINTS_UTILS.getLevelIcon(userLevel) as any}
                size={24}
                color='#E5C99C'
              />
              <ThemedText type='title' style={styles.levelText}>
                {POINTS_UTILS.getLevelLabel(userLevel)}
              </ThemedText>
            </View>
            <ThemedText type='body' style={styles.levelDescription}>
              {POINTS_UTILS.getLevelDescription(userLevel)}
            </ThemedText>
          </View>
          <View style={styles.levelProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressToNextLevel}%` }]} />
            </View>
            <ThemedText type='caption' style={styles.progressText}>
              다음 레벨까지 {nextLevel ? (nextLevel.MIN_POINTS - userPoints).toLocaleString() : 0}P
              남음
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 통계 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          포인트 통계
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              15
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 베팅
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              8
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              당첨
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              53%
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              승률
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={styles.statNumber}>
              250,000
            </ThemedText>
            <ThemedText type='caption' style={styles.statLabel}>
              총 수익
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 거래 내역 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type='title' style={styles.sectionTitle}>
            거래 내역
          </ThemedText>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText type='caption' style={styles.filterButtonText}>
              전체
            </ThemedText>
            <Ionicons name='chevron-down' size={16} color='#E5C99C' />
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={getTransactionIcon(transaction.type)}
                  size={24}
                  color={getTransactionColor(transaction.type)}
                />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText type='body' style={styles.transactionDescription}>
                  {transaction.description}
                </ThemedText>
                <ThemedText type='caption' style={styles.transactionDate}>
                  {transaction.date} {transaction.time}
                </ThemedText>
              </View>
              <View style={styles.transactionAmount}>
                <ThemedText
                  type='body'
                  style={[
                    styles.transactionAmountText,
                    { color: getTransactionColor(transaction.type) },
                  ]}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toLocaleString()} P
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 포인트 충전 모달 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                포인트 충전
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ThemedText type='body' style={styles.modalLabel}>
                충전할 포인트 금액을 입력하세요
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder='금액 입력'
                placeholderTextColor='#999'
                keyboardType='numeric'
              />
              <View style={styles.quickAmounts}>
                {[10000, 30000, 50000, 100000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setAddAmount(amount.toString())}
                  >
                    <ThemedText style={styles.quickAmountText}>
                      {amount.toLocaleString()}P
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddPoints}>
                <ThemedText style={styles.modalButtonText}>충전하기</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 포인트 출금 모달 */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='title' style={styles.modalTitle}>
                포인트 출금
              </ThemedText>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name='close' size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ThemedText type='body' style={styles.modalLabel}>
                출금할 포인트 금액을 입력하세요
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder='금액 입력'
                placeholderTextColor='#999'
                keyboardType='numeric'
              />
              <ThemedText type='caption' style={styles.modalNote}>
                보유 포인트: {userPoints.toLocaleString()}P
              </ThemedText>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={handleWithdrawPoints}>
                <ThemedText style={styles.modalButtonText}>출금하기</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    color: '#B48A3C',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#E5C99C',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    marginBottom: 8,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    color: '#E5C99C',
    fontWeight: 'bold',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#B48A3C',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  levelContainer: {
    gap: 16,
  },
  currentLevel: {
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    gap: 8,
  },
  levelText: {
    color: '#E5C99C',
  },
  levelDescription: {
    marginTop: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  levelProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E5C99C',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#E5C99C',
    marginBottom: 4,
  },
  statLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
    gap: 4,
  },
  filterButtonText: {
    color: '#E5C99C',
    fontSize: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.1)',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#FFFFFF',
    opacity: 0.6,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 138, 60, 0.2)',
  },
  modalTitle: {
    color: '#E5C99C',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    marginBottom: 16,
    color: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalNote: {
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  quickAmountText: {
    color: '#E5C99C',
    fontSize: 12,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(180, 138, 60, 0.2)',
  },
  modalButton: {
    backgroundColor: '#B48A3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
