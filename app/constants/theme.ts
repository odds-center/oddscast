import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { useColorScheme } from '@/hooks/useColorScheme';

export const useLoadFonts = () => {
  return useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });
};

const tintColorLight = '#FFD700'; // Gold
const tintColorDark = '#FFD700'; // Gold

const Colors = {
  light: {
    background: '#FFFFFF',
    primary: '#FFD700', // Gold
    secondary: '#E0E0E0', // Light Gray
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#1A1A1A', // Dark Gray for text on light background
    textSecondary: '#666666',
    textTertiary: '#999999',
    card: '#F0F0F0',
    cardSecondary: '#E8E8E8',
    border: '#D0D0D0',
    borderLight: '#E0E0E0',
    overlay: 'rgba(255, 255, 255, 0.7)',
    gradient: {
      primary: ['#FFD700', '#FFA500'],
      secondary: ['#E0E0E0', '#D0D0D0'],
      card: ['#F0F0F0', '#E8E8E8'],
      background: ['#FFFFFF', '#F8F8F8'],
    },
  },
  dark: {
    background: '#0A0A0A',
    primary: '#FFD700', // Gold
    secondary: '#1E3A2F', // Dark Green
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    card: '#1A1A1A',
    cardSecondary: '#2A2A2A',
    border: '#333333',
    borderLight: '#404040',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradient: {
      primary: ['#FFD700', '#FFA500'],
      secondary: ['#1E3A2F', '#2D5A3F'],
      card: ['#1A1A1A', '#2A2A2A'],
      background: ['#0A0A0A', '#1A1A1A'],
    },
  },
};

export const theme = {
  globalTextStyle: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    allowFontScaling: false,
  },
  colors: Colors.light, // Default to light mode colors
  fonts: {
    heading: 'PlayfairDisplay_700Bold',
    body: 'Lato_400Regular',
    bold: 'Lato_700Bold',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 50,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 8.84,
      elevation: 12,
    },
  },
  commonStyles: {
    container: {
      flex: 1,
      padding: 16,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    flex1: {
      flex: 1,
    },
  },
};

// Dynamically set colors based on current color scheme
export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  return {
    ...theme,
    colors: Colors[colorScheme ?? 'light'],
  };
};
