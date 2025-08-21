import { useThemeColor } from '../hooks/useThemeColor';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'subtitle'
    | 'defaultSemiBold'
    | 'link'
    | 'stat'
    | 'caption'
    | 'largeTitle'
    | 'body'
    | 'small';
};

export function ThemedText(props: ThemedTextProps = {}) {
  const { style, lightColor, darkColor, type = 'default', ...rest } = props;

  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // type별 색상 지정
  let textColor = color;
  const tintColor = useThemeColor({}, 'tint');
  if (type === 'link') {
    textColor = tintColor;
  }

  return (
    <Text
      style={[
        { color: textColor },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'stat' ? styles.stat : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'largeTitle' ? styles.largeTitle : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'small' ? styles.small : undefined,
        style,
      ]}
      numberOfLines={undefined}
      ellipsizeMode='tail'
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  largeTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  stat: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
