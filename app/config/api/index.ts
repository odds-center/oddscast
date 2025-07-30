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
      baseURL: 'http://localhost:3000',
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
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  // 추가 API 키들...
};

// API 키 유효성 검사
export const validateApiKeys = () => {
  const missingKeys: string[] = [];

  if (!API_KEYS.kra.apiKey) missingKeys.push('KRA_API_KEY');
  if (!API_KEYS.supabase.url) missingKeys.push('SUPABASE_URL');
  if (!API_KEYS.supabase.anonKey) missingKeys.push('SUPABASE_ANON_KEY');

  if (missingKeys.length > 0) {
    console.warn('Missing API keys:', missingKeys);
    return false;
  }

  return true;
};
