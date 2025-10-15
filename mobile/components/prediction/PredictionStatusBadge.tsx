import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  hasViewed: boolean;
  isUpdated: boolean;
}

/**
 * AI 예측 상태 뱃지
 *
 * - 🆕 업데이트됨: 예측이 업데이트됨 (재구매 유도)
 * - ✅ 확인함: 이미 봤음
 * - 🤖 AI 예측: 아직 안 봤음
 */
export function PredictionStatusBadge({ hasViewed, isUpdated }: Props) {
  if (isUpdated) {
    return (
      <View style={[styles.badge, styles.updated]}>
        <Ionicons name='sparkles' size={14} color='#FFF' />
        <Text style={styles.badgeText}>업데이트됨</Text>
      </View>
    );
  }

  if (hasViewed) {
    return (
      <View style={[styles.badge, styles.viewed]}>
        <Ionicons name='checkmark-circle' size={14} color='#4CAF50' />
        <Text style={[styles.badgeText, { color: '#4CAF50' }]}>확인함</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.new]}>
      <Ionicons name='star' size={14} color='#FFD700' />
      <Text style={[styles.badgeText, { color: '#FFD700' }]}>AI 예측</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  updated: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  viewed: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
  },
  new: {
    backgroundColor: 'transparent',
    borderColor: '#FFD700',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});
