import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BenefitItemProps {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
}

/**
 * 혜택 아이템 컴포넌트
 */
export function BenefitItem({ text, icon = 'checkmark-circle', iconSize = 20 }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={iconSize} color={GOLD_THEME.TEXT.SECONDARY} />
      <ThemedText style={styles.benefitText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  benefitText: {
    fontSize: 16,
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
});
