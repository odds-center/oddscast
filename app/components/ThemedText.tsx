import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { theme } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'defaultSemiBold' | 'link' | 'stat' | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // type별 색상 직접 지정
  let textColor = color;
  if (type === 'subtitle' || type === 'caption') {
    textColor = theme.colors.textSecondary;
  } else if (type === 'link') {
    textColor = '#0a7ea4';
  }

  return (
    <Text
      style={[
        theme.globalTextStyle as any,
        { color: textColor, flexShrink: 1 },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'stat' ? styles.stat : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  stat: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  caption: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
});
