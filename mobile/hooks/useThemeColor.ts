/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from '@/hooks/useColorScheme';

// Define Colors object inline to match theme.ts
const Colors = {
  light: {
    text: '#11181C',
    background: '#F5F5F5',
    tint: '#B48A3C',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#B48A3C',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0C0C0C', // 검정 배경
    tint: '#FFD700', // 진한 골드
    icon: '#9BA1A6', // 회색
    tabIconDefault: '#9BA1A6', // 회색
    tabIconSelected: '#FFD700', // 진한 골드
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  try {
    const colorSchemeResult = useColorScheme();
    const theme = colorSchemeResult?.colorScheme ?? 'dark';
    const colorFromProps = props[theme as 'light' | 'dark'];

    if (colorFromProps) {
      return colorFromProps;
    } else {
      return Colors[theme as 'light' | 'dark'][colorName];
    }
  } catch (error) {
    console.warn('Error in useThemeColor:', error);
    // Return a safe fallback color
    return props.dark || props.light || '#FFFFFF';
  }
}
