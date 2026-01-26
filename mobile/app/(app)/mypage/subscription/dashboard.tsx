import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 디자인 시스템
import { ThemedText } from '@/components/ThemedText';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLayout } from '@/components/common/PageLayout';
import { Card, Badge, SectionHeader, Divider } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { showConfirmMessage, showSuccessMessage } from '@/utils/alert';

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
        <View style={styles.emptyState}>
          <Ionicons name='card-outline' size={64} color={Colors.text.primary} />
          <ThemedText type='title' style={styles.emptyTitle}>
            구독이 없습니다
          </ThemedText>
          <ThemedText type='body' style={[styles.emptyText, { color: Colors.text.tertiary }]}>
            AI 예측권 프리미엄 구독을 시작하여{'\n'}더 많은 혜택을 누려보세요!
          </ThemedText>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/mypage/subscription/plans')}
          >
            <ThemedText type='button' style={styles.subscribeButtonText}>구독 시작하기</ThemedText>
          </TouchableOpacity>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={{ paddingTop: 0 }}>
      <PageHeader title='구독 관리' />

      {/* 구독 상태 카드 */}
      <Card variant='elevated' style={styles.card}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <ThemedText type='title' style={styles.planName}>
              {subscriptionInfo.planName}
            </ThemedText>
            <Badge label='활성' variant='success' />
          </View>
          <Ionicons name='checkmark-circle' size={24} color={Colors.status.success} />
        </View>

        <Divider spacing={Spacing.md} />

        <View style={styles.statusDetails}>
          <View style={styles.detailRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>구독 시작일</ThemedText>
            <ThemedText type='body'>
              {new Date(subscriptionInfo.startDate).toLocaleDateString('ko-KR')}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>다음 결제일</ThemedText>
            <ThemedText type='body'>
              {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString('ko-KR')}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>월 결제액</ThemedText>
            <ThemedText type='body'>
              {subscriptionInfo.amount.toLocaleString()}원
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>자동 갱신</ThemedText>
            <ThemedText
              type='body'
              style={{ color: subscriptionInfo.autoRenewal ? Colors.text.secondary : Colors.text.tertiary }}
            >
              {subscriptionInfo.autoRenewal ? '활성' : '비활성'}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* 사용량 통계 */}
      <Card variant='base' style={styles.card}>
        <View style={styles.usageHeader}>
          <Ionicons name='stats-chart' size={20} color={Colors.text.secondary} />
          <ThemedText type='subtitle'>이번 달 사용량</ThemedText>
        </View>

        <View style={styles.usageStats}>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={{ color: Colors.text.secondary }}>
              {subscriptionInfo.ticketsUsed}
            </ThemedText>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              사용한 예측권
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={{ color: Colors.text.secondary }}>
              {subscriptionInfo.ticketsRemaining}
            </ThemedText>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              남은 예측권
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type='stat' style={{ color: Colors.text.secondary }}>
              {Math.round((subscriptionInfo.ticketsUsed / 30) * 100)}%
            </ThemedText>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              사용률
            </ThemedText>
          </View>
        </View>

        {/* 진행률 바 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(subscriptionInfo.ticketsUsed / 30) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </Card>

      {/* 관리 옵션 */}
      <View style={styles.actionsSection}>
        <SectionHeader title='관리 옵션' icon='options' />

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
            <Ionicons name='receipt' size={24} color={Colors.text.secondary} />
            <ThemedText type='caption' style={styles.actionButtonText}>
              결제 내역
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleChangePlan}>
            <Ionicons name='swap-horizontal' size={24} color={Colors.text.secondary} />
            <ThemedText type='caption' style={styles.actionButtonText}>
              플랜 변경
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleManageSubscription}>
            <Ionicons name='settings' size={24} color={Colors.text.secondary} />
            <ThemedText type='caption' style={styles.actionButtonText}>
              구독 관리
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 법적 고지 */}
      <Card variant='compact' style={styles.legalNotice}>
        <View style={styles.legalRow}>
          <Ionicons name='information-circle' size={16} color={Colors.text.tertiary} />
          <ThemedText type='caption' style={[styles.legalText, { color: Colors.text.tertiary }]}>
            구독 취소 시 남은 기간 동안은 계속 이용하실 수 있습니다.
          </ThemedText>
        </View>
        <View style={styles.legalRow}>
          <Ionicons name='shield-checkmark' size={16} color={Colors.text.tertiary} />
          <ThemedText type='caption' style={[styles.legalText, { color: Colors.text.tertiary }]}>
            언제든지 구독을 재개하실 수 있습니다.
          </ThemedText>
        </View>
      </Card>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  subscribeButton: {
    backgroundColor: Colors.primary.dark,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: Colors.background.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  planName: {
    marginBottom: Spacing.xs,
  },
  statusDetails: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${Colors.primary.main}30`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.secondary,
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: Spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.gold,
    minHeight: 80,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  legalNotice: {
    marginBottom: Spacing.xxxl,
    gap: Spacing.md,
    borderColor: Colors.border.primary,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  legalText: {
    flex: 1,
  },
});
