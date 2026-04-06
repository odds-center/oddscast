/**
 * Reusable API mock helpers for Playwright tests.
 * Uses page.route() to intercept /api/* requests so tests run without a live server.
 */
import type { Page } from '@playwright/test';

// Use **/api to match requests regardless of host (http://localhost:3001/api/...)
const API = '**/api';

// ------------------------------------------------------------------
// Stub data
// ------------------------------------------------------------------

export const stubUser = {
  id: 1,
  email: 'test@test.com',
  name: 'Test User',
  nickname: null,
  role: 'USER',
  isActive: true,
};

export const stubToken = 'mock-jwt-token-abc123';

/** Use a future date to prevent isRaceActuallyEnded() from returning true */
function getFutureRcDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export const stubRace = {
  id: '1',
  meet: 'SEOUL',
  meetName: '서울',
  rcDate: getFutureRcDate(),
  rcNo: '1',
  rcName: '봄 개막 특별경주',
  stTime: '11:00',
  rcDist: '1200',
  status: 'SCHEDULED',
};

export const stubRaceEntry = {
  id: 'entry-1',
  raceId: 1,
  hrNo: '1',
  hrName: '천리마',
  chulNo: '1',
  jkName: '김철수',
  trName: '박감독',
  wgBudam: 57,
};

export const stubSubscriptionPlan = {
  id: 1,
  planName: 'STANDARD',
  displayName: '스탠다드',
  description: '가장 인기 있는 플랜',
  totalPrice: 9900,
  totalTickets: 7,
  baseTickets: 7,
  matrixTickets: 1,
  isActive: true,
};

/** Wrap any data in the server's { data, status } response envelope. */
export function apiResponse<T>(data: T, status = 200) {
  return { data, status, message: null };
}

// ------------------------------------------------------------------
// Mock setup functions
// ------------------------------------------------------------------

/** Mock a successful login (POST /api/auth/login). */
export async function mockLogin(page: Page) {
  await page.route(`${API}/auth/login`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ accessToken: stubToken, user: stubUser }),
      ),
    });
  });
}

/** Mock a failed login with 401. */
export async function mockLoginFail(page: Page) {
  await page.route(`${API}/auth/login`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }),
    });
  });
}

/** Mock GET /api/auth/me — returns logged-in user profile. */
export async function mockAuthMe(page: Page) {
  await page.route(`${API}/auth/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubUser)),
    });
  });
  await page.route(`${API}/auth/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubUser)),
    });
  });
}

/** Mock race list endpoint GET /api/races. */
export async function mockRaceList(page: Page, races = [stubRace]) {
  await page.route(`${API}/races**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ races, total: races.length, page: 1, totalPages: 1 }),
      ),
    });
  });
}

/** Mock race detail endpoint GET /api/races/:id. */
export async function mockRaceDetail(
  page: Page,
  race = { ...stubRace, entries: [stubRaceEntry], results: [], dividends: [] },
) {
  await page.route(`${API}/races/${race.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(race)),
    });
  });
  await page.route(`${API}/races/${race.id}/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse([])),
    });
  });
}

/** Mock subscription plans GET /api/subscriptions/plans. */
export async function mockSubscriptionPlans(page: Page, plans = [stubSubscriptionPlan]) {
  await page.route(`${API}/subscriptions/plans**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(plans)),
    });
  });
}

/** Mock subscription status (no active subscription). */
export async function mockSubscriptionStatus(page: Page, isActive = false) {
  await page.route(`${API}/subscriptions/status**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ isActive, planId: null, monthlyTickets: 0 })),
    });
  });
  await page.route(`${API}/subscriptions/history**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ subscriptions: [] })),
    });
  });
}

/** Mock notification preferences. */
export async function mockNotificationPrefs(page: Page) {
  await page.route(`${API}/notifications/preferences**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({
          pushEnabled: true,
          raceEnabled: true,
          predictionEnabled: true,
          subscriptionEnabled: true,
          systemEnabled: true,
          promotionEnabled: false,
        }),
      ),
    });
  });
}

/** Mock prediction ticket balance.
 *  Returns shape matching PredictionTicketApi.getBalance() normalization:
 *  { available, used, expired, total } → maps to availableTickets = 2
 */
export async function mockTicketBalance(page: Page) {
  await page.route(`${API}/prediction-tickets/balance**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ available: 2, used: 0, expired: 0, total: 2 })),
    });
  });
}

/** Mock prediction (locked/no prediction) for a race. */
export async function mockRacePredictionLocked(page: Page, raceId = '1') {
  await page.route(`${API}/predictions/race/${raceId}**`, async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: '예측권이 필요합니다.' }),
    });
  });
}

/** Mock prediction unlocked with data. */
export async function mockRacePredictionUnlocked(page: Page, raceId = '1') {
  await page.route(`${API}/predictions/race/${raceId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({
          id: 1,
          raceId: Number(raceId),
          status: 'COMPLETED',
          scores: {
            horseScores: [
              { hrNo: '1', hrName: '천리마', score: 85, winProb: 35 },
              { hrNo: '2', hrName: '번개', score: 78, winProb: 28 },
            ],
          },
          analysis: '1번 천리마가 최근 3연승으로 강세입니다.',
          preview: '주목 말: 1번 천리마',
          previewApproved: true,
        }),
      ),
    });
  });
}

// ------------------------------------------------------------------
// Additional stubs
// ------------------------------------------------------------------

export const stubTicket = {
  id: 'ticket-1',
  type: 'RACE',
  status: 'AVAILABLE',
  issuedAt: '2025-03-01T00:00:00.000Z',
  expiresAt: '2025-04-01T00:00:00.000Z',
  usedAt: null,
  raceId: null,
};

export const stubNotification = {
  id: 'notif-1',
  title: '경주 시작 30분 전',
  message: '서울 1경주가 곧 시작됩니다.',
  type: 'RACE',
  isRead: false,
  createdAt: '2025-03-01T10:30:00.000Z',
};

// HorseProfile shape (matches HorseApi.getProfile response)
export const stubHorse = {
  hrNo: 'H001',
  hrName: '천리마',
  sex: '수말',
  age: '4',
  totalRaces: 5,
  winCount: 2,
  placeCount: 4,
  winRate: 40,
  placeRate: 80,
  recentForm: [1, 2, 1, 3, 4],
};

// HorseHistoryItem shape (matches HorseApi.getHistory response items)
export const stubHorseHistory = {
  raceId: 1,
  rcDate: '20250301',
  meet: '서울',
  meetName: '서울',
  rcNo: '1',
  rcDist: '1200',
  ord: '1',
  ordInt: 1,
  chulNo: '1',
  jkName: '김철수',
  rcTime: '72.3',
};

// JockeyProfile shape (matches JockeyApi.getProfile response)
export const stubJockey = {
  jkNo: 'J001',
  jkName: '김철수',
  totalRaces: 10,
  winCount: 3,
  placeCount: 7,
  winRate: 30,
  placeRate: 70,
  recentForm: [1, 2, 3, 1, 2],
  byMeet: [],
};

// TrainerProfile shape (matches TrainerApi.getProfile response)
export const stubTrainer = {
  trName: '박감독',
  totalRaces: 8,
  winCount: 2,
  placeCount: 5,
  winRate: 25,
  placeRate: 62.5,
  recentForm: [1, 2, 3],
  byMeet: [],
};

export const stubPredictionHistoryItem = {
  ticketId: 1,
  raceId: 1,
  predictionId: null,
  accuracy: null,
  usedAt: '2025-03-01T11:00:00.000Z',
  race: {
    id: 1,
    meet: '서울',
    rcNo: '1',
    rcDate: '20250301',
    rcName: '봄 개막 특별경주',
  },
};

export const stubMatrixPrediction = {
  id: 1,
  raceId: 1,
  race: {
    meetName: '서울',
    rcNo: '1',
    rcDate: '20250301',
    rcName: '봄 개막 특별경주',
    stTime: '11:00',
  },
  scores: {
    horseScores: [
      { hrNo: '1', hrName: '천리마', score: 85, winProb: 35 },
      { hrNo: '2', hrName: '번개', score: 78, winProb: 28 },
    ],
  },
  preview: '주목 말: 1번 천리마',
  previewApproved: true,
};

// Matches server's AccuracyStatsResponse shape
export const stubAccuracyStats = {
  overall: { totalCount: 100, hitCount: 72, averageAccuracy: 72 },
  byMonth: [{ month: '2025-02', count: 50, averageAccuracy: 72 }],
  byMeet: [{ meet: '서울', count: 60, averageAccuracy: 75 }],
};

export const stubWeeklyPreview = {
  id: 1,
  weekLabel: '2025-03-01',
  content: {
    highlights: '이번 주말 서울 경마장에서 특별경주가 열립니다.',
    horsesToWatch: ['천리마 — 최근 3연승'],
    trackConditions: '良馬場(양마장) 예상',
  },
};

// Flat shape used in tests; mockGroupedResults converts to server's raceGroups format
export const stubGroupedResult = {
  raceId: '1',
  meetName: '서울',
  rcNo: '1',
  rcDate: '20250301',
  rcDist: '1200',
  results: [
    { ord: '1', chulNo: '3', hrNo: '1', hrName: '천리마', jkName: '김철수', rcTime: '72.3', diffUnit: null },
    { ord: '2', chulNo: '7', hrNo: '2', hrName: '번개', jkName: '이기수', rcTime: '72.5', diffUnit: '목' },
    { ord: '3', chulNo: '1', hrNo: '3', hrName: '바람', jkName: '박선수', rcTime: '72.7', diffUnit: '1/2' },
  ],
};

// ------------------------------------------------------------------
// Additional mock setup functions
// ------------------------------------------------------------------

export async function mockTicketHistory(page: Page, tickets = [stubTicket]) {
  await page.route(`${API}/prediction-tickets/history**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ tickets, total: tickets.length, totalPages: 1 })),
    });
  });
}

export async function mockNotifications(page: Page, notifications = [stubNotification]) {
  await page.route(`${API}/notifications**`, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return; }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ notifications, total: notifications.length, totalPages: 1 })),
    });
  });
  await page.route(`${API}/notifications/unread-count**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ count: 1 })),
    });
  });
}

export async function mockPredictionHistory(page: Page, items = [stubPredictionHistoryItem]) {
  // Matches PredictionTicketApi.getMyPredictionsHistory → GET /prediction-tickets/my-predictions
  await page.route(`${API}/prediction-tickets/my-predictions**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ list: items, total: items.length, page: 1, totalPages: 1 })),
    });
  });
}

export async function mockMatrixPredictions(
  page: Page,
  predictions = [stubMatrixPrediction],
  unlocked = true,
) {
  // Mock checkMatrixAccess endpoint
  await page.route(`${API}/prediction-tickets/matrix/access**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ hasAccess: unlocked })),
    });
  });

  await page.route(`${API}/predictions/matrix**`, async (route) => {
    // Build correct MatrixResponseDto format from stubMatrixPrediction shape
    const raceMatrix = predictions.map((p) => {
      const horses = p.scores?.horseScores ?? [];
      return {
        raceId: String(p.raceId ?? p.id),
        meet: (p.race as { meet?: string })?.meet ?? 'SEOUL',
        meetName: p.race?.meetName ?? '서울',
        rcNo: p.race?.rcNo ?? '1',
        stTime: p.race?.stTime,
        predictions: {
          ai_consensus: horses.slice(0, 2).map((h: { hrNo: string }) => h.hrNo),
        },
        horseNames: Object.fromEntries(
          horses.map((h: { hrNo: string; hrName: string }) => [h.hrNo, h.hrName]),
        ),
        entries: horses.map((h: { hrNo: string; hrName: string }, i: number) => ({
          hrNo: h.hrNo,
          hrName: h.hrName,
          chulNo: String(i + 1),
        })),
        horseScores: horses,
        aiConsensus: horses[0]?.hrNo ?? '-',
      };
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ raceMatrix, experts: [{ id: 'ai_consensus', name: 'AI 종합' }] })),
    });
  });
}

export async function mockAccuracyStats(page: Page) {
  await page.route(`${API}/predictions/accuracy-stats**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubAccuracyStats)),
    });
  });
}

export async function mockHorseProfile(page: Page, hrNo = 'H001') {
  await page.route(`${API}/horses/${hrNo}**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/history')) {
      // HorseHistoryResponse shape
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ items: [stubHorseHistory], total: 1, totalPages: 1 })),
      });
    } else {
      // HorseProfile shape (direct — no wrapper object)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse(stubHorse)),
      });
    }
  });
}

export async function mockJockeyProfile(page: Page, jkNo = 'J001') {
  await page.route(`${API}/jockeys/${jkNo}**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ items: [], total: 0, totalPages: 1 })),
      });
    } else {
      // JockeyProfile shape (direct)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse(stubJockey)),
      });
    }
  });
}

export async function mockTrainerProfile(page: Page, trName = '박감독') {
  await page.route(`${API}/trainers/${encodeURIComponent(trName)}**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ items: [], total: 0, totalPages: 1 })),
      });
    } else {
      // TrainerProfile shape (direct)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse(stubTrainer)),
      });
    }
  });
}

export async function mockWeeklyPreview(page: Page) {
  await page.route(`${API}/weekly-preview**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubWeeklyPreview)),
    });
  });
}

export async function mockGroupedResults(
  page: Page,
  grouped = [stubGroupedResult],
) {
  // Matches GET /api/results?groupByRace=true (server's actual endpoint)
  await page.route('**/api/results**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has('groupByRace')) {
      await route.continue();
      return;
    }
    // Convert flat stub to server's raceGroups response format
    const raceGroups = grouped.map((g) => ({
      race: { id: g.raceId, meetName: g.meetName, rcDate: g.rcDate, rcNo: g.rcNo, rcDist: g.rcDist },
      results: g.results,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ raceGroups, total: grouped.length, page: 1, totalPages: 1 }),
      ),
    });
  });
}

/** Mock GET /api/prediction-tickets/matrix/balance. */
export async function mockMatrixBalance(page: Page) {
  await page.route(`${API}/prediction-tickets/matrix/balance**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ available: 1, used: 0, total: 1 })),
    });
  });
}

/** Mock GET /api/predictions/hit-record. */
export async function mockHitRecords(page: Page) {
  await page.route(`${API}/predictions/hit-record**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse([])),
    });
  });
}

/** Seed auth token into localStorage to simulate a logged-in state. */
export async function seedAuth(page: Page) {
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('jwt_user', JSON.stringify(user));
    },
    { token: stubToken, user: stubUser },
  );
}

// ------------------------------------------------------------------
// Auth extension mocks
// ------------------------------------------------------------------

/** Mock POST /api/auth/forgot-password — success (email sent). */
export async function mockForgotPassword(page: Page) {
  await page.route(`${API}/auth/forgot-password`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ sent: true })),
    });
  });
}

/** Mock POST /api/auth/forgot-password — failure (email not found). */
export async function mockForgotPasswordFail(page: Page) {
  await page.route(`${API}/auth/forgot-password`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: '등록되지 않은 이메일입니다.' }),
    });
  });
}

/** Mock POST /api/auth/reset-password — success. */
export async function mockResetPassword(page: Page) {
  await page.route(`${API}/auth/reset-password`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ success: true })),
    });
  });
}

/** Mock POST /api/auth/reset-password — invalid/expired token. */
export async function mockResetPasswordInvalid(page: Page) {
  await page.route(`${API}/auth/reset-password`, async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: '유효하지 않거나 만료된 토큰입니다.' }),
    });
  });
}

/** Mock GET /api/auth/me after Kakao OAuth success page. */
export async function mockKakaoAuthMe(page: Page) {
  const kakaoUser = { ...stubUser, id: 99, email: 'kakao_user@kakao.com', name: '카카오유저', provider: 'kakao' };
  await page.route(`${API}/auth/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(kakaoUser)),
    });
  });
}

// ------------------------------------------------------------------
// Bug report mocks
// ------------------------------------------------------------------

export const stubBugReport = {
  id: 'bug-1',
  category: 'UI',
  title: '버튼이 클릭되지 않습니다',
  description: '위치: /races\n재현: 경주 목록 접속 후 버튼 클릭\n실제: 아무 반응 없음\n기대: 경주 상세로 이동',
  status: 'OPEN',
  createdAt: '2026-04-07T09:00:00.000Z',
  pageUrl: 'http://localhost:3000/races',
};

/** Mock POST /api/bug-reports — successful submission. */
export async function mockBugReportSubmit(page: Page) {
  await page.route(`${API}/bug-reports`, async (route) => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubBugReport)),
    });
  });
}

// ------------------------------------------------------------------
// Analytics mocks
// ------------------------------------------------------------------

export const stubTrackConditionStats = {
  meet: '서울' as const,
  stats: [
    { condition: '양', conditionLabel: '良', totalStarts: 300, wins: 60, winRate: 20 },
    { condition: '다소양', conditionLabel: '稍良', totalStarts: 120, wins: 22, winRate: 18.3 },
  ],
};

export const stubPostPositionStats = {
  meet: '서울' as const,
  stats: [
    { chulNo: 1, totalStarts: 80, wins: 18, winRate: 22.5 },
    { chulNo: 2, totalStarts: 80, wins: 14, winRate: 17.5 },
    { chulNo: 3, totalStarts: 80, wins: 12, winRate: 15.0 },
  ],
};

export const stubJockeyTrainerCombos = {
  meet: '서울' as const,
  combos: [
    { jockeyName: '김철수', trainerName: '박감독', totalStarts: 20, wins: 8, winRate: 40 },
    { jockeyName: '이기수', trainerName: '최감독', totalStarts: 15, wins: 5, winRate: 33.3 },
  ],
};

export const stubPredictionAccuracyByMeet = {
  meet: '서울' as const,
  byMeet: [
    { meet: 'SEOUL', meetLabel: '서울', totalPredictions: 100, hitCount: 72, accuracy: 72 },
    { meet: 'JEJU', meetLabel: '제주', totalPredictions: 50, hitCount: 32, accuracy: 64 },
  ],
};

export const stubDistanceWinRates = {
  meet: '서울' as const,
  stats: [
    { rangeLabel: '1000–1200m', minDist: 1000, maxDist: 1200, totalStarts: 200, wins: 40, winRate: 20 },
    { rangeLabel: '1400–1600m', minDist: 1400, maxDist: 1600, totalStarts: 180, wins: 32, winRate: 17.8 },
  ],
};

/** Mock all analytics endpoints. */
export async function mockAnalytics(page: Page) {
  await page.route(`${API}/analytics/track-condition**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubTrackConditionStats)),
    });
  });
  await page.route(`${API}/analytics/post-position**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubPostPositionStats)),
    });
  });
  await page.route(`${API}/analytics/jockey-trainer-combos**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubJockeyTrainerCombos)),
    });
  });
  await page.route(`${API}/analytics/prediction-accuracy**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubPredictionAccuracyByMeet)),
    });
  });
  await page.route(`${API}/analytics/distance-win-rates**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubDistanceWinRates)),
    });
  });
}

/** Mock analytics with 401 for auth-gated endpoints. */
export async function mockAnalyticsUnauth(page: Page) {
  await page.route(`${API}/analytics/track-condition**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubTrackConditionStats)),
    });
  });
  await page.route(`${API}/analytics/prediction-accuracy**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubPredictionAccuracyByMeet)),
    });
  });
  await page.route(`${API}/analytics/post-position**`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: '로그인이 필요합니다.' }),
    });
  });
  await page.route(`${API}/analytics/jockey-trainer-combos**`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: '로그인이 필요합니다.' }),
    });
  });
  await page.route(`${API}/analytics/distance-win-rates**`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: '로그인이 필요합니다.' }),
    });
  });
}
