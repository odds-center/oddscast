import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePredictions } from '@/lib/hooks/usePredictions';

/**
 * 구독 플랜 선택 화면
 */
export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { isSubscribed, subscription } = useSubscription();
  const { balance } = usePredictions();
  const [selectedPlan, setSelectedPlan] = useState<'PREMIUM' | null>('PREMIUM');

  const handleSubscribe = () => {
    if (isSubscribed) {
      Alert.alert('알림', '이미 구독 중입니다.');
      return;
    }

    // Toss 결제 화면으로 이동
    router.push('/subscription/payment');
  };

  const handleBuySingle = () => {
    router.push('/purchase/single');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI 예측권 구독</Text>
        <Text style={styles.subtitle}>LLM 기반 경마 예측 정보 서비스</Text>
      </View>

      {/* 현재 잔액 */}
      {balance && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>현재 보유 예측권</Text>
          <Text style={styles.balanceValue}>{balance.availableTickets}장</Text>
        </View>
      )}

      {/* 프리미엄 플랜 */}
      <TouchableOpacity
        style={[styles.planCard, selectedPlan === 'PREMIUM' && styles.planCardSelected]}
        onPress={() => setSelectedPlan('PREMIUM')}
        disabled={isSubscribed}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planBadge}>💎 추천</Text>
            <Text style={styles.planName}>프리미엄 구독</Text>
          </View>
          {isSubscribed && <Text style={styles.currentBadge}>현재 구독 중</Text>}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>19,800원</Text>
          <Text style={styles.pricePeriod}>/월</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>월 30장 AI 예측권</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>장당 660원 (34% 할인)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>GPT-4o 또는 Claude AI</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>평균 70%+ 정확도 목표</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>자동 갱신</Text>
          </View>
        </View>

        <View style={styles.savings}>
          <Text style={styles.savingsText}>💡 개별 구매 대비 월 10,200원 절약!</Text>
        </View>
      </TouchableOpacity>

      {/* 가격 비교 */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>💰 가격 비교</Text>

        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>구독 (30장)</Text>
            <Text style={styles.comparisonSubscription}>19,800원</Text>
            <Text style={styles.comparisonUnit}>660원/장</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>개별 구매 (1장)</Text>
            <Text style={styles.comparisonSingle}>1,000원</Text>
            <Text style={styles.comparisonUnit}>1,000원/장</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>개별 5장 (5% 할인)</Text>
            <Text style={styles.comparisonSingle}>4,750원</Text>
            <Text style={styles.comparisonUnit}>950원/장</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>개별 10장 (10% 할인)</Text>
            <Text style={styles.comparisonSingle}>9,000원</Text>
            <Text style={styles.comparisonUnit}>900원/장</Text>
          </View>
        </View>

        <Text style={styles.comparisonTip}>
          💡 월 15장 이상 사용하시면 구독이 더 저렴합니다!
        </Text>
      </View>

      {/* 버튼 */}
      <View style={styles.buttonSection}>
        {!isSubscribed ? (
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>구독하기 (19,800원/월)</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push('/subscription/manage')}
          >
            <Text style={styles.manageButtonText}>구독 관리</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.singleBuyButton} onPress={handleBuySingle}>
          <Text style={styles.singleBuyButtonText}>개별 구매 (1,000원/장)</Text>
        </TouchableOpacity>
      </View>

      {/* 법적 고지 */}
      <View style={styles.legalNotice}>
        <Text style={styles.legalText}>
          ⚖️ 본 서비스는 AI 기반 경마 예측 정보를 제공하는 정보 서비스입니다.
        </Text>
        <Text style={styles.legalText}>
          실제 마권 구매는 한국마사회 공식 채널을 통해 이루어집니다.
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  planCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  planCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planBadge: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#007AFF',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  savings: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  comparisonSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  comparisonTable: {
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  comparisonSubscription: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    width: 80,
    textAlign: 'right',
  },
  comparisonSingle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 80,
    textAlign: 'right',
  },
  comparisonUnit: {
    fontSize: 12,
    color: '#999',
    width: 80,
    textAlign: 'right',
  },
  comparisonTip: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonSection: {
    padding: 16,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  manageButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  singleBuyButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  singleBuyButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  legalNotice: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 32,
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
});

