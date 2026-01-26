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
  const backgroundColorFromProps = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === 'border' ? 'icon' : 'background',
  );

  const backgroundColor = backgroundColorFromProps;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
