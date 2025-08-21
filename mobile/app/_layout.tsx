import { useLoadFonts } from '@/constants/theme';
import { AppThemeProvider } from '@/context/AppThemeProvider';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { AlertProvider } from '@/context/AlertProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { queryClient } from '@/lib/queryClient';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, loading: colorSchemeLoading } = useColorScheme();
  const [loaded] = useLoadFonts();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (loaded && !authLoading && !colorSchemeLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authLoading, colorSchemeLoading]);

  if (!loaded || authLoading || colorSchemeLoading) {
    return null; // Or a custom loading component
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppThemeProvider>
        <AlertProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {user ? (
              <Stack.Screen name='(app)' options={{ headerShown: false }} />
            ) : (
              <Stack.Screen name='(auth)' options={{ headerShown: false }} />
            )}
            <Stack.Screen name='+not-found' />
          </Stack>
          <StatusBar style='auto' />
        </AlertProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
