import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * 재사용 가능한 Button 컴포넌트
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? GOLD_THEME.TEXT.PRIMARY
      : variant === 'secondary'
      ? GOLD_THEME.TEXT.PRIMARY
      : GOLD_THEME.GOLD.LIGHT;

  const iconColor =
    variant === 'primary' || variant === 'danger' ? GOLD_THEME.TEXT.PRIMARY : GOLD_THEME.GOLD.LIGHT;

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size='small' />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <ThemedText
            style={[styles.buttonText, styles[`${size}Text`], { color: textColor }, textStyle]}
          >
            {title}
          </ThemedText>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  // Variants
  primary: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },
  secondary: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
  danger: {
    backgroundColor: '#E74C3C',
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  // Text sizes
  smallText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediumText: {
    fontSize: 16,
    fontWeight: '700',
  },
  largeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  buttonText: {
    // 기본 텍스트 스타일은 사이즈별로 적용
  },
});
