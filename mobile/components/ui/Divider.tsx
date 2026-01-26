import React from 'react';
import { View } from 'react-native';
import { Colors, Spacing } from '@/constants/designTokens';

interface DividerProps {
  spacing?: number;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  spacing = Spacing.md,
  color = Colors.border.primary,
}) => {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: color,
        marginVertical: spacing,
      }}
    />
  );
};
