import { GlobalModal } from '@/components/common/GlobalModal';
import { useLoadFonts } from '@/constants/theme';
import { AlertProvider } from '@/context/AlertProvider';
import { AppThemeProvider } from '@/context/AppThemeProvider';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { queryClient } from '@/lib/queryClient';
import { store } from '@/store';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, loading: colorSchemeLoading } = useColorScheme();
  const [loaded] = useLoadFonts();
  const { user, isLoading: authLoading } = useAuth();

  // 디버깅을 위한 로그
  console.log('RootLayoutNav state:', {
    user: user?.email,
    authLoading,
    colorSchemeLoading,
    loaded,
    shouldShowAuth: !user,
    shouldShowApp: !!user,
  });

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
          <GlobalModal />
        </AlertProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}
