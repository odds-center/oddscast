import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 디자인 시스템
import { StyledText, Section, SectionHeader, Card, Button } from '@/components/ui';
import { PageLayout } from '@/components/common';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import { POINTS_CONSTANTS, POINTS_UTILS } from '@/constants/points';

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
        `최소 충전 금액은 ${POINTS_CONSTANTS.AMOUNTS.MIN_ADD_AMOUNT.toLocaleString()}포인트입니다.`,
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
        `최소 출금 금액은 ${POINTS_CONSTANTS.AMOUNTS.MIN_WITHDRAW_AMOUNT.toLocaleString()}포인트입니다.`,
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
        return Colors.status.success;
      case 'BET_LOSS':
      case 'WITHDRAW':
        return Colors.status.warning;
      default:
        return Colors.status.info;
    }
  };

  return (
    <PageLayout>
      {/* 포인트 잔액 */}
      <Section>
        <Card variant='elevated' style={styles.balanceContainer}>
          <View style={styles.balanceInfo}>
            <StyledText variant='h4' color={Colors.text.tertiary} style={styles.balanceLabel}>
              현재 포인트
            </StyledText>
            <StyledText variant='h1' color={Colors.primary.main} style={styles.balanceAmount}>
              {userPoints.toLocaleString()} P
            </StyledText>
          </View>
          <View style={styles.balanceActions}>
            <Button
              title='충전'
              icon='add'
              variant='primary'
              onPress={() => setShowAddModal(true)}
            />
            <Button
              title='출금'
              icon='remove'
              variant='secondary'
              onPress={() => setShowWithdrawModal(true)}
            />
          </View>
        </Card>
      </Section>

      {/* 레벨 정보 */}
      <Section>
        <SectionHeader title='포인트 레벨' />
        <Card variant='base'>
          <View style={styles.currentLevel}>
            <View style={styles.levelBadge}>
              <Ionicons
                name={POINTS_UTILS.getLevelIcon(userLevel) as any}
                size={24}
                color={Colors.primary.main}
              />
              <StyledText variant='h3' color={Colors.primary.main}>
                {POINTS_UTILS.getLevelLabel(userLevel)}
              </StyledText>
            </View>
            <StyledText variant='body' style={styles.levelDescription}>
              {POINTS_UTILS.getLevelDescription(userLevel)}
            </StyledText>
          </View>
          <View style={styles.levelProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressToNextLevel}%` }]} />
            </View>
            <StyledText variant='caption' color={Colors.text.tertiary} style={styles.progressText}>
              다음 레벨까지 {nextLevel ? (nextLevel.MIN_POINTS - userPoints).toLocaleString() : 0}P
              남음
            </StyledText>
          </View>
        </Card>
      </Section>

      {/* 통계 */}
      <Section>
        <SectionHeader title='포인트 통계' />
        <View style={styles.statsGrid}>
          <Card variant='base' style={styles.statItem}>
            <StyledText variant='h3' color={Colors.primary.main} style={styles.statNumber}>
              15
            </StyledText>
            <StyledText variant='caption' color={Colors.text.tertiary}>
              총 베팅
            </StyledText>
          </Card>
          <Card variant='base' style={styles.statItem}>
            <StyledText variant='h3' color={Colors.primary.main} style={styles.statNumber}>
              8
            </StyledText>
            <StyledText variant='caption' color={Colors.text.tertiary}>
              당첨
            </StyledText>
          </Card>
          <Card variant='base' style={styles.statItem}>
            <StyledText variant='h3' color={Colors.primary.main} style={styles.statNumber}>
              53%
            </StyledText>
            <StyledText variant='caption' color={Colors.text.tertiary}>
              승률
            </StyledText>
          </Card>
          <Card variant='base' style={styles.statItem}>
            <StyledText variant='h3' color={Colors.primary.main} style={styles.statNumber}>
              250k
            </StyledText>
            <StyledText variant='caption' color={Colors.text.tertiary}>
              총 수익
            </StyledText>
          </Card>
        </View>
      </Section>

      {/* 거래 내역 */}
      <Section>
        <SectionHeader title='거래 내역' action={{ label: '전체', onPress: () => {} }} />
        <View style={styles.transactionsList}>
          {transactions.map((transaction) => (
            <Card key={transaction.id} variant='base' style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={getTransactionIcon(transaction.type) as any}
                  size={24}
                  color={getTransactionColor(transaction.type)}
                />
              </View>
              <View style={styles.transactionInfo}>
                <StyledText variant='body' style={styles.transactionDescription}>
                  {transaction.description}
                </StyledText>
                <StyledText variant='caption' color={Colors.text.tertiary}>
                  {transaction.date} {transaction.time}
                </StyledText>
              </View>
              <View style={styles.transactionAmount}>
                <StyledText
                  variant='body'
                  style={{ color: getTransactionColor(transaction.type), fontWeight: '600' }}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toLocaleString()} P
                </StyledText>
              </View>
            </Card>
          ))}
        </View>
      </Section>

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
              <StyledText variant='h3' color={Colors.primary.main}>
                포인트 충전
              </StyledText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name='close' size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <StyledText variant='body' style={styles.modalLabel}>
                충전할 포인트 금액을 입력하세요
              </StyledText>
              <TextInput
                style={styles.modalInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder='금액 입력'
                placeholderTextColor={Colors.text.tertiary}
                keyboardType='numeric'
              />
              <View style={styles.quickAmounts}>
                {[10000, 30000, 50000, 100000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setAddAmount(amount.toString())}
                  >
                    <StyledText variant='caption' color={Colors.primary.main}>
                      {amount.toLocaleString()}P
                    </StyledText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <Button title='충전하기' onPress={handleAddPoints} />
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
              <StyledText variant='h3' color={Colors.primary.main}>
                포인트 출금
              </StyledText>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name='close' size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <StyledText variant='body' style={styles.modalLabel}>
                출금할 포인트 금액을 입력하세요
              </StyledText>
              <TextInput
                style={styles.modalInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder='금액 입력'
                placeholderTextColor={Colors.text.tertiary}
                keyboardType='numeric'
              />
              <StyledText variant='caption' color={Colors.text.tertiary} style={styles.modalNote}>
                보유 포인트: {userPoints.toLocaleString()}P
              </StyledText>
            </View>
            <View style={styles.modalFooter}>
              <Button title='출금하기' onPress={handleWithdrawPoints} />
            </View>
          </View>
        </View>
      </Modal>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontWeight: 'bold',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  currentLevel: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: `${Colors.primary.main}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary.main}30`,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  levelDescription: {
    textAlign: 'center',
    opacity: 0.8,
  },
  levelProgress: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${Colors.text.primary}10`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: Spacing.md,
  },
  statNumber: {
    marginBottom: Spacing.xs,
  },
  transactionsList: {
    gap: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.text.primary}05`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    marginBottom: Spacing.xxs,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalLabel: {
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    backgroundColor: Colors.background.secondary,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  modalNote: {
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary.main}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary.main}20`,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
});
