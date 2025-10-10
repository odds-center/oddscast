import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSinglePurchase } from '@/lib/hooks/useSinglePurchase';
import { usePredictions } from '@/lib/hooks/usePredictions';

/**
 * 개별 구매 화면 (1,000원/장)
 */
export default function SinglePurchaseScreen() {
  const router = useRouter();
  const { purchase, calculatePrice } = useSinglePurchase();
  const { balance } = usePredictions();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(1000);

  useEffect(() => {
    // 가격 계산
    calculatePrice(selectedQuantity).then((result) => {
      setTotalPrice(result.totalPrice);
    });
  }, [selectedQuantity]);

  const handlePurchase = async () => {
    Alert.alert(
      '구매 확인',
      `${selectedQuantity}장 (${totalPrice.toLocaleString()}원)을 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: async () => {
            try {
              // TODO: Toss Payments 위젯 호출
              // 임시: 결제 성공으로 가정
              await purchase.mutateAsync({
                quantity: selectedQuantity,
                pgTransactionId: `temp-${Date.now()}`,
              });

              Alert.alert('성공', `${selectedQuantity}장 구매 완료!`, [
                {
                  text: '확인',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert('오류', '구매에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🎫 AI 예측권 구매</Text>
        <Text style={styles.subtitle}>필요한 만큼만 구매하세요</Text>
      </View>

      {/* 현재 잔액 */}
      {balance && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>현재 보유</Text>
          <Text style={styles.balanceValue}>{balance.availableTickets}장</Text>
        </View>
      )}

      {/* 수량 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>수량 선택</Text>

        <View style={styles.quantityOptions}>
          {[1, 5, 10].map((qty) => (
            <TouchableOpacity
              key={qty}
              style={[
                styles.quantityOption,
                selectedQuantity === qty && styles.quantityOptionSelected,
              ]}
              onPress={() => setSelectedQuantity(qty)}
            >
              <Text
                style={[
                  styles.quantityOptionText,
                  selectedQuantity === qty && styles.quantityOptionTextSelected,
                ]}
              >
                {qty}장
              </Text>
              {qty === 5 && <Text style={styles.discountBadge}>5% 할인</Text>}
              {qty === 10 && <Text style={styles.discountBadge}>10% 할인</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 가격 상세 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>가격 상세</Text>

        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>단가</Text>
            <Text style={styles.priceValue}>1,000원/장</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>수량</Text>
            <Text style={styles.priceValue}>{selectedQuantity}장</Text>
          </View>

          {selectedQuantity >= 5 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>할인</Text>
              <Text style={[styles.priceValue, styles.discount]}>
                -{selectedQuantity >= 10 ? '10%' : '5%'}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>총 결제 금액</Text>
            <Text style={styles.totalValue}>{totalPrice.toLocaleString()}원</Text>
          </View>
        </View>
      </View>

      {/* 구독 추천 */}
      <View style={styles.recommendCard}>
        <Text style={styles.recommendTitle}>💡 구독이 더 저렴해요!</Text>
        <Text style={styles.recommendText}>
          월 15장 이상 사용하신다면 프리미엄 구독을 추천드립니다.
        </Text>
        <Text style={styles.recommendCompare}>개별 15장: 15,000원 vs 구독 30장: 19,800원</Text>
        <TouchableOpacity
          style={styles.recommendButton}
          onPress={() => router.push('/subscription/plans')}
        >
          <Text style={styles.recommendButtonText}>구독 플랜 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 구매 버튼 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={purchase.isPending}
        >
          <Text style={styles.purchaseButtonText}>
            {purchase.isPending ? '처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 안내사항 */}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>📋 안내사항</Text>
        <Text style={styles.noticeText}>• 구매한 예측권은 30일간 사용 가능합니다.</Text>
        <Text style={styles.noticeText}>• 환불은 미사용 예측권에 한해 가능합니다.</Text>
        <Text style={styles.noticeText}>• 예측권은 1회 사용 시 소진됩니다.</Text>
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
    backgroundColor: '#28a745',
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quantityOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quantityOption: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  quantityOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  quantityOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityOptionTextSelected: {
    color: '#007AFF',
  },
  discountBadge: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  discount: {
    color: '#dc3545',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  recommendCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  recommendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recommendCompare: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSection: {
    padding: 16,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  notice: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 32,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
});
