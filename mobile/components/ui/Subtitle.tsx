import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

export const Subtitle = (props: ThemedTextProps) => {
  const { colors } = useAppTheme();
  return (
    <ThemedText
      type='subtitle'
      style={[{ color: colors.textSecondary }, props.style] as StyleProp<TextStyle>}
      {...props}
    />
  );
};
