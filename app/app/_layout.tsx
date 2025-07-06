import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isAuthenticated, isLoading } = useAuth();

  if (!loaded || isLoading) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {isAuthenticated ? (
          <Stack.Screen name='(app)' options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        )}
        <Stack.Screen name='+not-found' />
      </Stack>
      <StatusBar style='auto' />
    </ThemeProvider>
  );
}
