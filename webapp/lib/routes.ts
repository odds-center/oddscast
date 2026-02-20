/**
 * 라우트 경로 중앙 관리
 * 하드코딩 대신 여기서 import하여 사용
 */

export const routes = {
  home: '/',
  results: '/results',
  resultsDetail: (id: string) => `/races/${id}?view=result`,
  ranking: '/ranking',
  settings: '/settings',
  settingsNotifications: '/settings/notifications',

  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  profile: {
    index: '/profile',
    edit: '/profile/edit',
  },

  mypage: {
    index: '/mypage',
    picks: '/mypage/picks',
    subscriptions: '/mypage/subscriptions',
    subscriptionsCheckout: (planId: string) => `/mypage/subscription-checkout?planId=${planId}`,
    matrixTicketPurchase: '/mypage/matrix-ticket-purchase',
    notifications: '/mypage/notifications',
    ticketHistory: '/mypage/ticket-history',
    pointTransactions: '/mypage/point-transactions',
  },

  races: {
    index: '/',
    list: '/races',
    schedule: '/races/schedule',
    detail: (id: string) => `/races/${id}`,
  },

  /** 용산종합지 스타일 - 종합 예상표 */
  predictions: {
    matrix: '/predictions/matrix',
  },

  legal: {
    terms: '/legal/terms',
    privacy: '/legal/privacy',
    refund: '/legal/refund',
  },
} as const;
