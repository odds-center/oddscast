import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Text } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/designTokens';

interface TabButtonProps extends TouchableOpacityProps {
  label: string;
  isActive: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, ...props }) => {
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: isActive ? Colors.primary.dark : 'transparent',
        alignItems: 'center',
      }}
      {...props}
    >
      <Text
        style={[
          Typography.button,
          {
            fontSize: 14,
            color: isActive ? Colors.text.primary : Colors.text.tertiary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
