import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

export const Title = (props: ThemedTextProps) => {
  const { colors, spacing } = useAppTheme();
  return (
    <ThemedText
      type='title'
      style={
        [{ color: colors.text, marginBottom: spacing.xs }, props.style] as StyleProp<TextStyle>
      }
      {...props}
    />
  );
};
