import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[size],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#B8860B',
          shadowColor: '#B8860B',
          shadowOpacity: 0.3,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(108, 117, 125, 0.3)',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#B8860B',
          shadowColor: '#B8860B',
          shadowOpacity: 0.3,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#B8860B',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...styles.text,
      ...styles[`${size}Text`],
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseTextStyle,
          color: '#B8860B',
        };
      default:
        return {
          ...baseTextStyle,
          color: '#FFFFFF',
        };
    }
  };

  const buttonStyle = getButtonStyle();
  const textStyleResult = getTextStyle();

  if (disabled) {
    buttonStyle.opacity = 0.5;
    buttonStyle.shadowOpacity = 0;
    buttonStyle.elevation = 0;
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {leftIcon && <>{leftIcon}</>}
      <ThemedText type='defaultSemiBold' style={[textStyleResult, textStyle]}>
        {title}
      </ThemedText>
      {rightIcon && <>{rightIcon}</>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Size variants
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  // Text styles
  text: {
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
