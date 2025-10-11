import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { TossPaymentWidget } from '@/components/payment/TossPaymentWidget';
import { GOLD_THEME } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { useSinglePurchase } from '@/lib/hooks/useSinglePurchase';
import { showConfirmMessage, showErrorMessage, showSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * 개별 구매 화면 (1,000원/장)
 */
export default function SinglePurchaseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { purchase, calculatePrice } = useSinglePurchase();
  const { balance } = usePredictions();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(1000);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);

  useEffect(() => {
    // 가격 계산
    calculatePrice(selectedQuantity).then((result) => {
      setTotalPrice(result.totalPrice);
    });
  }, [selectedQuantity, calculatePrice]);

  const handlePurchase = () => {
    showConfirmMessage(
      `${selectedQuantity}장 (${totalPrice.toLocaleString()}원)을 구매하시겠습니까?`,
      '구매 확인',
      () => setShowPaymentWidget(true)
    );
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      await purchase.mutateAsync({
        quantity: selectedQuantity,
        pgTransactionId: paymentData.paymentKey,
      });

      setShowPaymentWidget(false);

      showSuccessMessage(`${selectedQuantity}장 구매 완료!\n30일간 사용 가능합니다.`, '구매 완료!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      setShowPaymentWidget(false);
      showErrorMessage('구매 처리에 실패했습니다. 고객센터로 문의해주세요.', '오류');
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
      <PageHeader title='AI 예측권 구매' showBackButton={true} onBackPress={() => router.back()} />
      {/* 현재 잔액 */}
      {balance && (
        <View style={styles.balanceCard}>
          <ThemedText type='caption' style={styles.balanceLabel}>
            현재 보유
          </ThemedText>
          <ThemedText type='title' style={styles.balanceValue}>
            {balance.availableTickets}장
          </ThemedText>
        </View>
      )}

      {/* 수량 선택 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          수량 선택
        </ThemedText>

        <View style={styles.quantityOptions}>
          {[1, 5, 10].map((qty) => (
            <TouchableOpacity
              key={qty}
              style={[
                styles.quantityOption,
                selectedQuantity === qty && styles.quantityOptionSelected,
              ]}
              onPress={() => setSelectedQuantity(qty)}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.quantityOptionText,
                  selectedQuantity === qty && styles.quantityOptionTextSelected,
                ]}
              >
                {qty}장
              </ThemedText>
              {qty === 5 && <ThemedText style={styles.discountBadge}>5% 할인</ThemedText>}
              {qty === 10 && <ThemedText style={styles.discountBadge}>10% 할인</ThemedText>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 가격 상세 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          가격 상세
        </ThemedText>

        <View style={styles.card}>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>단가</ThemedText>
            <ThemedText style={styles.priceValue}>1,000원/장</ThemedText>
          </View>

          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>수량</ThemedText>
            <ThemedText style={styles.priceValue}>{selectedQuantity}장</ThemedText>
          </View>

          {selectedQuantity >= 5 && (
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceLabel}>할인</ThemedText>
              <ThemedText style={[styles.priceValue, styles.discount]}>
                -{selectedQuantity >= 10 ? '10%' : '5%'}
              </ThemedText>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <ThemedText style={styles.totalLabel}>총 결제 금액</ThemedText>
            <ThemedText style={styles.totalValue}>{totalPrice.toLocaleString()}원</ThemedText>
          </View>
        </View>
      </View>

      {/* 구독 추천 */}
      <View style={styles.recommendCard}>
        <View style={styles.recommendHeader}>
          <Ionicons name='bulb' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.recommendTitle}>구독이 더 저렴해요!</ThemedText>
        </View>
        <ThemedText style={styles.recommendText}>
          월 15장 이상 사용하신다면 프리미엄 구독을 추천드립니다.
        </ThemedText>
        <ThemedText style={styles.recommendCompare}>
          개별 15장: 15,000원 vs 구독 30장: 19,800원
        </ThemedText>
        <TouchableOpacity
          style={styles.recommendButton}
          onPress={() => router.push('/mypage/subscription/plans')}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.recommendButtonText}>구독 플랜 보기</ThemedText>
        </TouchableOpacity>
      </View>

      {/* 구매 버튼 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={purchase.isPending}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.purchaseButtonText}>
            {purchase.isPending ? '처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* 안내사항 */}
      <View style={styles.notice}>
        <View style={styles.noticeHeader}>
          <Ionicons name='information-circle' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.noticeTitle}>안내사항</ThemedText>
        </View>
        <ThemedText style={styles.noticeText}>• 구매한 예측권은 30일간 사용 가능합니다.</ThemedText>
        <ThemedText style={styles.noticeText}>• 환불은 미사용 예측권에 한해 가능합니다.</ThemedText>
        <ThemedText style={styles.noticeText}>• 예측권은 1회 사용 시 소진됩니다.</ThemedText>
      </View>

      {/* 결제 위젯 모달 */}
      <Modal
        visible={showPaymentWidget}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={handlePaymentCancel}
      >
        <TossPaymentWidget
          orderId={`SINGLE-${Date.now()}`}
          orderName={`AI 예측권 ${selectedQuantity}장`}
          amount={totalPrice}
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
  balanceCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    marginBottom: 8,
    lineHeight: 22,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    lineHeight: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
  },
  quantityOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quantityOption: {
    flex: 1,
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quantityOptionSelected: {
    borderColor: GOLD_THEME.TEXT.SECONDARY,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  quantityOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  quantityOptionTextSelected: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  discountBadge: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
    lineHeight: 18,
  },
  card: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 15,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 22,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
  },
  discount: {
    color: '#dc3545',
  },
  divider: {
    height: 1,
    backgroundColor: GOLD_THEME.BORDER.GOLD,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 32,
  },
  recommendCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.TEXT.SECONDARY,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  recommendText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  recommendCompare: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  recommendButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  buttonSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  purchaseButton: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    backgroundColor: 'transparent',
  },
  notice: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    gap: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  noticeText: {
    fontSize: 12,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
    opacity: 0.7,
    backgroundColor: 'transparent',
  },
});
