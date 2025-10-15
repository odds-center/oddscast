import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Section, Card, Button, StatCard, LoadingSpinner, EmptyState } from '@/components/ui';
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
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner message='구독 정보를 불러오는 중...' />;
  }

  if (!isSubscribed || !subscription) {
    return (
      <ScrollView style={styles.container}>
        <Section>
          <EmptyState icon='ticket' title='구독 없음' message='활성화된 구독이 없습니다' />
          <Button
            title='구독 플랜 보기'
            onPress={() => router.push('/mypage/subscription/plans')}
          />
        </Section>
      </ScrollView>
    );
  }

  const nextBillingDate = moment(subscription.nextBillingDate).format('YYYY년 MM월 DD일');
  const daysUntilRenewal = subscription.daysUntilRenewal || 0;

  return (
    <ScrollView style={styles.container}>
      <Section>
        <ThemedText type='title'>구독 관리</ThemedText>
      </Section>

      {/* 구독 상태 카드 */}
      <Section>
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name='checkmark-circle' size={32} color='#4CAF50' />
            <View style={styles.statusInfo}>
              <ThemedText type='subtitle'>{subscription.planId} 구독 중</ThemedText>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.statusBadgeText}>활성화</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <ThemedText type='caption'>다음 결제일</ThemedText>
            <ThemedText type='defaultSemiBold'>{nextBillingDate}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText type='caption'>남은 기간</ThemedText>
            <ThemedText type='defaultSemiBold'>{daysUntilRenewal}일</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText type='caption'>월 결제 금액</ThemedText>
            <ThemedText type='defaultSemiBold' style={styles.price}>
              ₩{subscription.price.toLocaleString()}
            </ThemedText>
          </View>
        </Card>
      </Section>

      {/* 예측권 통계 */}
      <Section>
        <ThemedText type='subtitle' style={styles.sectionTitle}>
          예측권 현황
        </ThemedText>
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
        <Card>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            💳 결제 수단
          </ThemedText>

          <View style={styles.paymentMethod}>
            <Ionicons name='card' size={24} color='#333' />
            <View style={styles.paymentInfo}>
              <ThemedText type='defaultSemiBold'>신용/체크카드</ThemedText>
              <ThemedText type='caption'>**** **** **** ****</ThemedText>
            </View>
          </View>

          <View style={styles.notice}>
            <Ionicons name='information-circle' size={16} color='#666' />
            <ThemedText type='caption' style={styles.noticeText}>
              자동 갱신: 매월 1일 자동 결제됩니다
            </ThemedText>
          </View>
        </Card>
      </Section>

      {/* 혜택 안내 */}
      <Section>
        <Card style={styles.benefitsCard}>
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            ✨ 현재 혜택
          </ThemedText>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            <ThemedText style={styles.benefitText}>
              월 {subscription.monthlyTickets}장 AI 예측권
            </ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            <ThemedText style={styles.benefitText}>평균 70%+ 정확도 목표</ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            <ThemedText style={styles.benefitText}>상세 예측 근거 제공</ThemedText>
          </View>

          <View style={styles.benefit}>
            <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            <ThemedText style={styles.benefitText}>맞춤 알림 서비스</ThemedText>
          </View>
        </Card>
      </Section>

      {/* 구독 관리 */}
      <Section>
        <Button
          title='결제 내역 보기'
          onPress={() => router.push('/mypage/subscription/history')}
          variant='outline'
          size='medium'
          icon='receipt'
        />

        <Button
          title='구독 취소'
          onPress={handleCancelSubscription}
          variant='danger'
          size='medium'
          icon='close-circle'
          style={{ marginTop: 12 }}
        />
      </Section>

      {/* 주의사항 */}
      <Section>
        <Card style={styles.warningCard}>
          <ThemedText type='caption' style={styles.warningText}>
            ⚠️ 구독 취소 시 다음 결제일까지 예측권을 사용할 수 있습니다. 취소 후 환불은
            불가능합니다.
          </ThemedText>
        </Card>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  price: {
    color: '#FFD700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  noticeText: {
    flex: 1,
  },
  benefitsCard: {
    backgroundColor: '#f8faf5',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    flex: 1,
    color: '#333',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
  },
  warningText: {
    color: '#856404',
    lineHeight: 20,
  },
});
