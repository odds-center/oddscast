import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * 구독 결제 화면 (Toss Payments)
 *
 * TODO: react-native-webview 설치 후 Toss Payments 위젯 통합
 */
export default function SubscriptionPaymentScreen() {
  const router = useRouter();

  const handlePayment = () => {
    // TODO: 실제 Toss Payments SDK 연동
    Alert.alert(
      'Toss Payments',
      'Toss Payments 결제 위젯을 여기에 통합합니다.\n\n현재는 개발 중입니다.',
      [
        { text: '취소', style: 'cancel', onPress: () => router.back() },
        {
          text: '테스트 결제 (개발용)',
          onPress: () => {
            Alert.alert('성공', '구독이 완료되었습니다!', [
              {
                text: '확인',
                onPress: () => router.replace('/subscription/manage'),
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.notice}>🔒 안전한 Toss Payments 결제 시스템</Text>

      <View style={styles.content}>
        <Text style={styles.title}>결제 정보</Text>

        <View style={styles.paymentInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>상품명</Text>
            <Text style={styles.infoValue}>AI 예측권 프리미엄 구독</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>결제 금액</Text>
            <Text style={styles.infoValue}>19,800원/월</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>제공 내용</Text>
            <Text style={styles.infoValue}>월 30장 AI 예측권</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>결제 방식</Text>
            <Text style={styles.infoValue}>정기 결제 (자동 갱신)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
          <Text style={styles.paymentButtonText}>결제하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  notice: {
    padding: 16,
    textAlign: 'center',
    backgroundColor: '#f0f7ff',
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  paymentInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  paymentButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
