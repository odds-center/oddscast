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
    background: '#1A3A2E', // 더 밝은 다크 배경색으로 변경
    tint: '#E5C99C',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#E5C99C',
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
