import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppThemeContext } from '@/context/AppThemeProvider';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'defaultSemiBold' | 'link' | 'stat' | 'caption';
};

export function ThemedText(props: ThemedTextProps = {}) {
  const safeProps = props || {};
  const { style, lightColor, darkColor, type = 'default', ...rest } = safeProps;

  // Safe fallback values
  const fallbackTheme = {
    colors: {
      text: '#FFFFFF',
      textSecondary: '#9BA1A6',
      textTertiary: '#687076',
    },
    fonts: {
      body: 'System',
      bold: 'System',
      heading: 'System',
    },
    globalTextStyle: {
      includeFontPadding: false,
      textAlignVertical: 'center',
      allowFontScaling: false,
    },
  };

  const themeResult = useAppThemeContext();
  const { colors, fonts, globalTextStyle } = themeResult || fallbackTheme;

  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // type별 색상 직접 지정
  let textColor = color;
  if (type === 'link') {
    textColor = '#0a7ea4';
  }

  return (
    <Text
      style={[
        globalTextStyle as any,
        { color: textColor, flexShrink: 1 },
        type === 'default' ? styles(fonts).default : undefined,
        type === 'title' ? styles(fonts).title : undefined,
        type === 'subtitle' ? styles(fonts).subtitle : undefined,
        type === 'defaultSemiBold' ? styles(fonts).defaultSemiBold : undefined,
        type === 'link' ? styles(fonts).link : undefined,
        type === 'stat' ? styles(fonts).stat : undefined,
        type === 'caption' ? styles(fonts).caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = (fonts: any) =>
  StyleSheet.create({
    default: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
    },
    defaultSemiBold: {
      fontFamily: fonts.bold,
      fontSize: 14,
      lineHeight: 20,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 28,
      lineHeight: 36,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
    },
    link: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
    },
    stat: {
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 24,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
    },
  });
