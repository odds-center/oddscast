import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePredictions } from '@/lib/hooks/usePredictions';

/**
 * 예측권 잔액 Badge
 *
 * 홈 화면 상단에 표시되는 예측권 잔액
 */
export function TicketBadge() {
  const router = useRouter();
  const { availableTickets, hasTickets } = usePredictions();

  const handlePress = () => {
    if (hasTickets) {
      router.push('/mypage/subscription/manage');
    } else {
      router.push('/mypage/subscription/plans');
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.badge, !hasTickets && styles.badgeEmpty]}>
        <Ionicons name='ticket' size={16} color={hasTickets ? '#FFD700' : '#999'} />
        <ThemedText style={[styles.text, !hasTickets && styles.textEmpty]}>
          {availableTickets}장
        </ThemedText>
      </View>

      {!hasTickets && <View style={styles.warningDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeEmpty: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  textEmpty: {
    color: '#999',
  },
  warningDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF4444',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
});
