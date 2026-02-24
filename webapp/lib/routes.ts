/**
 * Centralized route path management
 * Import from here instead of hardcoding
 */

export const routes = {
  home: '/',
  results: '/results',
  resultsDetail: (id: string) => `/races/${id}?view=result`,
  ranking: '/ranking',
  settings: '/settings',
  settingsNotifications: '/settings/notifications',
  settingsDeleteAccount: '/settings/delete-account',

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
    subscriptionCheckoutSuccess: '/mypage/subscription-checkout/success',
    subscriptionCheckoutFail: '/mypage/subscription-checkout/fail',
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

  horses: {
    detail: (hrNo: string) => `/horses/${encodeURIComponent(hrNo)}`,
  },

  jockeys: {
    detail: (jkNo: string) => `/jockeys/${encodeURIComponent(jkNo)}`,
  },

  trainers: {
    detail: (trName: string) => `/trainers/${encodeURIComponent(trName)}`,
  },

  /** Yongsan Comprehensive Style - Comprehensive prediction table */
  predictions: {
    matrix: '/predictions/matrix',
    accuracy: '/predictions/accuracy',
  },

  legal: {
    terms: '/legal/terms',
    privacy: '/legal/privacy',
    refund: '/legal/refund',
  },
} as const;
