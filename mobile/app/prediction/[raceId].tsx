import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { useQuery } from '@tanstack/react-query';
import { predictionsApi } from '@/lib/api/predictions';
import { Section, Card, Button, LoadingSpinner, InfoBanner } from '@/components/ui';
import { ThemedText } from '@/components/ThemedText';
import { showSuccessMessage, showErrorMessage, showConfirmMessage } from '@/utils/alert';

/**
 * AI 예측 화면 (예측권 필수)
 */
export default function PredictionRequestScreen() {
  const router = useRouter();
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const { hasTickets, availableTickets } = usePredictions();
  const [prediction, setPrediction] = useState<any>(null);

  // 예측 미리보기 (예측권 없어도 가능)
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['prediction-preview', raceId],
    queryFn: () => predictionsApi.getPreview(raceId as string),
    enabled: !!raceId && !prediction,
  });

  const handleUsePredictionTicket = async () => {
    if (!hasTickets) {
      showConfirmMessage(
        '예측권을 사용하여 AI 예측을 확인하세요.\n\n개별 구매 (₩1,100) 또는 구독을 선택하세요.',
        '예측권 필요',
        () => router.push('/mypage/purchase/single'), // 개별 구매로 이동
        () => {} // 취소
      );
      return;
    }

    showConfirmMessage(
      `예측권 1장을 사용하여 AI 예측을 확인하시겠습니까?\n\n보유 예측권: ${availableTickets}장`,
      '예측권 사용',
      async () => {
        try {
          // 예측권 사용하여 전체 예측 조회
          const response = await predictionsApi.getByRaceId(raceId as string);
          setPrediction(response);
          showSuccessMessage('예측권 1장이 사용되었습니다.', '예측권 사용 완료');
        } catch (error: any) {
          if (error.code === 'TICKET_REQUIRED') {
            showErrorMessage('예측권이 필요합니다. 구독하거나 개별 구매해주세요.', '예측권 필요');
          } else {
            showErrorMessage(error.message || 'AI 예측 조회에 실패했습니다.', '오류');
          }
        }
      }
    );
  };

  if (previewLoading) {
    return <LoadingSpinner message='예측 정보를 불러오는 중...' />;
  }

  // 예측권 사용 완료 - 전체 예측 표시
  if (prediction) {
    return (
      <ScrollView style={styles.container}>
        <Section>
          <InfoBanner
            icon='checkmark-circle'
            message='예측권이 사용되었습니다. AI 예측 결과를 확인하세요.'
          />
        </Section>

        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>🤖 AI 예측 결과</Text>
            <View style={styles.usedBadge}>
              <Text style={styles.usedBadgeText}>✅ 사용완료</Text>
            </View>
          </View>

          <View style={styles.predictions}>
            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥇 1위</Text>
              <Text style={styles.horseNumber}>{prediction.predictedFirst}번</Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥈 2위</Text>
              <Text style={styles.horseNumber}>{prediction.predictedSecond}번</Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥉 3위</Text>
              <Text style={styles.horseNumber}>{prediction.predictedThird}번</Text>
            </View>
          </View>

          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>신뢰도</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${prediction.confidence}%` }]} />
            </View>
            <Text style={styles.confidenceValue}>{prediction.confidence.toFixed(1)}%</Text>
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.analysisTitle}>📊 상세 분석</Text>
            <Text style={styles.analysisText}>{prediction.analysis}</Text>
          </View>

          {prediction.warnings && prediction.warnings.length > 0 && (
            <View style={styles.warningsSection}>
              <Text style={styles.warningsTitle}>⚠️ 주의사항</Text>
              {prediction.warnings.map((warning: string, index: number) => (
                <Text key={index} style={styles.warningText}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}
        </Card>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠️ 면책 공지</Text>
          <Text style={styles.disclaimerText}>
            본 예측은 AI 기반 참고 자료이며, 실제 결과와 다를 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // 미리보기 - 블러 처리 (예측권 필요)
  if (preview && preview.hasPrediction) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.blurContainer}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>🤖 AI 예측 결과</Text>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>🔒 잠김</Text>
              </View>
            </View>

            {/* 블러 처리된 내용 */}
            <BlurView intensity={80} style={styles.blurredContent} tint='light'>
              <View style={styles.predictions}>
                <View style={styles.predictionItem}>
                  <Text style={styles.rank}>🥇 1위</Text>
                  <Text style={styles.horseNumber}>?번</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={styles.rank}>🥈 2위</Text>
                  <Text style={styles.horseNumber}>?번</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={styles.rank}>🥉 3위</Text>
                  <Text style={styles.horseNumber}>?번</Text>
                </View>
              </View>

              {preview.confidence && (
                <View style={styles.confidenceSection}>
                  <Text style={styles.confidenceLabel}>신뢰도</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${preview.confidence}%` }]} />
                  </View>
                  <Text style={styles.confidenceValue}>{preview.confidence.toFixed(1)}%</Text>
                </View>
              )}

              <View style={styles.analysisSection}>
                <Text style={styles.analysisTitle}>📊 상세 분석</Text>
                <Text style={styles.analysisText}>••••••••••••••••••••</Text>
                <Text style={styles.analysisText}>••••••••••••••••••••</Text>
              </View>
            </BlurView>

            {/* 예측권 사용 오버레이 */}
            <View style={styles.unlockOverlay}>
              <Text style={styles.unlockIcon}>🔓</Text>
              <Text style={styles.unlockTitle}>예측권으로 잠금 해제</Text>
              <Text style={styles.unlockMessage}>{preview.message}</Text>

              <View style={styles.ticketInfoBox}>
                <Text style={styles.ticketInfoLabel}>보유 예측권</Text>
                <Text style={styles.ticketInfoValue}>{availableTickets}장</Text>
              </View>

              <Button
                title={hasTickets ? '예측권 1장 사용하기' : '예측권 없음'}
                onPress={handleUsePredictionTicket}
                disabled={!hasTickets}
                variant='primary'
                size='large'
                icon='sparkles'
                style={{ marginBottom: 12 }}
              />

              {!hasTickets && (
                <View style={styles.purchaseButtons}>
                  <Button
                    title='개별 구매 ₩1,100'
                    onPress={() => router.push('/mypage/purchase/single')}
                    variant='secondary'
                    size='medium'
                    style={{ flex: 1 }}
                  />
                  <Button
                    title='구독하기'
                    onPress={() => router.push('/mypage/subscription/plans')}
                    variant='primary'
                    size='medium'
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 예측권이란?</Text>
          <Text style={styles.infoText}>• 개별 구매: ₩1,100/장</Text>
          <Text style={styles.infoText}>• 라이트 플랜: ₩9,900 (10+1장)</Text>
          <Text style={styles.infoText}>• 프리미엄 플랜: ₩19,800 (20+4장)</Text>
          <Text style={styles.infoHighlight}>구독하면 최대 54% 할인!</Text>
        </View>
      </ScrollView>
    );
  }

  // 예측 생성 대기 중
  return (
    <ScrollView style={styles.container}>
      <Section>
        <Card style={styles.pendingSection}>
          <LoadingSpinner />
          <ThemedText type='title' style={styles.pendingTitle}>
            AI 예측 생성 중
          </ThemedText>
          <ThemedText style={styles.pendingText}>
            배치 예측 시스템이 경주 시작 전에 자동으로 예측을 생성합니다.
          </ThemedText>
          <ThemedText type='caption' style={styles.pendingSubtext}>
            잠시 후 다시 확인해주세요.
          </ThemedText>
        </Card>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  usedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lockBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  predictions: {
    marginBottom: 20,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  horseNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right',
  },
  analysisSection: {
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  warningsSection: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4,
  },
  disclaimerCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  // 블러 화면
  blurContainer: {
    margin: 16,
  },
  blurredContent: {
    padding: 20,
  },
  unlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  unlockIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  unlockMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  ticketInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  ticketInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  ticketInfoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  unlockButtonDisabled: {
    backgroundColor: '#ccc',
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  purchaseButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  singleBuyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  singleBuyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subscribeButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  infoHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 8,
  },
  // 생성 대기 중
  pendingSection: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  pendingSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
