import React from 'react';
import { View, ViewStyle, Text } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/designTokens';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style }) => {
  const effectiveVariant = variant === 'default' ? 'info' : variant;

  const backgroundColor = {
    success: `${Colors.status.success}20`,
    warning: `${Colors.status.warning}20`,
    error: `${Colors.status.error}20`,
    info: `${Colors.status.info}20`,
  }[effectiveVariant];

  const textColor = {
    success: Colors.status.success,
    warning: Colors.status.warning,
    error: Colors.status.error,
    info: Colors.status.info,
  }[effectiveVariant];

  return (
    <View
      style={[
        {
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xxs,
          borderRadius: BorderRadius.sm,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          Typography.caption,
          {
            color: textColor,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};
