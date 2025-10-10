import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePredictions } from '@/lib/hooks/usePredictions';

/**
 * AI 예측 요청 화면
 */
export default function PredictionRequestScreen() {
  const router = useRouter();
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const { usePredictionTicket, hasTickets, availableTickets } = usePredictions();
  const [prediction, setPrediction] = useState<any>(null);

  const handleRequestPrediction = async () => {
    if (!hasTickets) {
      Alert.alert('예측권 없음', '사용 가능한 예측권이 없습니다.\n구독하거나 개별 구매해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '구독하기', onPress: () => router.push('/mypage/subscription/plans') },
        { text: '개별 구매', onPress: () => router.push('/mypage/purchase/single') },
      ]);
      return;
    }

    try {
      const result = await usePredictionTicket.mutateAsync(raceId);
      setPrediction(result.prediction);
    } catch (error: any) {
      Alert.alert('오류', error.message || 'AI 예측에 실패했습니다.');
    }
  };

  if (usePredictionTicket.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>AI가 예측 중입니다...</Text>
        <Text style={styles.loadingSubtext}>3-5초 정도 소요됩니다</Text>
      </View>
    );
  }

  if (prediction) {
    return (
      <ScrollView style={styles.container}>
        {/* 예측 결과 */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>🤖 AI 예측 결과</Text>
            <Text style={styles.resultModel}>{prediction.llmModel}</Text>
          </View>

          {/* 예측 순위 */}
          <View style={styles.predictions}>
            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥇 1위</Text>
              <Text style={styles.horseNumber}>{prediction.firstPlace}번</Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥈 2위</Text>
              <Text style={styles.horseNumber}>{prediction.secondPlace}번</Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.rank}>🥉 3위</Text>
              <Text style={styles.horseNumber}>{prediction.thirdPlace}번</Text>
            </View>
          </View>

          {/* 신뢰도 */}
          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>신뢰도</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${prediction.confidence}%` }]} />
            </View>
            <Text style={styles.confidenceValue}>{prediction.confidence.toFixed(1)}%</Text>
          </View>

          {/* 분석 내용 */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisTitle}>📊 상세 분석</Text>
            <Text style={styles.analysisText}>{prediction.analysis}</Text>
          </View>

          {/* 주의사항 */}
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

          {/* 메타 정보 */}
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>비용: ₩{prediction.llmCost}</Text>
            <Text style={styles.metaText}>응답 시간: {prediction.responseTime}ms</Text>
          </View>
        </View>

        {/* 법적 고지 */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚖️ 본 예측은 AI가 과거 데이터를 분석하여 제공하는 정보이며, 실제 경주 결과와 다를 수
            있습니다. 투자 결정은 본인의 책임하에 신중하게 하시기 바랍니다.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 예측 요청 전 */}
      <View style={styles.requestSection}>
        <Text style={styles.requestIcon}>🤖</Text>
        <Text style={styles.requestTitle}>AI 예측 요청</Text>
        <Text style={styles.requestText}>LLM AI가 과거 경주 데이터를 분석하여 예측합니다.</Text>

        {/* 예측권 정보 */}
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketInfoLabel}>보유 예측권</Text>
          <Text style={styles.ticketInfoValue}>{availableTickets}장</Text>
        </View>

        <TouchableOpacity style={styles.requestButton} onPress={handleRequestPrediction}>
          <Text style={styles.requestButtonText}>예측권 1장 사용하기</Text>
        </TouchableOpacity>

        {!hasTickets && (
          <View style={styles.noTicketNotice}>
            <Text style={styles.noTicketText}>예측권이 없습니다</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => router.push('/mypage/subscription/plans')}
            >
              <Text style={styles.buyButtonText}>구독하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  requestSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  requestIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  requestTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  requestText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  ticketInfo: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  ticketInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ticketInfoValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  requestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noTicketNotice: {
    marginTop: 24,
    alignItems: 'center',
  },
  noTicketText: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 12,
  },
  buyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultModel: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  predictions: {
    marginBottom: 20,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: '600',
  },
  horseNumber: {
    fontSize: 32,
    fontWeight: '700',
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
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
    textAlign: 'right',
  },
  analysisSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  warningsSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#856404',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  disclaimer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 32,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
