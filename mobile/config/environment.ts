import { Platform } from 'react-native';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  KRA_OPENAPI_KEY_ENCODING,
} from '../utils/Constants';

// 환경 타입 정의
export type Environment = 'development' | 'staging' | 'production';

// 현재 환경 감지
export const getCurrentEnvironment = (): Environment => {
  return (
    (process.env.APP_ENV as Environment) || (process.env.NODE_ENV as Environment) || 'development'
  );
};

// 환경별 설정
export const ENV_CONFIG = {
  development: {
    // API 설정
    api: {
      kra: {
        baseURL: 'https://dev-api.kra.co.kr',
        timeout: 15000,
      },
      server: {
        baseURL: Platform.OS === 'android' ? 'http://10.0.2.2:3002' : 'http://localhost:3002',
        timeout: 10000,
      },
    },

    // 앱 설정
    app: {
      name: 'GoldenRace 개발',
      version: '1.0.0',
      bundleIdentifier: 'com.goldenrace.app.dev',
      androidPackage: 'com.goldenrace.app.dev',
    },

    // Google 설정
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },

    // KRA API 설정
    kra: {
      apiKey: KRA_OPENAPI_KEY_ENCODING,
    },
  },

  staging: {
    api: {
      kra: {
        baseURL: 'https://staging-api.kra.co.kr',
        timeout: 20000,
      },
      server: {
        baseURL: 'https://staging.goldenrace.com',
        timeout: 15000,
      },
    },
    app: {
      name: 'GoldenRace 스테이징',
      version: '1.0.0',
      bundleIdentifier: 'com.goldenrace.app.staging',
      androidPackage: 'com.goldenrace.app.staging',
    },
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },
    kra: {
      apiKey: KRA_OPENAPI_KEY_ENCODING,
    },
  },

  production: {
    api: {
      kra: {
        baseURL: 'https://www.kra.co.kr',
        timeout: 30000,
      },
      server: {
        baseURL: 'https://api.goldenrace.com',
        timeout: 20000,
      },
    },
    app: {
      name: 'GoldenRace',
      version: '1.0.0',
      bundleIdentifier: 'com.goldenrace.app',
      androidPackage: 'com.goldenrace.app',
    },
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },
    kra: {
      apiKey: KRA_OPENAPI_KEY_ENCODING,
    },
  },
};

// 현재 환경 설정 가져오기
export const getCurrentConfig = () => {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env];
};

// 편의 함수들
export const isDevelopment = () => getCurrentEnvironment() === 'development';
export const isStaging = () => getCurrentEnvironment() === 'staging';
export const isProduction = () => getCurrentEnvironment() === 'production';

// 플랫폼별 설정
export const getPlatformConfig = () => {
  const config = getCurrentConfig();
  return {
    ...config,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
    isWeb: Platform.OS === 'web',
  };
};
