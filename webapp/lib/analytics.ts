/**
 * Google Analytics 4 (GA4) client-side tracking
 * Collects CTA clicks, page views, conversion events
 */

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const GA_ENABLED = !!(
  typeof window !== 'undefined' &&
  GA_MEASUREMENT_ID &&
  process.env.NODE_ENV === 'production'
);

/** Page view tracking (on SPA route change) */
export function trackPageView(path: string, title?: string) {
  if (!GA_ENABLED || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  });
}

/** CTA and custom events */
export function trackEvent(
  eventName: string,
  params?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: unknown;
  },
) {
  if (!GA_ENABLED || !window.gtag) return;
  window.gtag('event', eventName, params);
}

/** Predefined CTA event names */
export const GA_EVENTS = {
  /** Prediction ticket use click */
  PREDICTION_TICKET_USE: 'prediction_ticket_use',
  /** Regenerate prediction click */
  PREDICTION_REGENERATE: 'prediction_regenerate',
  /** Login attempt */
  LOGIN_CLICK: 'login_click',
  /** Google login click */
  GOOGLE_LOGIN_CLICK: 'google_login_click',
  /** Save selected horse */
  PICK_SAVE: 'pick_save',
  /** Race detail view */
  RACE_DETAIL_VIEW: 'race_detail_view',
  /** Add favorite */
  FAVORITE_ADD: 'favorite_add',
  /** Subscription checkout attempt */
  SUBSCRIPTION_CHECKOUT: 'subscription_checkout',
  /** Single purchase attempt */
  SINGLE_PURCHASE: 'single_purchase',
  /** Matrix ticket use */
  MATRIX_TICKET_USE: 'matrix_ticket_use',
} as const;

/** CTA tracking helper */
export function trackCTA(
  action: keyof typeof GA_EVENTS,
  label?: string,
  value?: number,
) {
  trackEvent(GA_EVENTS[action], {
    event_category: 'cta',
    event_label: label,
    value,
  });
}
