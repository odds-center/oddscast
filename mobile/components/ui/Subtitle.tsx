import { ThemedText, ThemedTextProps } from '@/components/ThemedText';
import React from 'react';

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
