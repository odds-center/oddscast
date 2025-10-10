import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { GOLD_THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';

interface SubscriptionCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  style?: any;
}

/**
 * 구독 관련 카드 컴포넌트
 */
export function SubscriptionCard({ title, icon = 'card', children, style }: SubscriptionCardProps) {
  return (
    <ThemedView style={[styles.card, style]}>
      <ThemedView style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText type='title' style={styles.cardTitle}>
          {title}
        </ThemedText>
      </ThemedView>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 28,
    backgroundColor: 'transparent',
  },
});
