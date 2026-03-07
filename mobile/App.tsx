import React from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import IndexScreen from './src/screens/IndexScreen';
import WebAppScreen from './src/screens/WebAppScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import { config } from './src/config';

Sentry.init({
  dsn: 'https://35a10d9dc25050c604f1342b9125a0ba@o4511001126240256.ingest.us.sentry.io/4511001127157760',
  environment: config.env ?? 'local',
  tracesSampleRate: 0.1,
  enableNative: true,
});

const Stack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index" component={IndexScreen} />
      <Stack.Screen name="Webview" component={WebAppScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  );
}

function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar barStyle="auto" />
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
