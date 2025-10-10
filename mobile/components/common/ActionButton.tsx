import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: any;
}

/**
 * 액션 버튼 컴포넌트
 */
export function ActionButton({ title, onPress, variant = 'primary', style }: ActionButtonProps) {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;

  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress} activeOpacity={0.8}>
      <ThemedText style={textStyle}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    backgroundColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
});
