import { ActionButton } from '@/components/common/ActionButton';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSubscriptionPlans } from '@/lib/hooks/useSubscriptionPlans';
import { useSinglePurchaseConfig } from '@/lib/hooks/useSinglePurchaseConfig';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * 구독 플랜 선택 화면
 */
export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: singleConfig } = useSinglePurchaseConfig();
  const [selectedPlan, setSelectedPlan] = useState<'LIGHT' | 'PREMIUM' | null>(null);

  // Bottom Sheet ref
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  // 플랜 데이터를 맵으로 변환 (DB 스키마 기준)
  const planMap = useMemo(() => {
    if (!plans || !singleConfig) return null;
    const map: any = {};
    const SINGLE_PRICE = singleConfig.totalPrice; // DB에서 가져온 개별 구매 가격

    plans.forEach((plan) => {
      const pricePerTicket = Math.round(plan.totalPrice / plan.totalTickets);
      const discount = Math.round(
        ((SINGLE_PRICE * plan.totalTickets - plan.totalPrice) /
          (SINGLE_PRICE * plan.totalTickets)) *
          100
      );
      const savings = SINGLE_PRICE * plan.totalTickets - plan.totalPrice;

      map[plan.planName] = {
        id: plan.id,
        name: plan.displayName,
        description: plan.description || '',
        price: plan.totalPrice,
        tickets: plan.totalTickets,
        baseTickets: plan.baseTickets,
        bonusTickets: plan.bonusTickets,
        pricePerTicket,
        discount,
        isRecommended: plan.sortOrder === 2, // 프리미엄(sortOrder=2)이 추천
        features: [
          `월 ${plan.totalTickets}장 AI 예측권 (기본 ${plan.baseTickets}장 + 보너스 ${plan.bonusTickets}장)`,
          `장당 ${pricePerTicket.toLocaleString('ko-KR')}원 (${discount}% 할인)`,
          '평균 70%+ 정확도 목표',
          '자동 갱신',
        ],
        savings,
      };
    });
    return map;
  }, [plans, singleConfig]);

  const handlePlanSelect = (planId: 'LIGHT' | 'PREMIUM') => {
    setSelectedPlan(planId);
    bottomSheetRef.current?.expand();
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      router.push('/mypage/subscription/dashboard');
      return;
    }
    // 선택된 플랜 정보를 payment 페이지로 전달
    router.push({
      pathname: '/mypage/subscription/payment',
      params: { planId: selectedPlan || 'PREMIUM' },
    });
  };

  const handleBuySingle = () => {
    router.push('/mypage/purchase/single');
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const currentPlan = selectedPlan && planMap ? planMap[selectedPlan] : null;

  const lightPlan = planMap?.LIGHT;
  const premiumPlan = planMap?.PREMIUM;

  if (isLoading || !planMap || !lightPlan || !premiumPlan) {
    return (
      <PageLayout style={{ paddingTop: 0 }}>
        <PageHeader
          title='AI 예측권 구독'
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>플랜 정보를 불러오는 중...</ThemedText>
        </View>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout style={{ paddingTop: 0 }}>
        <PageHeader
          title='AI 예측권 구독'
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        {/* 라이트 플랜 */}
        <View style={[styles.planCard, selectedPlan === 'LIGHT' && styles.planCardSelected]}>
          <TouchableOpacity
            onPress={() => handlePlanSelect('LIGHT')}
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
              <ThemedText style={styles.price}>
                {Math.floor(lightPlan.price).toLocaleString('ko-KR')}원
              </ThemedText>
              <ThemedText style={styles.pricePeriod}>/월</ThemedText>
            </View>

            <View style={styles.features}>
              {lightPlan.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.savings}>
              <Ionicons name='bulb' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.savingsText}>
                개별 구매 대비 월 {Math.floor(lightPlan.savings).toLocaleString('ko-KR')}원 절약!
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* 프리미엄 플랜 */}
        <View style={[styles.planCard, selectedPlan === 'PREMIUM' && styles.planCardSelected]}>
          <TouchableOpacity
            onPress={() => handlePlanSelect('PREMIUM')}
            disabled={isSubscribed}
            activeOpacity={0.8}
            style={styles.touchableArea}
          >
            <View style={styles.planHeader}>
              <View>
                <LinearGradient
                  colors={[GOLD_THEME.GOLD.LIGHT, GOLD_THEME.GOLD.DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.recommendBadge}
                >
                  <ThemedText style={styles.recommendText}>BEST</ThemedText>
                </LinearGradient>
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
              <ThemedText style={styles.price}>
                {Math.floor(premiumPlan.price).toLocaleString('ko-KR')}원
              </ThemedText>
              <ThemedText style={styles.pricePeriod}>/월</ThemedText>
            </View>

            <View style={styles.features}>
              {premiumPlan.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.savings}>
              <Ionicons name='bulb' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText style={styles.savingsText}>
                개별 구매 대비 월 {Math.floor(premiumPlan.savings).toLocaleString('ko-KR')}원 절약!
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

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
              <ThemedText style={styles.comparisonLabel}>
                프리미엄 구독 ({premiumPlan.tickets}장)
              </ThemedText>
              <ThemedText style={styles.comparisonSubscription}>
                {Math.floor(premiumPlan.price).toLocaleString('ko-KR')}원
              </ThemedText>
              <ThemedText style={styles.comparisonUnit}>
                {Math.floor(premiumPlan.pricePerTicket).toLocaleString('ko-KR')}원/장
              </ThemedText>
            </View>

            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>
                라이트 구독 ({lightPlan.tickets}장)
              </ThemedText>
              <ThemedText style={styles.comparisonSubscription}>
                {Math.floor(lightPlan.price).toLocaleString('ko-KR')}원
              </ThemedText>
              <ThemedText style={styles.comparisonUnit}>
                {Math.floor(lightPlan.pricePerTicket).toLocaleString('ko-KR')}원/장
              </ThemedText>
            </View>

            {singleConfig && (
              <View style={styles.comparisonRow}>
                <ThemedText style={styles.comparisonLabel}>개별 구매 (1장)</ThemedText>
                <ThemedText style={styles.comparisonSingle}>
                  {Math.floor(singleConfig.totalPrice).toLocaleString('ko-KR')}원
                </ThemedText>
                <ThemedText style={styles.comparisonUnit}>
                  {Math.floor(singleConfig.totalPrice).toLocaleString('ko-KR')}원/장
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name='information-circle' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.comparisonTip}>
              월 {lightPlan.tickets}장 이상 사용하시면 라이트 구독이, {premiumPlan.tickets}장 이상
              사용하시면 프리미엄 구독이 더 저렴합니다!
            </ThemedText>
          </View>
        </View>

        {/* 법적 고지 */}
        <View style={styles.legalNotice}>
          <View style={styles.legalRow}>
            <Ionicons name='shield-checkmark' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.legalText}>
              본 서비스는 AI 기반 경마 예측 정보를 제공하는 정보 서비스입니다.
            </ThemedText>
          </View>
          <View style={styles.legalRow}>
            <Ionicons name='information-circle' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
            <ThemedText style={styles.legalText}>
              실제 마권 구매는 한국마사회 공식 채널을 통해 이루어집니다.
            </ThemedText>
          </View>
        </View>
      </PageLayout>

      {/* Bottom Sheet - PageLayout 밖으로 이동 */}
      {selectedPlan && currentPlan && (
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetIndicator}
        >
          <BottomSheetScrollView
            style={styles.sheetContent}
            contentContainerStyle={styles.sheetContentContainer}
          >
            {/* 선택된 플랜 정보 */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                {currentPlan.isRecommended && (
                  <LinearGradient
                    colors={[GOLD_THEME.GOLD.LIGHT, GOLD_THEME.GOLD.DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sheetRecommendBadge}
                  >
                    <ThemedText style={styles.sheetRecommendText}>BEST</ThemedText>
                  </LinearGradient>
                )}
                <ThemedText type='title' style={styles.sheetTitle}>
                  {currentPlan.name}
                </ThemedText>
              </View>
              <ThemedText style={styles.sheetPrice}>
                월 {Math.floor(currentPlan.price).toLocaleString('ko-KR')}원
              </ThemedText>
            </View>

            {/* 플랜 상세 정보 */}
            <View style={styles.sheetDetails}>
              <View style={styles.sheetDetailRow}>
                <Ionicons name='ticket' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText style={styles.sheetDetailText}>
                  월 {currentPlan.tickets}장 AI 예측권
                </ThemedText>
              </View>
              <View style={styles.sheetDetailRow}>
                <Ionicons name='pricetag' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText style={styles.sheetDetailText}>
                  장당 {Math.floor(currentPlan.pricePerTicket).toLocaleString('ko-KR')}원 (
                  {currentPlan.discount}% 할인)
                </ThemedText>
              </View>
              <View style={styles.sheetDetailRow}>
                <Ionicons name='trending-down' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText style={styles.sheetDetailText}>
                  개별 구매 대비 월 {Math.floor(currentPlan.savings).toLocaleString('ko-KR')}원 절약
                </ThemedText>
              </View>
            </View>

            {/* 구독 버튼 */}
            <View style={styles.sheetButtonContainer}>
              <ActionButton
                title={`${currentPlan.name} 시작하기`}
                onPress={handleSubscribe}
                variant='primary'
                style={styles.sheetSubscribeButton}
              />
              <TouchableOpacity
                onPress={() => bottomSheetRef.current?.close()}
                style={styles.sheetCancelButton}
              >
                <ThemedText style={styles.sheetCancelText}>다른 플랜 보기</ThemedText>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </>
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: GOLD_THEME.GOLD.LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  recommendText: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    backgroundColor: 'transparent',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    backgroundColor: 'transparent',
  },
  currentBadge: {
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 36,
    backgroundColor: 'transparent',
  },
  pricePeriod: {
    fontSize: 16,
    color: GOLD_THEME.TEXT.PRIMARY,
    marginLeft: 4,
    opacity: 0.7,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  features: {
    marginBottom: 16,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  featureText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  // Bottom Sheet 스타일
  sheetBackground: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  sheetIndicator: {
    backgroundColor: GOLD_THEME.BORDER.GOLD,
    width: 40,
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  sheetHeader: {
    marginBottom: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sheetRecommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: GOLD_THEME.GOLD.LIGHT,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  sheetRecommendText: {
    fontSize: 9,
    fontWeight: '800',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    backgroundColor: 'transparent',
    letterSpacing: 0.5,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    backgroundColor: 'transparent',
  },
  sheetPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 30,
    backgroundColor: 'transparent',
  },
  sheetDetails: {
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sheetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 28,
  },
  sheetDetailText: {
    fontSize: 13,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 18,
    backgroundColor: 'transparent',
  },
  sheetButtonContainer: {
    gap: 12,
    marginTop: 'auto',
    paddingHorizontal: 24,
  },
  sheetSubscribeButton: {
    marginBottom: 0,
    height: 48,
    paddingVertical: 12,
  },
  sheetCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetCancelText: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    backgroundColor: 'transparent',
  },
});
