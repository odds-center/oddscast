import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

/**
 * 구독 결제 내역 화면
 */
export default function SubscriptionHistoryScreen() {
  const router = useRouter();

  // TODO: useQuery로 실제 결제 내역 가져오기
  const mockHistory = [
    {
      id: '1',
      amount: 19800,
      billingDate: '2025-10-01',
      status: 'SUCCESS',
      ticketsIssued: 30,
    },
    {
      id: '2',
      amount: 19800,
      billingDate: '2025-09-01',
      status: 'SUCCESS',
      ticketsIssued: 30,
    },
    {
      id: '3',
      amount: 19800,
      billingDate: '2025-08-01',
      status: 'SUCCESS',
      ticketsIssued: 30,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return GOLD_THEME.TEXT.SECONDARY;
      case 'FAILED':
        return '#dc3545';
      case 'REFUNDED':
        return '#6c757d';
      default:
        return GOLD_THEME.TEXT.PRIMARY;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '결제 완료';
      case 'FAILED':
        return '결제 실패';
      case 'REFUNDED':
        return '환불 완료';
      default:
        return status;
    }
  };

  return (
    <PageLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
          </TouchableOpacity>
          <ThemedText type='title' style={styles.title}>
            결제 내역
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {mockHistory.length > 0 ? (
          <View style={styles.historyList}>
            {mockHistory.map((item, index) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <ThemedText style={styles.historyDate}>
                    {new Date(item.billingDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}
                  >
                    <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.historyBody}>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>상품명</ThemedText>
                    <ThemedText style={styles.infoValue}>AI 예측권 프리미엄</ThemedText>
                  </View>

                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>결제 금액</ThemedText>
                    <ThemedText style={styles.amountValue}>
                      {item.amount.toLocaleString()}원
                    </ThemedText>
                  </View>

                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>발급 예측권</ThemedText>
                    <ThemedText style={styles.infoValue}>{item.ticketsIssued}장</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name='receipt-outline'
              size={64}
              color={GOLD_THEME.TEXT.PRIMARY}
              style={{ opacity: 0.3 }}
            />
            <ThemedText style={styles.emptyTitle}>결제 내역이 없습니다</ThemedText>
            <ThemedText style={styles.emptyText}>
              프리미엄 구독을 시작하면 결제 내역이 표시됩니다.
            </ThemedText>
          </View>
        )}

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>총 결제 금액</ThemedText>
            <ThemedText style={styles.totalAmount}>
              {mockHistory.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
            </ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>총 발급 예측권</ThemedText>
            <ThemedText style={styles.totalTickets}>
              {mockHistory.reduce((sum, item) => sum + item.ticketsIssued, 0)}장
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 28,
  },
  historyList: {
    padding: 16,
    gap: 16,
  },
  historyCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  historyBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  infoLabel: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 20,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 26,
  },
  emptyText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  totalSection: {
    margin: 16,
    padding: 20,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 12,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    lineHeight: 24,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    lineHeight: 28,
  },
  totalTickets: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    lineHeight: 28,
  },
});
