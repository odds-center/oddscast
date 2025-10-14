import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSubscriptionPlans } from '@/lib/hooks/useSubscriptionPlans';
import { useSinglePurchaseConfig } from '@/lib/hooks/useSinglePurchaseConfig';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

/**
 * 구독 관리 화면
 */
export default function SubscriptionManageScreen() {
  const router = useRouter();
  const { subscription, cancel, isSubscribed, daysUntilRenewal } = useSubscription();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: singleConfig } = useSinglePurchaseConfig();
  const { balance } = usePredictions();

  // 현재 구독 중인 플랜 정보 (DB에서)
  const currentPlan = useMemo(() => {
    if (!subscription || !plans || plans.length === 0) return null;
    // subscription.planId로 찾기 (UUID)
    return plans.find((p) => p.id === subscription.planId) || plans[0];
  }, [subscription, plans]);

  // 계산된 값
  const pricePerTicket = currentPlan
    ? Math.round(currentPlan.totalPrice / currentPlan.totalTickets)
    : 0;
  const SINGLE_PRICE = singleConfig?.totalPrice || 1100; // DB에서 가져온 개별 구매 가격
  const discount = currentPlan
    ? Math.round(
        ((SINGLE_PRICE * currentPlan.totalTickets - currentPlan.totalPrice) /
          (SINGLE_PRICE * currentPlan.totalTickets)) *
          100
      )
    : 0;
  const monthlySavings = currentPlan
    ? SINGLE_PRICE * currentPlan.totalTickets - currentPlan.totalPrice
    : 0;

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

  // 로딩 중
  if (plansLoading) {
    return (
      <PageLayout style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText style={{ marginTop: 16 }}>플랜 정보를 불러오는 중...</ThemedText>
      </PageLayout>
    );
  }

  if (!isSubscribed || !subscription) {
    // 플랜 정보로 동적으로 표시
    const premiumPlan = plans?.find((p) => p.planName === 'PREMIUM');
    const ticketsText = premiumPlan ? `${premiumPlan.totalTickets}장` : '24장';

    return (
      <PageLayout>
        <View style={styles.emptyState}>
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
            프리미엄 구독으로 매월 {ticketsText}의 AI 예측권을 받으세요!
          </ThemedText>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/mypage/subscription/plans')}
          >
            <ThemedText style={styles.subscribeButtonText}>구독하기</ThemedText>
          </TouchableOpacity>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 구독 정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='diamond' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              구독 정보
            </ThemedText>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>플랜</ThemedText>
              <ThemedText style={styles.infoValue}>
                {currentPlan?.displayName || '프리미엄'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>월 구독료</ThemedText>
              <ThemedText style={styles.infoValue}>
                {currentPlan
                  ? Math.floor(currentPlan.totalPrice).toLocaleString('ko-KR')
                  : '19,800'}
                원
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>월 제공 예측권</ThemedText>
              <ThemedText style={styles.infoValue}>
                {currentPlan
                  ? `${currentPlan.totalTickets}장 (${currentPlan.baseTickets}+${currentPlan.bonusTickets})`
                  : '24장 (20+4)'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>장당 가격</ThemedText>
              <ThemedText style={styles.infoValue}>
                {pricePerTicket.toLocaleString('ko-KR')}원
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>상태</ThemedText>
              <ThemedText style={[styles.infoValue, styles.statusActive]}>활성</ThemedText>
            </View>

            {subscription.nextBillingDate && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>다음 결제일</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR')}
                  {daysUntilRenewal !== null && ` (D-${daysUntilRenewal})`}
                </ThemedText>
              </View>
            )}

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>구독 시작일</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(subscription.startedAt).toLocaleDateString('ko-KR')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 예측권 잔액 */}
        {balance && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name='ticket' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='title' style={styles.sectionTitle}>
                예측권 잔액
              </ThemedText>
            </View>

            <View style={styles.card}>
              <View style={styles.ticketStats}>
                <View style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.availableTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>사용 가능</ThemedText>
                </View>
                <View style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.usedTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>사용함</ThemedText>
                </View>
                <View style={styles.ticketStatItem}>
                  <ThemedText style={styles.ticketStatValue}>{balance.totalTickets}</ThemedText>
                  <ThemedText style={styles.ticketStatLabel}>총 발급</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 혜택 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='sparkles' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              구독 혜택
            </ThemedText>
          </View>

          <View style={styles.card}>
            <View style={styles.benefitItem}>
              <Ionicons name='pricetag' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>{discount}% 할인</ThemedText>
                <ThemedText style={styles.benefitText}>
                  개별 구매 대비 월 {Math.floor(monthlySavings).toLocaleString('ko-KR')}원 절약
                </ThemedText>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name='hardware-chip' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>최신 AI 기술</ThemedText>
                <ThemedText style={styles.benefitText}>GPT-4o 또는 Claude 3.5 Sonnet</ThemedText>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name='stats-chart' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>높은 정확도</ThemedText>
                <ThemedText style={styles.benefitText}>평균 70%+ 정확도 목표</ThemedText>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name='sync' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>자동 갱신</ThemedText>
                <ThemedText style={styles.benefitText}>매월 자동으로 예측권 재발급</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* 결제 내역 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='card' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='title' style={styles.sectionTitle}>
              결제 관리
            </ThemedText>
          </View>

          <View style={styles.card}>
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
          </View>
        </View>

        {/* 구독 취소 버튼 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelButtonText}>구독 취소</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.cancelNotice}>
            구독 취소 시 다음 결제일까지 예측권을 계속 사용하실 수 있습니다.
          </ThemedText>
        </View>
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
