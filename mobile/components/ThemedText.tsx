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
        {
          color: textColor,
          backgroundColor: 'transparent',
          textShadowColor: 'transparent',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 0,
          elevation: 0, // Android에서 그림자 제거
          shadowOpacity: 0, // iOS에서 그림자 제거
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
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
      allowFontScaling={false}
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
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  largeTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  stat: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
