import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import {
  Section,
  Card,
  Button,
  StatCard,
  LoadingSpinner,
  EmptyState,
  SectionHeader,
  Divider,
  Badge,
} from '@/components/ui';
import { Colors, Spacing, Layout } from '@/constants/designTokens';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { showSuccessMessage, showErrorMessage, showConfirmMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

/**
 * 구독 관리 화면
 */
export default function SubscriptionManageScreen() {
  const router = useRouter();
  const { subscription, isSubscribed, isLoading, refetch } = useSubscription();
  const { availableTickets, balance } = usePredictions();

  /**
   * 구독 취소
   */
  const handleCancelSubscription = () => {
    showConfirmMessage(
      '구독을 취소하시겠습니까?\n\n남은 예측권은 다음 결제일까지 사용 가능합니다.',
      '구독 취소',
      async () => {
        try {
          await subscriptionsApi.cancel('사용자 요청');
          showSuccessMessage('구독이 취소되었습니다.', '구독 취소 완료');
          refetch();
        } catch (error: any) {
          showErrorMessage(error.response?.data?.message || '구독 취소에 실패했습니다.', '오류');
        }
      },
    );
  };

  if (isLoading) {
    return <LoadingSpinner message='구독 정보를 불러오는 중...' />;
  }

  if (!isSubscribed || !subscription) {
    return (
      <ScrollView style={Layout.container}>
        <Section>
          <EmptyState icon='ticket' title='구독 없음' message='활성화된 구독이 없습니다' />
          <Button
            title='구독 플랜 보기'
            onPress={() => router.push('/mypage/subscription/plans')}
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
        </Section>
      </ScrollView>
    );
  }

  const nextBillingDate = moment(subscription.nextBillingDate).format('YYYY년 MM월 DD일');
  const daysUntilRenewal = subscription.daysUntilRenewal || 0;

  return (
    <ScrollView style={Layout.container}>
      <Section>
        <ThemedText type='title'>구독 관리</ThemedText>
      </Section>

      {/* 구독 상태 카드 */}
      <Section>
        <Card variant='elevated'>
          <View style={styles.statusHeader}>
            <Ionicons name='checkmark-circle' size={32} color={Colors.status.success} />
            <View style={styles.statusInfo}>
              <ThemedText type='subtitle'>{subscription.planId} 구독 중</ThemedText>
              <Badge
                label='활성화'
                variant='success'
                style={{ alignSelf: 'flex-start', marginTop: Spacing.xs }}
              />
            </View>
          </View>

          <Divider spacing={Spacing.lg} />

          <View style={styles.infoRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              다음 결제일
            </ThemedText>
            <ThemedText type='body'>{nextBillingDate}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              남은 기간
            </ThemedText>
            <ThemedText type='body'>{daysUntilRenewal}일</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
              월 결제 금액
            </ThemedText>
            <ThemedText type='body' style={{ color: Colors.text.secondary }}>
              ₩{subscription.price.toLocaleString()}
            </ThemedText>
          </View>
        </Card>
      </Section>

      {/* 예측권 통계 */}
      <Section>
        <SectionHeader title='예측권 현황' />
        <View style={styles.statsGrid}>
          <StatCard
            icon='ticket'
            label='보유 예측권'
            value={availableTickets}
            variant='highlight'
          />
          <StatCard icon='checkmark-done' label='사용한 예측권' value={balance?.usedTickets || 0} />
          <StatCard icon='calendar' label='이번 달 발급' value={subscription.monthlyTickets} />
        </View>
      </Section>

      {/* 결제 정보 */}
      <Section>
        <Card variant='base'>
          <SectionHeader title='💳 결제 수단' />

          <View style={styles.paymentMethod}>
            <Ionicons name='card' size={24} color={Colors.text.primary} />
            <View style={styles.paymentInfo}>
              <ThemedText type='body'>신용/체크카드</ThemedText>
              <ThemedText type='caption' style={{ color: Colors.text.tertiary }}>
                **** **** **** ****
              </ThemedText>
            </View>
          </View>

          <View style={styles.notice}>
            <Ionicons name='information-circle' size={16} color={Colors.text.tertiary} />
            <ThemedText type='caption' style={{ flex: 1 }}>
              자동 갱신: 매월 1일 자동 결제됩니다
            </ThemedText>
          </View>
        </Card>
      </Section>

      {/* 혜택 안내 */}
      <Section>
        <Card variant='base' style={{ backgroundColor: `${Colors.primary.main}05` }}>
          <SectionHeader title='✨ 현재 혜택' />

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color={Colors.status.success} />
            <ThemedText type='body' style={styles.benefitText}>
              월 {subscription.monthlyTickets}장 AI 예측권
            </ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color={Colors.status.success} />
            <ThemedText type='body' style={styles.benefitText}>평균 70%+ 정확도 목표</ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color={Colors.status.success} />
            <ThemedText type='body' style={styles.benefitText}>상세 예측 근거 제공</ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color={Colors.status.success} />
            <ThemedText type='body' style={styles.benefitText}>맞춤 알림 서비스</ThemedText>
          </View>
        </Card>
      </Section>

      {/* 구독 관리 */}
      <Section>
        <Button
          title='결제 내역 보기'
          onPress={() => router.push('/mypage/subscription/history')}
          variant='secondary'
          icon='receipt'
          fullWidth
        />

        <Button
          title='구독 취소'
          onPress={handleCancelSubscription}
          variant='ghost'
          icon='close-circle'
          fullWidth
          style={{ marginTop: Spacing.md }}
          textStyle={{ color: Colors.status.error }}
        />
      </Section>

      {/* 주의사항 */}
      <Section>
        <Card
          variant='compact'
          style={{
            backgroundColor: `${Colors.status.warning}10`,
            borderColor: Colors.status.warning,
          }}
        >
          <ThemedText type='caption' style={{ color: Colors.status.warning }}>
            ⚠️ 구독 취소 시 다음 결제일까지 예측권을 사용할 수 있습니다. 취소 후 환불은
            불가능합니다.
          </ThemedText>
        </Card>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: `${Colors.border.primary}50`,
    borderRadius: Spacing.sm,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  benefitText: {
    flex: 1,
    color: Colors.text.primary,
  },
});
