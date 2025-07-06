import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';

export const loadFonts = () => {
  return useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });
};

export const theme = {
  colors: {
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
};
