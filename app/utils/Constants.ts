import {
  getCurrentConfig,
  getPlatformConfig,
  isDevelopment,
  isStaging,
  isProduction,
} from '@/config/environment';

const config = getCurrentConfig();
const platformConfig = getPlatformConfig();

// Google OAuth 클라이언트 ID
export const WEB_GOOGLE_CLIENT_ID = config.google.webClientId;
export const IOS_GOOGLE_CLIENT_ID = config.google.iosClientId;

// KRA API 설정
export const KRA_API_KEY = config.kra.apiKey;

// API 설정
export const API_BASE_URL = config.api.server.baseURL;

// 앱 설정
export const APP_NAME = config.app.name;
export const APP_VERSION = config.app.version;

// 환경 설정
export const IS_DEVELOPMENT = isDevelopment();
export const IS_PRODUCTION = isProduction();
export const IS_STAGING = isStaging();

// 플랫폼 설정
export const IS_ANDROID = platformConfig.isAndroid;
export const IS_IOS = platformConfig.isIOS;
export const IS_WEB = platformConfig.isWeb;
