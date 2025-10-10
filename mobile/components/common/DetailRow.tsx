import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';

interface DetailRowProps {
  label: string;
  value: string;
  valueStyle?: any;
}

/**
 * 상세 정보 행 컴포넌트
 */
export function DetailRow({ label, value, valueStyle }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={[styles.detailValue, valueStyle]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  detailLabel: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
});
