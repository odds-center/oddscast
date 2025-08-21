import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

export const Title = (props: ThemedTextProps) => {
  return (
    <ThemedText
      type='title'
      style={[{ marginBottom: 8 }, props.style] as StyleProp<TextStyle>}
      {...props}
    />
  );
};
