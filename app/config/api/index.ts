import { Platform } from 'react-native';

// API 설정 통합 관리
export * from './kraRecords';
export * from './kraPlans';

// 환경별 API 설정
export const API_ENV_CONFIG = {
  development: {
    kra: {
      baseURL: 'https://dev-api.kra.co.kr',
      timeout: 15000,
    },
    server: {
      baseURL: Platform.OS === 'android' ? 'http://10.0.2.2:3002' : 'http://localhost:3002',
      timeout: 10000,
    },
  },
  staging: {
    kra: {
      baseURL: 'https://staging-api.kra.co.kr',
      timeout: 20000,
    },
    server: {
      baseURL: 'https://staging.goldenrace.com',
      timeout: 15000,
    },
  },
  production: {
    kra: {
      baseURL: 'https://www.kra.co.kr',
      timeout: 30000,
    },
    server: {
      baseURL: 'https://api.goldenrace.com',
      timeout: 20000,
    },
  },
};

// 현재 환경 가져오기
export const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  return (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development';
};

// 환경별 설정 가져오기
export const getApiConfig = () => {
  const env = getCurrentEnvironment();
  return API_ENV_CONFIG[env];
};

// API 키 관리
export const API_KEYS = {
  kra: {
    apiKey:
      process.env.KRA_API_KEY ||
      'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
  },
  google: {
    clientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
    serverClientId:
      process.env.GOOGLE_CLIENT_ID ||
      '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
    androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
    iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
    iosUrlScheme: 'com.googleusercontent.apps.297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh',
  },
  // 추가 API 키들...
};

// API 키 유효성 검사
export const validateApiKeys = () => {
  const missingKeys: string[] = [];

  if (!API_KEYS.kra.apiKey) missingKeys.push('KRA_API_KEY');
  if (!API_KEYS.google.clientId) missingKeys.push('GOOGLE_CLIENT_ID');

  if (missingKeys.length > 0) {
    console.warn('Missing API keys:', missingKeys);
    return false;
  }

  return true;
};
