import { GlobalModal } from '@/components/common/GlobalModal';
import { AuthGuard } from '@/components/common/AuthGuard';
import { useLoadFonts } from '@/constants/theme';
import { AlertProvider } from '@/context/AlertProvider';
import { AppThemeProvider } from '@/context/AppThemeProvider';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { queryClient } from '@/lib/queryClient';
import { initMockServer } from '@/mocks/init';
import { store } from '@/store';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Mock 서버 초기화 (개발 모드에서만)
if (__DEV__) {
  try {
    initMockServer();
  } catch (error) {
    console.warn('MSW 초기화 실패:', error);
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, loading: colorSchemeLoading } = useColorScheme();
  const [loaded] = useLoadFonts();

  useEffect(() => {
    if (loaded && !colorSchemeLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, colorSchemeLoading]);

  if (!loaded || colorSchemeLoading) {
    return null; // Or a custom loading component
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <AuthGuard>
                <AuthNavigator />
              </AuthGuard>
              <StatusBar style='auto' />
              <GlobalModal />
            </AuthProvider>
          </AlertProvider>
        </AppThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AuthNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // 로딩 중에는 아무것도 렌더링하지 않음
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='(app)' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen name='ranking' options={{ headerShown: false }} />
      <Stack.Screen name='race-detail' options={{ headerShown: false }} />
      <Stack.Screen name='betting-register' options={{ headerShown: false }} />
      <Stack.Screen name='prediction' options={{ headerShown: false }} />
      <Stack.Screen name='+not-found' />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </Provider>
  );
}
