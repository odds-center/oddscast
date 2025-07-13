import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorSchemeName = 'light' | 'dark' | null | undefined;

const COLOR_SCHEME_KEY = 'user-color-scheme';

export function useAppColorScheme() {
  // Safe initialization with fallback
  const initialColorScheme = (() => {
    try {
      return Appearance.getColorScheme() || 'dark';
    } catch (error) {
      console.warn('Failed to get initial color scheme:', error);
      return 'dark';
    }
  })();

  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(initialColorScheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadColorScheme = async () => {
      try {
        const storedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
        if (storedScheme) {
          setColorScheme(storedScheme as ColorSchemeName);
        } else {
          // If no stored scheme, use system preference
          setColorScheme(Appearance.getColorScheme() || 'dark');
        }
      } catch (e) {
        console.error('Failed to load color scheme from storage', e);
        setColorScheme(Appearance.getColorScheme() || 'dark');
      } finally {
        setLoading(false);
      }
    };

    loadColorScheme();

    // Safe listener setup
    let subscription: any;
    try {
      subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
        // Only update if no user preference is set, or if user preference matches system
        // This prevents system changes from overriding user's explicit choice
        AsyncStorage.getItem(COLOR_SCHEME_KEY)
          .then((storedScheme) => {
            if (!storedScheme || storedScheme === newColorScheme) {
              setColorScheme(newColorScheme);
            }
          })
          .catch(() => {
            // Ignore AsyncStorage errors in listener
          });
      });
    } catch (error) {
      console.warn('Failed to add appearance change listener:', error);
    }

    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.warn('Failed to remove appearance change listener:', error);
      }
    };
  }, []);

  const setAppColorScheme = async (scheme: 'light' | 'dark') => {
    // Immediately update the state for instant UI feedback
    setColorScheme(scheme);
    setLoading(false);

    // Then save to storage in the background
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
    } catch (e) {
      console.error('Failed to save color scheme to storage', e);
      // Don't revert the state change even if storage fails
    }
  };

  return { colorScheme, setAppColorScheme, loading };
}
