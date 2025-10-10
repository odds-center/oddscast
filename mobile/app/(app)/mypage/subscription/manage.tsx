import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PageLayout } from '@/components/common/PageLayout';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

/**
 * 구독 관리 화면
 */
export default function SubscriptionManageScreen() {
  const router = useRouter();
  const { subscription, cancel, isSubscribed, daysUntilRenewal } = useSubscription();
  const { balance } = usePredictions();

  const handleCancel = () => {
    Alert.alert(
      '구독 취소',
      '정말 구독을 취소하시겠습니까?\n다음 결제일까지는 예측권을 계속 사용하실 수 있습니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예, 취소합니다',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel.mutateAsync('고객 요청');
              Alert.alert('완료', '구독이 취소되었습니다.');
              router.back();
            } catch {
              Alert.alert('오류', '구독 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (!isSubscribed || !subscription) {
    return (
      <PageLayout>
        <ThemedView style={styles.emptyState}>
          <Ionicons
            name='mail-open-outline'
            size={64}
            color={GOLD_THEME.TEXT.PRIMARY}
            style={{ opacity: 0.3 }}
          />
          <ThemedText type='title' style={styles.emptyTitle}>
            활성 구독이 없습니다
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            프리미엄 구독으로 매월 30장의 AI 예측권을 받으세요!
          </ThemedText>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/mypage/subscription/plans')}
          >
            <ThemedText style={styles.subscribeButtonText}>구독하기</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 구독 정보 */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <Ionicons name='diamond' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              구독 정보
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>플랜</ThemedText>
              <ThemedText style={styles.infoValue}>프리미엄</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>월 구독료</ThemedText>
              <ThemedText style={styles.infoValue}>19,800원</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>월 제공 예측권</ThemedText>
              <ThemedText style={styles.infoValue}>30장</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>장당 가격</ThemedText>
              <ThemedText style={styles.infoValue}>660원</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>상태</ThemedText>
              <ThemedText style={[styles.infoValue, styles.statusActive]}>활성</ThemedText>
            </ThemedView>

            {subscription.nextBillingDate && (
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>다음 결제일</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR')}
                  {daysUntilRenewal !== null && ` (D-${daysUntilRenewal})`}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>구독 시작일</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(subscription.startedAt).toLocaleDateString('ko-KR')}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 예측권 잔액 */}
        {balance && (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name='ticket' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='title' style={styles.sectionTitle}>
                예측권 잔액
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.card}>
              <ThemedView style={styles.ticketStats}>
                <ThemedView style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.availableTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>사용 가능</ThemedText>
                </ThemedView>
                <ThemedView style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.usedTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>사용함</ThemedText>
                </ThemedView>
                <ThemedView style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.totalTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>총 발급</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* 혜택 */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <Ionicons name='sparkles' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              구독 혜택
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedView style={styles.benefitItem}>
              <Ionicons name='pricetag' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedView style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>34% 할인</ThemedText>
                <ThemedText style={styles.benefitText}>개별 구매 대비 월 10,200원 절약</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.benefitItem}>
              <Ionicons name='hardware-chip' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedView style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>최신 AI 기술</ThemedText>
                <ThemedText style={styles.benefitText}>GPT-4o 또는 Claude 3.5 Sonnet</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.benefitItem}>
              <Ionicons name='stats-chart' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedView style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>높은 정확도</ThemedText>
                <ThemedText style={styles.benefitText}>평균 70%+ 정확도 목표</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.benefitItem}>
              <Ionicons name='sync' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedView style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>자동 갱신</ThemedText>
                <ThemedText style={styles.benefitText}>매월 자동으로 예측권 재발급</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 결제 내역 */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <Ionicons name='card' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              결제 관리
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/mypage/subscription/history')}
            >
              <Ionicons name='receipt' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.menuText}>결제 내역</ThemedText>
              <Ionicons name='chevron-forward' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/mypage/purchase/single')}
            >
              <Ionicons name='card' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.menuText}>추가 구매 (개별)</ThemedText>
              <Ionicons name='chevron-forward' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* 구독 취소 버튼 */}
        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelButtonText}>구독 취소</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.cancelNotice}>
            구독 취소 시 다음 결제일까지 예측권을 계속 사용하실 수 있습니다.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  card: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  infoLabel: {
    fontSize: 15,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 22,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
  },
  statusActive: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  ticketStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ticketStatItem: {
    alignItems: 'center',
  },
  ticketStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
    lineHeight: 36,
  },
  ticketStatLabel: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 18,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
  },
  benefitText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 20,
  },
  cancelButton: {
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelNotice: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    paddingHorizontal: 32,
    paddingVertical: 16,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 56,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
  },
});
