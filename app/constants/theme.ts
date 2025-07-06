
import {
  useFonts,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
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
    background: '#121212',
    primary: '#D4AF37', // Gold
    secondary: '#1E3A2F', // Dark Green
    text: '#EAEAEA',
    subtleText: '#A0A0A0',
    card: '#1A1A1A',
    border: '#2A2A2A',
    accent: '#E5C99C',
  },
  fonts: {
    heading: 'PlayfairDisplay_700Bold',
    body: 'Lato_400Regular',
    bold: 'Lato_700Bold',
  },
  gradients: {
    card: ['#1A1A1A', '#121212'],
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
  },
  radii: {
    s: 4,
    m: 10,
    l: 25,
  },
};
