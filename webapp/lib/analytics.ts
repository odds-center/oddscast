/**
 * Google Analytics 4 (GA4) 클라이언트 측 추적
 * CTA 클릭, 페이지뷰, 전환 이벤트 수집
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

/** 페이지뷰 트래킹 (SPA 라우트 변경 시) */
export function trackPageView(path: string, title?: string) {
  if (!GA_ENABLED || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  });
}

/** CTA 및 커스텀 이벤트 */
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

/** 사전 정의된 CTA 이벤트 이름 */
export const GA_EVENTS = {
  /** 예측권 사용 클릭 */
  PREDICTION_TICKET_USE: 'prediction_ticket_use',
  /** 다시 예측하기 클릭 */
  PREDICTION_REGENERATE: 'prediction_regenerate',
  /** 로그인 시도 */
  LOGIN_CLICK: 'login_click',
  /** 구글 로그인 클릭 */
  GOOGLE_LOGIN_CLICK: 'google_login_click',
  /** 출전마 선택 저장 */
  PICK_SAVE: 'pick_save',
  /** 경주 상세 진입 */
  RACE_DETAIL_VIEW: 'race_detail_view',
  /** 즐겨찾기 추가 */
  FAVORITE_ADD: 'favorite_add',
  /** 구독 결제 시도 */
  SUBSCRIPTION_CHECKOUT: 'subscription_checkout',
  /** 단건 결제 시도 */
  SINGLE_PURCHASE: 'single_purchase',
  /** 종합 예측권 사용 */
  MATRIX_TICKET_USE: 'matrix_ticket_use',
} as const;

/** CTA 트래킹 헬퍼 */
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
