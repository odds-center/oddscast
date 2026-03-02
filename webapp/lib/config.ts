/** Picks (My Selected Horses) — Excluded from service. Set to true to show UI */
export const PICKS_ENABLED = false;

export const CONFIG = {
  picksEnabled: PICKS_ENABLED,
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
  analytics: {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
  /** KRA official race replay / video portal (external link when race has results) */
  kra: {
    replayPortalUrl: 'https://todayrace.kra.co.kr/main.do',
  },
  /** Toss Payments (billing window) — client key only; secret is server-side */
  tossPayments: {
    clientKey: process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY || '',
  },
};

export default CONFIG;
