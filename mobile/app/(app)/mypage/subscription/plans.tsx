import { ActionButton } from '@/components/common/ActionButton';
import { PageLayout } from '@/components/common/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { GOLD_THEME } from '@/constants/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * 구독 플랜 선택 화면
 */
export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'LIGHT' | 'PREMIUM' | null>('PREMIUM');

  const handleSubscribe = () => {
    if (isSubscribed) {
      router.push('/mypage/subscription/dashboard');
      return;
    }
    router.push('/mypage/subscription/payment');
  };

  const handleBuySingle = () => {
    router.push('/mypage/purchase/single');
  };

  return (
    <PageLayout style={{ paddingTop: 0 }}>
      <PageHeader title='AI 예측권 구독' showBackButton={true} onBackPress={() => router.back()} />

      {/* 라이트 플랜 */}
      <ThemedView style={[styles.planCard, selectedPlan === 'LIGHT' && styles.planCardSelected]}>
        <TouchableOpacity
          onPress={() => setSelectedPlan('LIGHT')}
          disabled={isSubscribed}
          activeOpacity={0.8}
          style={styles.touchableArea}
        >
          <View style={styles.planHeader}>
            <View>
              <ThemedText type='title' style={styles.planName}>
                라이트 구독
              </ThemedText>
            </View>
            {isSubscribed && (
              <View style={styles.currentBadge}>
                <ThemedText style={styles.currentBadgeText}>현재 구독 중</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <ThemedText style={styles.price}>9,900원</ThemedText>
            <ThemedText style={styles.pricePeriod}>/월</ThemedText>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>월 15장 AI 예측권</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>장당 660원 (34% 할인)</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>평균 70%+ 정확도 목표</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>자동 갱신</ThemedText>
            </View>
          </View>

          <View style={styles.savings}>
            <Ionicons name='bulb' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.savingsText}>개별 구매 대비 월 5,100원 절약!</ThemedText>
          </View>
        </TouchableOpacity>
      </ThemedView>

      {/* 프리미엄 플랜 */}
      <ThemedView style={[styles.planCard, selectedPlan === 'PREMIUM' && styles.planCardSelected]}>
        <TouchableOpacity
          onPress={() => setSelectedPlan('PREMIUM')}
          disabled={isSubscribed}
          activeOpacity={0.8}
          style={styles.touchableArea}
        >
          <View style={styles.planHeader}>
            <View>
              <View style={styles.recommendBadge}>
                <Ionicons name='diamond' size={14} color={GOLD_THEME.BACKGROUND.PRIMARY} />
                <ThemedText style={styles.recommendText}>추천</ThemedText>
              </View>
              <ThemedText type='title' style={styles.planName}>
                프리미엄 구독
              </ThemedText>
            </View>
            {isSubscribed && (
              <View style={styles.currentBadge}>
                <ThemedText style={styles.currentBadgeText}>현재 구독 중</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <ThemedText style={styles.price}>19,800원</ThemedText>
            <ThemedText style={styles.pricePeriod}>/월</ThemedText>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>월 35장 AI 예측권</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>장당 566원 (43% 할인)</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>평균 70%+ 정확도 목표</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.featureText}>자동 갱신</ThemedText>
            </View>
          </View>

          <View style={styles.savings}>
            <Ionicons name='bulb' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.savingsText}>개별 구매 대비 월 15,200원 절약!</ThemedText>
          </View>
        </TouchableOpacity>
      </ThemedView>

      {/* 가격 비교 */}
      <View style={styles.comparisonSection}>
        <View style={styles.comparisonTitleContainer}>
          <Ionicons name='cash' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText type='title' style={styles.comparisonTitle}>
            가격 비교
          </ThemedText>
        </View>

        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <ThemedText style={styles.comparisonLabel}>프리미엄 구독 (35장)</ThemedText>
            <ThemedText style={styles.comparisonSubscription}>19,800원</ThemedText>
            <ThemedText style={styles.comparisonUnit}>566원/장</ThemedText>
          </View>

          <View style={styles.comparisonRow}>
            <ThemedText style={styles.comparisonLabel}>라이트 구독 (15장)</ThemedText>
            <ThemedText style={styles.comparisonSubscription}>9,900원</ThemedText>
            <ThemedText style={styles.comparisonUnit}>660원/장</ThemedText>
          </View>

          <View style={styles.comparisonRow}>
            <ThemedText style={styles.comparisonLabel}>개별 구매 (1장)</ThemedText>
            <ThemedText style={styles.comparisonSingle}>1,000원</ThemedText>
            <ThemedText style={styles.comparisonUnit}>1,000원/장</ThemedText>
          </View>

          <View style={styles.comparisonRow}>
            <ThemedText style={styles.comparisonLabel}>개별 5장 (5% 할인)</ThemedText>
            <ThemedText style={styles.comparisonSingle}>4,750원</ThemedText>
            <ThemedText style={styles.comparisonUnit}>950원/장</ThemedText>
          </View>

          <View style={styles.comparisonRow}>
            <ThemedText style={styles.comparisonLabel}>개별 10장 (10% 할인)</ThemedText>
            <ThemedText style={styles.comparisonSingle}>9,000원</ThemedText>
            <ThemedText style={styles.comparisonUnit}>900원/장</ThemedText>
          </View>
        </View>

        <View style={styles.tipContainer}>
          <Ionicons name='information-circle' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.comparisonTip}>
            월 15장 이상 사용하시면 라이트 구독이, 35장 이상 사용하시면 프리미엄 구독이 더
            저렴합니다!
          </ThemedText>
        </View>
      </View>

      {/* 버튼 */}
      <ThemedView style={styles.buttonSection}>
        {!isSubscribed ? (
          <ActionButton
            title='구독하기 (19,800원/월)'
            onPress={handleSubscribe}
            variant='primary'
          />
        ) : (
          <ActionButton
            title='구독 관리'
            onPress={() => router.push('/mypage/subscription/manage')}
            variant='secondary'
          />
        )}

        <ActionButton
          title='개별 구매 (1,000원/장)'
          onPress={handleBuySingle}
          variant='secondary'
        />
      </ThemedView>

      {/* 법적 고지 */}
      <ThemedView style={styles.legalNotice}>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='shield-checkmark' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.legalText}>
            본 서비스는 AI 기반 경마 예측 정보를 제공하는 정보 서비스입니다.
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='information-circle' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>
            실제 마권 구매는 한국마사회 공식 채널을 통해 이루어집니다.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 28,
  },
  headerSpacer: {
    width: 40,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
  },
  planCardSelected: {
    borderColor: GOLD_THEME.TEXT.SECONDARY,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  touchableArea: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  recommendText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    backgroundColor: 'transparent',
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    backgroundColor: 'transparent',
  },
  currentBadge: {
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 44,
    backgroundColor: 'transparent',
  },
  pricePeriod: {
    fontSize: 18,
    color: GOLD_THEME.TEXT.PRIMARY,
    marginLeft: 4,
    opacity: 0.7,
    lineHeight: 28,
    backgroundColor: 'transparent',
  },
  features: {
    marginBottom: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  featureText: {
    fontSize: 16,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  savings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    minHeight: 44,
  },
  savingsText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  comparisonSection: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  comparisonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    minHeight: 28,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  comparisonTable: {
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 44,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    flex: 1,
    opacity: 0.8,
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  comparisonSubscription: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    width: 80,
    textAlign: 'right',
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  comparisonSingle: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    width: 80,
    textAlign: 'right',
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  comparisonUnit: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    width: 80,
    textAlign: 'right',
    opacity: 0.6,
    lineHeight: 18,
    backgroundColor: 'transparent',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 32,
  },
  comparisonTip: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  buttonSection: {
    marginBottom: 20,
    gap: 12,
  },
  subscribeButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  manageButton: {
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  manageButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  singleBuyButton: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 2,
    borderColor: GOLD_THEME.TEXT.SECONDARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  singleBuyButtonText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  legalNotice: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 8,
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
