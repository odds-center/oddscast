import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography } from '@/constants/designTokens';

interface TypographyProps extends TextProps {
  variant?: keyof typeof Typography;
  color?: string;
}

export const StyledText: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  style,
  ...props
}) => {
  return <Text style={[Typography[variant], color && { color }, style]} {...props} />;
};
