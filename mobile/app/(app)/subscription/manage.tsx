import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePredictions } from '@/lib/hooks/usePredictions';

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
            } catch (error) {
              Alert.alert('오류', '구독 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (!isSubscribed || !subscription) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>활성 구독이 없습니다</Text>
          <Text style={styles.emptyText}>프리미엄 구독으로 매월 30장의 AI 예측권을 받으세요!</Text>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/subscription/plans')}
          >
            <Text style={styles.subscribeButtonText}>구독하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 구독 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💎 구독 정보</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>플랜</Text>
            <Text style={styles.infoValue}>프리미엄</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>월 구독료</Text>
            <Text style={styles.infoValue}>19,800원</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>월 제공 예측권</Text>
            <Text style={styles.infoValue}>30장</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>장당 가격</Text>
            <Text style={styles.infoValue}>660원</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>상태</Text>
            <Text style={[styles.infoValue, styles.statusActive]}>활성</Text>
          </View>

          {subscription.nextBillingDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>다음 결제일</Text>
              <Text style={styles.infoValue}>
                {new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR')}
                {daysUntilRenewal !== null && ` (D-${daysUntilRenewal})`}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>구독 시작일</Text>
            <Text style={styles.infoValue}>
              {new Date(subscription.startedAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>
        </View>
      </View>

      {/* 예측권 잔액 */}
      {balance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎫 예측권 잔액</Text>

          <View style={styles.card}>
            <View style={styles.ticketStats}>
              <View style={styles.ticketStatItem}>
                <Text style={styles.ticketStatValue}>{balance.availableTickets}</Text>
                <Text style={styles.ticketStatLabel}>사용 가능</Text>
              </View>
              <View style={styles.ticketStatItem}>
                <Text style={styles.ticketStatValue}>{balance.usedTickets}</Text>
                <Text style={styles.ticketStatLabel}>사용함</Text>
              </View>
              <View style={styles.ticketStatItem}>
                <Text style={styles.ticketStatValue}>{balance.totalTickets}</Text>
                <Text style={styles.ticketStatLabel}>총 발급</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 혜택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ 구독 혜택</Text>

        <View style={styles.card}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>34% 할인</Text>
              <Text style={styles.benefitText}>개별 구매 대비 월 10,200원 절약</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🤖</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>최신 AI 기술</Text>
              <Text style={styles.benefitText}>GPT-4o 또는 Claude 3.5 Sonnet</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>높은 정확도</Text>
              <Text style={styles.benefitText}>평균 70%+ 정확도 목표</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>♻️</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>자동 갱신</Text>
              <Text style={styles.benefitText}>매월 자동으로 예측권 재발급</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 구독 취소 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>구독 취소</Text>
        </TouchableOpacity>

        <Text style={styles.cancelNotice}>
          구독 취소 시 다음 결제일까지 예측권을 계속 사용하실 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusActive: {
    color: '#28a745',
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
    color: '#007AFF',
    marginBottom: 4,
  },
  ticketStatLabel: {
    fontSize: 12,
    color: '#999',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
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
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
