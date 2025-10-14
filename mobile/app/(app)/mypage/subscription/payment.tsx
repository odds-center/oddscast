import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/common/ActionButton';
import { BenefitItem } from '@/components/common/BenefitItem';
import { DetailRow } from '@/components/common/DetailRow';
import { NoticeCard } from '@/components/common/NoticeCard';
import { PageLayout } from '@/components/common/PageLayout';
import { SubscriptionCard } from '@/components/common/SubscriptionCard';
import { PageHeader } from '@/components/common/PageHeader';
import { TossPaymentWidget } from '@/components/payment/TossPaymentWidget';
import { GOLD_THEME } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSubscriptionPlans } from '@/lib/hooks/useSubscriptionPlans';
import { useSinglePurchaseConfig } from '@/lib/hooks/useSinglePurchaseConfig';
import { showErrorMessage, showSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Modal, StyleSheet, View, ActivityIndicator } from 'react-native';

/**
 * 구독 결제 화면 (Toss Payments)
 */
export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const { user } = useAuth();
  const { subscribe } = useSubscription();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: singleConfig } = useSinglePurchaseConfig();
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);

  // DB에서 가져온 플랜 정보 (planName 기준으로 찾기)
  const selectedPlanName = (planId as string) || 'PREMIUM';
  const plan = useMemo(() => {
    if (!plans || plans.length === 0) return null;
    return plans.find((p) => p.planName === selectedPlanName) || plans[0];
  }, [plans, selectedPlanName]);

  // 계산된 값
  const pricePerTicket = plan ? Math.round(plan.totalPrice / plan.totalTickets) : 0;
  const SINGLE_PRICE = singleConfig?.totalPrice || 1100; // DB에서 가져온 개별 구매 가격
  const discount = plan
    ? Math.round(
        ((SINGLE_PRICE * plan.totalTickets - plan.totalPrice) /
          (SINGLE_PRICE * plan.totalTickets)) *
          100
      )
    : 0;

  const orderId = `SUB-${Date.now()}`;
  const orderName = plan ? `AI 예측권 ${plan.displayName}` : 'AI 예측권 구독';
  const amount = plan?.totalPrice || 0;

  const handleStartPayment = () => {
    setShowPaymentWidget(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // 결제 성공 시 서버에 구독 활성화 요청
      await subscribe.mutateAsync(user?.id || '');

      setShowPaymentWidget(false);

      showSuccessMessage(
        `${plan?.displayName}이 활성화되었습니다.\n월 ${plan?.totalTickets}장의 AI 예측권을 사용하실 수 있습니다.`,
        '구독 완료!'
      );
      setTimeout(() => {
        router.replace('/mypage/subscription/dashboard');
      }, 1500);
    } catch {
      setShowPaymentWidget(false);
      showErrorMessage('구독 활성화에 실패했습니다. 고객센터로 문의해주세요.', '오류');
    }
  };

  const handlePaymentFail = (error: any) => {
    setShowPaymentWidget(false);
    showErrorMessage(error.message || '결제가 실패했습니다. 다시 시도해주세요.', '결제 실패');
  };

  const handlePaymentCancel = () => {
    setShowPaymentWidget(false);
  };

  // 로딩 중이거나 플랜이 없을 때
  if (isLoading) {
    return (
      <PageLayout style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText style={{ marginTop: 16 }}>플랜 정보를 불러오는 중...</ThemedText>
      </PageLayout>
    );
  }

  if (!plan) {
    return (
      <PageLayout>
        <ThemedText>플랜 정보를 찾을 수 없습니다.</ThemedText>
        <ActionButton title='돌아가기' onPress={() => router.back()} variant='secondary' />
      </PageLayout>
    );
  }

  return (
    <PageLayout style={{ paddingTop: 0 }}>
      <PageHeader title='구독 결제' showBackButton={true} onBackPress={() => router.back()} />

      {/* 결제 정보 카드 */}
      <SubscriptionCard title='결제 정보 확인' icon='card'>
        <View style={styles.paymentDetails}>
          <DetailRow label='상품명' value={`AI 예측권 ${plan.displayName}`} />
          <DetailRow
            label='결제 금액'
            value={`${Math.floor(plan.totalPrice).toLocaleString('ko-KR')}원/월`}
            valueStyle={styles.amountValue}
          />
          <DetailRow
            label='제공 내용'
            value={`월 ${plan.totalTickets}장 AI 예측권 (기본 ${plan.baseTickets}장 + 보너스 ${plan.bonusTickets}장)`}
          />
          <DetailRow
            label='장당 가격'
            value={`${pricePerTicket.toLocaleString('ko-KR')}원 (${discount}% 할인)`}
          />
          <DetailRow label='결제 방식' value='정기 결제 (자동 갱신)' />
          <DetailRow
            label='다음 결제일'
            value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
          />
        </View>
      </SubscriptionCard>

      {/* 구독 혜택 카드 */}
      <SubscriptionCard title='구독 혜택' icon='diamond'>
        <View style={styles.benefitsList}>
          <BenefitItem text={`월 ${plan.totalTickets}장 AI 예측권`} />
          <BenefitItem
            text={`장당 ${pricePerTicket.toLocaleString('ko-KR')}원 (${discount}% 할인)`}
          />
          <BenefitItem text='평균 70%+ 정확도 목표' />
          <BenefitItem text='자동 갱신' />
        </View>
      </SubscriptionCard>

      {/* 안전 결제 안내 */}
      <NoticeCard
        title='안전한 결제'
        text='Toss Payments의 보안 시스템으로 안전하게 결제됩니다.'
        icon='shield-checkmark'
      />

      {/* 결제 버튼 */}
      <View style={styles.buttonContainer}>
        <ActionButton
          title={`${Math.floor(plan.totalPrice).toLocaleString('ko-KR')}원 결제하기`}
          onPress={handleStartPayment}
          variant='primary'
        />

        <ActionButton title='취소' onPress={() => router.back()} variant='secondary' />
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
          <Ionicons name='refresh' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>첫 결제 후 7일 이내 전액 환불 가능</ThemedText>
        </View>
        <View style={styles.legalRow}>
          <Ionicons name='refresh' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>예측권 미사용 시 전액 환불 가능</ThemedText>
        </View>
        <View style={styles.legalRow}>
          <Ionicons name='time' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>
            구독 취소 시 다음 결제일까지 서비스 이용 가능
          </ThemedText>
        </View>
        <View style={styles.legalRow}>
          <Ionicons name='lock-closed' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>
            결제 정보는 안전하게 암호화되어 처리됩니다
          </ThemedText>
        </View>
      </View>

      {/* 결제 위젯 모달 */}
      <Modal
        visible={showPaymentWidget}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={handlePaymentCancel}
      >
        <TossPaymentWidget
          orderId={orderId}
          orderName={orderName}
          amount={amount}
          customerName={user?.name}
          customerEmail={user?.email}
          onSuccess={handlePaymentSuccess}
          onFail={handlePaymentFail}
          onCancel={handlePaymentCancel}
        />
      </Modal>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  paymentDetails: {
    gap: 16,
  },
  amountValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  benefitsList: {
    gap: 16,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  legalNotice: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 16,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 24,
  },
  legalText: {
    flex: 1,
    fontSize: 13,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
    opacity: 0.8,
    backgroundColor: 'transparent',
  },
});
