// DB 없이 개발/데모: NEXT_PUBLIC_USE_MOCK=true 시 mock 데이터 사용
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === '1';

export const CONFIG = {
  useMock: USE_MOCK,
  api: {
    server: {
      // NestJS Server (localhost:3001 in dev, env in prod)
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
    },
  },
  webapp: {
    // WebApp base URL (for mobile WebView)
    baseURL: process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000',
  },
  google: {
    // Web Client ID (GSI, Server idToken 검증에 동일 값 사용)
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  analytics: {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
};

export default CONFIG;
