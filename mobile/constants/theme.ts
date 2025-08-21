import { useColorScheme } from '../hooks/useColorScheme';
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
    background: '#F8F6F0', // Warm cream background
    primary: '#D4AF37', // Rich gold
    secondary: '#E8E0D0', // Warm light gray
    accent: '#B8860B', // Dark goldenrod accent
    success: '#7FB069', // Muted green
    warning: '#E6A23C', // Warm orange
    error: '#E74C3C', // Muted red
    text: '#2C2C2C', // Dark charcoal for better contrast
    textSecondary: '#5A5A5A', // Medium gray
    textTertiary: '#8A8A8A', // Light gray
    white: '#FFFFFF',
    card: '#FFFFFF',
    cardSecondary: '#F5F2ED', // Warm off-white
    border: '#D4C8B8', // Warm border
    borderLight: '#E8E0D0', // Light warm border
    overlay: 'rgba(248, 246, 240, 0.8)', // Warm overlay
    gradient: {
      primary: ['#D4AF37', '#B8860B'],
      secondary: ['#E8E0D0', '#D4C8B8'],
      card: ['#FFFFFF', '#F5F2ED'],
      background: ['#F8F6F0', '#F0ECE0'],
    },
  },
  dark: {
    background: '#1A1A1A', // Dark charcoal
    primary: '#FFD700', // Bright gold
    secondary: '#2A2A2A', // Dark gray
    accent: '#DAA520', // Goldenrod accent
    success: '#7FB069', // Muted green
    warning: '#E6A23C', // Warm orange
    error: '#E74C3C', // Muted red
    text: '#F5F5F5', // Off-white for better readability
    textSecondary: '#C0C0C0', // Light gray
    textTertiary: '#A0A0A0', // Medium gray
    white: '#FFFFFF',
    card: '#2A2A2A',
    cardSecondary: '#333333',
    border: '#404040',
    borderLight: '#505050',
    overlay: 'rgba(26, 26, 26, 0.8)', // Dark overlay
    gradient: {
      primary: ['#FFD700', '#DAA520'],
      secondary: ['#2A2A2A', '#333333'],
      card: ['#2A2A2A', '#333333'],
      background: ['#1A1A1A', '#2A2A2A'],
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
