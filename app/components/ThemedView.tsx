import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  // View의 drop-in replacement로, backgroundColor만 theme에서 가져오고 나머지는 그대로 전달
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
