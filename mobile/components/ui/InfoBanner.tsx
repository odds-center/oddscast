import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

interface InfoBannerProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/**
 * 정보성 배너 컴포넌트
 */
export const InfoBanner: React.FC<InfoBannerProps> = ({
  message,
  type = 'info',
  icon,
  style,
}) => {
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    switch (type) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return GOLD_THEME.GOLD.MEDIUM;
      case 'success':
        return GOLD_THEME.STATUS.SUCCESS;
      case 'error':
        return GOLD_THEME.STATUS.ERROR;
      default:
        return GOLD_THEME.TEXT.SECONDARY;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return 'rgba(218, 165, 32, 0.15)';
      case 'success':
        return 'rgba(255, 215, 0, 0.15)';
      case 'error':
        return 'rgba(184, 134, 11, 0.15)';
      default:
        return 'rgba(180, 138, 60, 0.15)';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <Ionicons name={getIconName()} size={20} color={getIconColor()} />
      <ThemedText style={styles.message}>{message}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  message: {
    flex: 1,
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
});

