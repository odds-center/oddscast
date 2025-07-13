import { useColorScheme } from '@/hooks/useColorScheme';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold, useFonts } from '@expo-google-fonts/playfair-display';

export const useLoadFonts = () => {
  return useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });
};

const Colors = {
  light: {
    background: '#F5F5F5',
    primary: '#B48A3C', // Gold
    secondary: '#E0E0E0', // Light Gray
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#11181C', // Dark Gray for text on light background
    textSecondary: '#687076',
    textTertiary: '#9BA1A6',
    card: '#FFFFFF',
    cardSecondary: '#F8F8F8',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    overlay: 'rgba(255, 255, 255, 0.7)',
    gradient: {
      primary: ['#B48A3C', '#E5C99C'],
      secondary: ['#E0E0E0', '#D0D0D0'],
      card: ['#FFFFFF', '#F8F8F8'],
      background: ['#F5F5F5', '#FFFFFF'],
    },
  },
  dark: {
    background: '#0C2A1E',
    primary: '#E5C99C', // Gold
    secondary: '#000000FF', // Dark Green
    accent: '#FF6B35', // Orange
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    text: '#FFFFFF',
    textSecondary: '#9BA1A6',
    textTertiary: '#687076',
    card: '#1A1A1A',
    cardSecondary: '#2A2A2A',
    border: '#333333',
    borderLight: '#404040',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradient: {
      primary: ['#E5C99C', '#B48A3C'],
      secondary: ['#1E3A2F', '#2D5A3F'],
      card: ['#1A1A1A', '#2A2A2A'],
      background: ['#0C2A1E', '#1A1A1A'],
    },
  },
};

export const theme = {
  globalTextStyle: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    allowFontScaling: false,
  },
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
  // Safe fallback theme
  const fallbackTheme = {
    ...theme,
    colors: Colors.dark,
  };

  try {
    const colorSchemeResult = useColorScheme();

    // Ensure we have a valid result
    if (!colorSchemeResult) {
      console.warn('useColorScheme returned undefined, using fallback theme');
      return fallbackTheme;
    }

    const { colorScheme, loading } = colorSchemeResult;

    // Always use a valid color scheme, defaulting to dark if invalid
    // Don't wait for loading to complete, use current colorScheme immediately
    const currentColorScheme =
      colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : 'dark';

    return {
      ...theme, // Spread the static theme properties
      colors: Colors[currentColorScheme], // Dynamically assign the correct colors
    };
  } catch (error) {
    console.warn('Error in useAppTheme:', error);
    return fallbackTheme;
  }
};
