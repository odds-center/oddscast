import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
      iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
      androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
    },

    // KRA API 설정
    kra: {
      apiKey:
        'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
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
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
      iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
      androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
    },
    kra: {
      apiKey:
        'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
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
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
      iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
      androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
    },
    kra: {
      apiKey:
        'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
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
