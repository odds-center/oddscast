import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PageHeader } from '@/components/common';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { showConfirmMessage, showSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * 구독 관리 대시보드
 */
export default function SubscriptionDashboardScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();

  // Mock 구독 정보
  const subscriptionInfo = {
    planName: 'AI 예측권 프리미엄',
    status: isSubscribed ? 'active' : 'inactive',
    startDate: '2024-01-15',
    nextBillingDate: '2024-02-15',
    amount: 19800,
    autoRenewal: true,
    ticketsUsed: 12,
    ticketsRemaining: 18,
  };

  const handleManageSubscription = () => {
    if (!isSubscribed) {
      router.push('/mypage/subscription/plans');
      return;
    }

    showConfirmMessage('구독을 관리하시겠습니까?', '구독 관리', () => {
      // 추가 관리 옵션을 보여주는 로직
    });
  };

  const handlePauseSubscription = () => {
    // TODO: 실제 일시정지 API 호출
    showSuccessMessage('구독이 일시정지되었습니다.', '구독 일시정지');
  };

  const handleCancelSubscription = () => {
    showConfirmMessage(
      '정말로 구독을 취소하시겠습니까?\n남은 기간 동안은 계속 이용하실 수 있습니다.',
      '구독 취소',
      () => {
        // TODO: 실제 취소 API 호출
        showSuccessMessage('구독이 취소되었습니다.', '구독 취소');
      }
    );
  };

  const handleViewHistory = () => {
    router.push('/mypage/subscription/history');
  };

  const handleChangePlan = () => {
    router.push('/mypage/subscription/plans');
  };

  if (!isSubscribed) {
    return (
      <PageLayout style={{ paddingTop: 0 }}>
        <PageHeader title='구독 관리' />
        {/* 구독 없음 상태 */}
        <ThemedView style={styles.emptyState}>
          <Ionicons name='card-outline' size={64} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText type='title' style={styles.emptyTitle}>
            구독이 없습니다
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            AI 예측권 프리미엄 구독을 시작하여\n더 많은 혜택을 누려보세요!
          </ThemedText>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/mypage/subscription/plans')}
          >
            <ThemedText style={styles.subscribeButtonText}>구독 시작하기</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={{ paddingTop: 0 }}>
      <PageHeader title='구독 관리' />
      {/* 구독 상태 카드 */}
      <ThemedView style={styles.statusCard}>
        <ThemedView style={styles.statusHeader}>
          <ThemedView style={styles.statusInfo}>
            <ThemedText type='title' style={styles.planName}>
              {subscriptionInfo.planName}
            </ThemedText>
            <ThemedView style={[styles.statusBadge, styles.activeBadge]}>
              <ThemedText style={styles.statusText}>활성</ThemedText>
            </ThemedView>
          </ThemedView>
          <Ionicons name='checkmark-circle' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        </ThemedView>

        <ThemedView style={styles.statusDetails}>
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>구독 시작일</ThemedText>
            <ThemedText style={styles.detailValue}>
              {new Date(subscriptionInfo.startDate).toLocaleDateString('ko-KR')}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>다음 결제일</ThemedText>
            <ThemedText style={styles.detailValue}>
              {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString('ko-KR')}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>월 결제액</ThemedText>
            <ThemedText style={styles.detailValue}>
              {subscriptionInfo.amount.toLocaleString()}원
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>자동 갱신</ThemedText>
            <ThemedText style={[styles.detailValue, styles.autoRenewal]}>
              {subscriptionInfo.autoRenewal ? '활성' : '비활성'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* 사용량 통계 */}
      <ThemedView style={styles.usageCard}>
        <ThemedView style={styles.usageHeader}>
          <Ionicons name='stats-chart' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='title' style={styles.usageTitle}>
            이번 달 사용량
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.usageStats}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{subscriptionInfo.ticketsUsed}</ThemedText>
            <ThemedText style={styles.statLabel}>사용한 예측권</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{subscriptionInfo.ticketsRemaining}</ThemedText>
            <ThemedText style={styles.statLabel}>남은 예측권</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {Math.round((subscriptionInfo.ticketsUsed / 30) * 100)}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>사용률</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 진행률 바 */}
        <ThemedView style={styles.progressContainer}>
          <ThemedView style={styles.progressBar}>
            <ThemedView
              style={[
                styles.progressFill,
                {
                  width: `${(subscriptionInfo.ticketsUsed / 30) * 100}%`,
                },
              ]}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* 관리 옵션 */}
      <ThemedView style={styles.actionsSection}>
        <ThemedView style={styles.sectionHeader}>
          <Ionicons name='options' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='title' style={styles.sectionTitle}>
            관리 옵션
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
            <Ionicons name='receipt' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.actionButtonText}>결제 내역</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleChangePlan}>
            <Ionicons name='swap-horizontal' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.actionButtonText}>플랜 변경</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleManageSubscription}>
            <Ionicons name='settings' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.actionButtonText}>구독 관리</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* 법적 고지 */}
      <ThemedView style={styles.legalNotice}>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='information-circle' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.legalText}>
            구독 취소 시 남은 기간 동안은 계속 이용하실 수 있습니다.
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='shield-checkmark' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.legalText}>언제든지 구독을 재개하실 수 있습니다.</ThemedText>
        </ThemedView>
      </ThemedView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 28,
  },
  emptyText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 22,
  },
  subscribeButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  statusCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 8,
    lineHeight: 28,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    lineHeight: 18,
  },
  statusDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  detailLabel: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
  },
  autoRenewal: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  usageCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 80,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalNotice: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 12,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minHeight: 24,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 18,
    opacity: 0.7,
  },
});
