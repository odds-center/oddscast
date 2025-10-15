import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePredictionStatus } from '@/hooks/usePredictionStatus';
import { Card, Button, LoadingSpinner, InfoBanner } from '@/components/ui';
import { PredictionStatusBadge } from './PredictionStatusBadge';

interface Props {
  raceId: string;
  onUnlock: () => void;
}

/**
 * AI 예측 미리보기 컴포넌트
 *
 * - 예측 있음/없음 표시
 * - 업데이트 여부 표시 (🆕 뱃지)
 * - 이미 봤는지 표시 (✅ 뱃지)
 * - 예측권 사용 버튼
 */
export function AIPredictionPreview({ raceId, onUnlock }: Props) {
  const { data: preview, isLoading } = usePredictionStatus(raceId);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mock balance for now
  const balance = { availableTickets: 5 };

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }

  if (!preview?.hasPrediction) {
    return (
      <InfoBanner
        icon='time'
        message='AI 예측이 아직 생성되지 않았습니다. 경주 시작 전에 확인해주세요.'
      />
    );
  }

  const handleUnlockPress = () => {
    if (!balance || balance.availableTickets === 0) {
      Alert.alert('예측권 없음', '예측권이 부족합니다. 구독하거나 개별 구매해주세요.', [
        { text: '취소', style: 'cancel' },
        {
          text: '구매하기',
          onPress: () => {
            /* Navigate to purchase */
          },
        },
      ]);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onUnlock();
  };

  return (
    <Card>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name='sparkles' size={20} color='#FFD700' />
          <Text style={styles.title}>AI 예측</Text>
        </View>
        <PredictionStatusBadge hasViewed={preview.hasViewed} isUpdated={preview.isUpdated} />
      </View>

      {/* 신뢰도 */}
      {preview.confidence && (
        <View style={styles.confidenceRow}>
          <Text style={styles.label}>신뢰도</Text>
          <Text style={styles.confidence}>{(preview.confidence * 100).toFixed(1)}%</Text>
        </View>
      )}

      {/* 블러 처리된 미리보기 */}
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.blurContent}>
          <Text style={styles.blurText}>🥇 1위 예상: ████████</Text>
          <Text style={styles.blurText}>🥈 2위 예상: ████████</Text>
          <Text style={styles.blurText}>🥉 3위 예상: ████████</Text>
          <Text style={styles.blurText}>📊 추천 베팅: ████████</Text>
        </View>
      </BlurView>

      {/* 메시지 */}
      {preview.isUpdated && (
        <InfoBanner
          icon='information-circle'
          message='🆕 AI 예측이 업데이트되었습니다! 최신 예측을 확인하세요.'
        />
      )}

      {preview.hasViewed && !preview.isUpdated && (
        <Text style={styles.viewedMessage}>
          ✅ 이미 확인한 예측입니다. 업데이트가 있으면 알려드립니다.
        </Text>
      )}

      {/* 예측권 사용 버튼 */}
      <Button
        onPress={handleUnlockPress}
        title={
          preview.isUpdated
            ? '🆕 최신 AI 예측 보기'
            : preview.hasViewed
            ? '다시 보기 (예측권 1장)'
            : 'AI 예측 전체 보기'
        }
      />

      {/* 예측권 잔액 */}
      <View style={styles.ticketInfo}>
        <Ionicons name='ticket' size={16} color='#888' />
        <Text style={styles.ticketText}>남은 예측권: {balance?.availableTickets || 0}장</Text>
      </View>

      {/* 확인 다이얼로그 */}
      {showConfirm && (
        <ConfirmDialog
          message={
            preview.isUpdated
              ? '예측권 1장을 사용하여 최신 AI 예측을 확인하시겠습니까?'
              : preview.hasViewed
              ? '이미 확인한 예측입니다. 예측권 1장을 사용하여 다시 보시겠습니까?'
              : '예측권 1장을 사용하여 AI 예측을 확인하시겠습니까?'
          }
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </Card>
  );
}

// 간단한 확인 다이얼로그
function ConfirmDialog({ message, onConfirm, onCancel }: any) {
  return (
    <View style={styles.dialog}>
      <Text style={styles.dialogMessage}>{message}</Text>
      <View style={styles.dialogButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  confidence: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  blurContent: {
    padding: 20,
    gap: 12,
  },
  blurText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  viewedMessage: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  ticketText: {
    fontSize: 14,
    color: '#888',
  },
  dialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
