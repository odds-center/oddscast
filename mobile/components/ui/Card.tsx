import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * 재사용 가능한 Card 컴포넌트
 *
 * 모든 화면에서 일관된 카드 스타일을 제공합니다.
 */
export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  return <View style={[styles.card, styles[variant], style]}>{children}</View>;
};

/**
 * Section 컴포넌트 (Card의 변형 - 더 큰 여백)
 */
export const Section: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  return <View style={[styles.card, styles[variant], styles.section, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  section: {
    marginBottom: 24,
  },
  default: {
    // 기본 스타일
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 2,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
});
