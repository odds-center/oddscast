import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { StyledText } from './StyledText';
import { Colors, Spacing, Typography } from '@/constants/designTokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <StyledText variant='h4'>{title}</StyledText>
        {subtitle && (
          <StyledText variant='caption' style={{ marginTop: Spacing.xxs }}>
            {subtitle}
          </StyledText>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text
            style={[
              Typography.bodySmall,
              {
                color: Colors.primary.main,
                fontWeight: '600',
              },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
