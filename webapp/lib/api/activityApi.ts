import { axiosInstance } from './axios';

interface TrackEventPayload {
  event: string;
  page?: string;
  target?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

let eventBuffer: TrackEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 20;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gr_session_id');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('gr_session_id', sid);
  }
  return sid;
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, FLUSH_INTERVAL_MS);
}

async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];

  try {
    await axiosInstance.post('/activity/track/batch', { events: batch });
  } catch {
    // Re-queue on failure (drop if buffer is too large to prevent memory leak)
    if (eventBuffer.length < MAX_BUFFER_SIZE * 2) {
      eventBuffer.unshift(...batch);
    }
  }
}

export function trackActivity(
  event: string,
  opts?: { page?: string; target?: string; metadata?: Record<string, unknown> },
): void {
  if (typeof window === 'undefined') return;

  const payload: TrackEventPayload = {
    event,
    page: opts?.page ?? window.location.pathname,
    target: opts?.target,
    metadata: opts?.metadata,
    sessionId: getSessionId(),
  };

  eventBuffer.push(payload);

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    void flushEvents();
  } else {
    scheduleFlush();
  }
}

// Flush remaining events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushEvents();
    }
  });

  window.addEventListener('beforeunload', () => {
    void flushEvents();
  });
}

export const ACTIVITY_EVENTS = {
  PAGE_VIEW: 'PAGE_VIEW',
  RACE_CLICK: 'RACE_CLICK',
  RACE_DETAIL_VIEW: 'RACE_DETAIL_VIEW',
  PREDICTION_PREVIEW: 'PREDICTION_PREVIEW',
  PREDICTION_FULL_VIEW: 'PREDICTION_FULL_VIEW',
  MATRIX_VIEW: 'MATRIX_VIEW',
  MATRIX_UNLOCK: 'MATRIX_UNLOCK',
  RESULT_VIEW: 'RESULT_VIEW',
  TICKET_PURCHASE: 'TICKET_PURCHASE',
  TICKET_USE: 'TICKET_USE',
  SUBSCRIPTION_VIEW: 'SUBSCRIPTION_VIEW',
  SUBSCRIPTION_CHECKOUT: 'SUBSCRIPTION_CHECKOUT',
  RANKING_VIEW: 'RANKING_VIEW',
  SCHEDULE_VIEW: 'SCHEDULE_VIEW',
  PROFILE_VIEW: 'PROFILE_VIEW',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  SEARCH: 'SEARCH',
} as const;
