/**
 * App config — replaces expo-constants. Reads from env or defaults.
 */
import { Platform } from 'react-native';

const ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const isDev = __DEV__;

export const config = {
  env: ENV,
  webappUrl:
    isDev && Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : isDev && Platform.OS === 'ios'
        ? 'http://localhost:3000'
        : (process.env.EXPO_PUBLIC_WEBAPP_URL as string | undefined) ||
          'https://gold-race-webapp.vercel.app',
  apiBaseUrl:
    isDev && Platform.OS === 'android'
      ? 'http://10.0.2.2:3001/api'
      : isDev && Platform.OS === 'ios'
        ? 'http://localhost:3001/api'
        : (process.env.EXPO_PUBLIC_API_URL as string | undefined) || '',
};
