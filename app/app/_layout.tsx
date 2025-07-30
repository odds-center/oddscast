import { useLoadFonts } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { AppThemeProvider } from '@/context/AppThemeProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, loading: colorSchemeLoading } = useColorScheme();
  const [loaded] = useLoadFonts();
  const { session, loading: authLoading } = useAuth();

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
        <Stack screenOptions={{ headerShown: false }}>
          {session ? (
            <Stack.Screen name='(app)' options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name='(auth)' options={{ headerShown: false }} />
          )}
          <Stack.Screen name='+not-found' />
        </Stack>
        <StatusBar style='auto' />
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
