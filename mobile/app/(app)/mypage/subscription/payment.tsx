import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
import { showErrorMessage, showSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet } from 'react-native';

/**
 * 구독 결제 화면 (Toss Payments)
 */
export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribe } = useSubscription();
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);

  const orderId = `SUB-${Date.now()}`;
  const orderName = 'AI 예측권 프리미엄 구독';
  const amount = 19800;

  const handleStartPayment = () => {
    setShowPaymentWidget(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // 결제 성공 시 서버에 구독 활성화 요청
      await subscribe.mutateAsync(user?.id || '');

      setShowPaymentWidget(false);

      showSuccessMessage(
        '프리미엄 구독이 활성화되었습니다.\n월 30장의 AI 예측권을 사용하실 수 있습니다.',
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

  return (
    <PageLayout style={{ paddingTop: 0 }}>
      <PageHeader title='구독 결제' showBackButton={true} onBackPress={() => router.back()} />
      {/* 결제 정보 카드 */}
      <SubscriptionCard title='결제 정보 확인' icon='card'>
        <ThemedView style={styles.paymentDetails}>
          <DetailRow label='상품명' value='AI 예측권 프리미엄 구독' />
          <DetailRow label='결제 금액' value='19,800원/월' valueStyle={styles.amountValue} />
          <DetailRow label='제공 내용' value='월 35장 AI 예측권' />
          <DetailRow label='장당 가격' value='566원 (43% 할인)' />
          <DetailRow label='결제 방식' value='정기 결제 (자동 갱신)' />
          <DetailRow
            label='다음 결제일'
            value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
          />
        </ThemedView>
      </SubscriptionCard>

      {/* 구독 혜택 카드 */}
      <SubscriptionCard title='구독 혜택' icon='diamond'>
        <ThemedView style={styles.benefitsList}>
          <BenefitItem text='월 35장 AI 예측권' />
          <BenefitItem text='장당 566원 (43% 할인)' />
          <BenefitItem text='평균 70%+ 정확도 목표' />
          <BenefitItem text='자동 갱신' />
        </ThemedView>
      </SubscriptionCard>

      {/* 안전 결제 안내 */}
      <NoticeCard
        title='안전한 결제'
        text='Toss Payments의 보안 시스템으로 안전하게 결제됩니다.'
        icon='shield-checkmark'
      />

      {/* 결제 버튼 */}
      <ThemedView style={styles.buttonContainer}>
        <ActionButton
          title='19,800원 결제하기'
          onPress={handleStartPayment}
          variant='primary'
          style={styles.paymentButton}
        />

        <ActionButton
          title='취소'
          onPress={() => router.back()}
          variant='secondary'
          style={styles.cancelButton}
        />
      </ThemedView>

      <ThemedView style={styles.legalNotice}>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='shield-checkmark' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.legalText}>
            본 서비스는 AI 기반 경마 예측 정보를 제공하는 정보 서비스입니다.
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='refresh' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>첫 결제 후 7일 이내 전액 환불 가능</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='refresh' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>예측권 미사용 시 전액 환불 가능</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='time' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>
            구독 취소 시 다음 결제일까지 서비스 이용 가능
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.legalRow}>
          <Ionicons name='lock-closed' size={16} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.legalText}>
            결제 정보는 안전하게 암호화되어 처리됩니다
          </ThemedText>
        </ThemedView>
      </ThemedView>

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
    gap: 12,
  },
  amountValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  benefitsList: {
    gap: 12,
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 12,
  },
  paymentButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
  legalNotice: {
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 12,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 18,
    opacity: 0.7,
  },
});
