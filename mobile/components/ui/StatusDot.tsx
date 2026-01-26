import React from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/designTokens';

interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info';
  size?: number;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8 }) => {
  const color = Colors.status[status];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
};
