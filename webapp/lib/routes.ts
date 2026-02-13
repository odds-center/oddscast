/**
 * 라우트 경로 중앙 관리
 * 하드코딩 대신 여기서 import하여 사용
 */

export const routes = {
  home: '/',
  results: '/results',
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
    favorites: '/mypage/favorites',
    subscriptions: '/mypage/subscriptions',
    subscriptionsCheckout: (planId: string) => `/mypage/subscription-checkout?planId=${planId}`,
    notifications: '/mypage/notifications',
    ticketHistory: '/mypage/ticket-history',
    pointTransactions: '/mypage/point-transactions',
  },

  races: {
    index: '/',
    detail: (id: string) => `/races/${id}`,
  },

  legal: {
    terms: '/legal/terms',
    privacy: '/legal/privacy',
  },
} as const;
