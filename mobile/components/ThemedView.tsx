import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'card' | 'border';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  let backgroundColor;

  if (variant === 'card') {
    backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  } else if (variant === 'border') {
    backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'icon');
  } else {
    backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
