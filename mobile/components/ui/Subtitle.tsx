import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

export const Subtitle = (props: ThemedTextProps) => {
  return (
    <ThemedText
      type='subtitle'
      lightColor='#687076'
      darkColor='#9BA1A6'
      style={props.style}
      {...props}
    />
  );
};
