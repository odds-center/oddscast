/**
 * App config — uses react-native-config for env-specific endpoints.
 *
 * Env files:
 *   .env       — local development (default)
 *   .env.dev   — dev/staging (Railway dev)
 *   .env.prod  — production  (Railway prod)
 *
 * Build with env:
 *   ENVFILE=.env.prod ./scripts/build-android.sh apk
 *   ENVFILE=.env.prod ./scripts/build-ios.sh archive
 *
 * Metro dev:
 *   ENVFILE=.env.dev pnpm start
 */
import Config from 'react-native-config';
import { Platform } from 'react-native';

const appEnv = Config.APP_ENV || 'local';
const isLocal = appEnv === 'local' || __DEV__;

// Local dev: Android emulator uses 10.0.2.2, iOS uses localhost
const localWebappUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const localApiUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3001/api'
    : 'http://localhost:3001/api';

export const config = {
  env: appEnv,

  webappUrl: isLocal
    ? localWebappUrl
    : Config.WEBAPP_URL || 'https://oddscast-webapp.up.railway.app',

  apiBaseUrl: isLocal
    ? localApiUrl
    : Config.API_URL || 'https://oddscast-server.up.railway.app/api',
};
