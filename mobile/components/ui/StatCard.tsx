import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

interface StatCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'highlight';
  style?: ViewStyle;
}

/**
 * 통계 표시 카드 컴포넌트
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.container, styles[variant], style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={variant === 'highlight' ? GOLD_THEME.GOLD.LIGHT : GOLD_THEME.TEXT.SECONDARY}
          />
        </View>
      )}
      <ThemedText type='stat' style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText type='caption' style={styles.label}>
        {label}
      </ThemedText>
      {subValue && (
        <ThemedText type='caption' style={styles.subValue}>
          {subValue}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minWidth: 100,
  },
  default: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
  },
  highlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
  },
  label: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.8,
  },
  subValue: {
    color: GOLD_THEME.TEXT.TERTIARY,
    marginTop: 4,
    fontSize: 11,
  },
});

