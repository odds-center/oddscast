/**
 * Reusable API mock helpers for Playwright tests.
 * Uses page.route() to intercept /api/* requests so tests run without a live server.
 */
import type { Page } from '@playwright/test';

const API = '/api';

// ------------------------------------------------------------------
// Stub data
// ------------------------------------------------------------------

export const stubUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  nickname: null,
  role: 'USER',
  isActive: true,
  consecutiveLoginDays: 1,
  pointBalance: 500,
};

export const stubToken = 'mock-jwt-token-abc123';

export const stubRace = {
  id: '1',
  meet: 'SEOUL',
  meetName: '서울',
  rcDate: '20250301',
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

/** Mock prediction ticket balance. */
export async function mockTicketBalance(page: Page) {
  await page.route(`${API}/prediction-tickets/balance**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ race: 2, matrix: 0 })),
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

export const stubPointBalance = { balance: 1200, pointBalance: 1200 };

export const stubPointTicketPrice = { pointsPerTicket: 1200 };

export const stubTicket = {
  id: 'ticket-1',
  type: 'RACE',
  status: 'AVAILABLE',
  issuedAt: '2025-03-01T00:00:00.000Z',
  expiresAt: '2025-04-01T00:00:00.000Z',
  usedAt: null,
  raceId: null,
};

export const stubPointTransaction = {
  id: 1,
  transactionType: 'BONUS',
  amount: 10,
  balanceAfter: 110,
  description: '일일 로그인 보너스',
  transactionTime: '2025-03-01T09:00:00.000Z',
};

export const stubNotification = {
  id: 'notif-1',
  title: '경주 시작 30분 전',
  message: '서울 1경주가 곧 시작됩니다.',
  type: 'RACE',
  isRead: false,
  createdAt: '2025-03-01T10:30:00.000Z',
};

export const stubHorse = {
  hrNo: 'H001',
  hrName: '천리마',
  hrNameEn: 'Thunder',
  age: 4,
  sex: '수말',
  trName: '박감독',
  owName: '이오너',
};

export const stubHorseHistory = {
  id: 'entry-h1',
  raceId: 1,
  rcDate: '20250301',
  meet: '서울',
  rcNo: '1',
  rcName: '봄 개막 특별경주',
  chulNo: '1',
  ord: '1',
  wgBudam: 57,
  rcTime: '72.3',
  winOdds: 3.5,
};

export const stubJockey = {
  jkNo: 'J001',
  jkName: '김철수',
  jkNameEn: 'Kim',
};

export const stubTrainer = {
  trName: '박감독',
};

export const stubPredictionHistoryItem = {
  id: 1,
  raceId: 1,
  race: {
    meetName: '서울',
    rcNo: '1',
    rcDate: '20250301',
    rcName: '봄 개막 특별경주',
    status: 'COMPLETED',
  },
  viewedAt: '2025-03-01T11:00:00.000Z',
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

export const stubAccuracyStats = {
  overall: { totalRaces: 100, matchedTop1: 40, matchedTop3: 72, accuracy1: 40, accuracy3: 72 },
  byMonth: [{ month: '2025-02', totalRaces: 50, matchedTop3: 36, accuracy3: 72 }],
  byMeet: [{ meet: '서울', totalRaces: 60, matchedTop3: 45, accuracy3: 75 }],
};

export const stubWeeklyPreview = {
  id: 1,
  weekLabel: '2025-03-01',
  content: {
    highlights: '이번 주말 서울 경마장에서 특별경주가 열립니다.',
    horsesToWatch: [{ hrName: '천리마', reason: '최근 3연승' }],
    trackConditions: '良馬場(양마장) 예상',
  },
};

export const stubRanking = [
  { rank: 1, userId: 1, name: 'User A', correctCount: 25, totalPredictions: 40 },
  { rank: 2, userId: 2, name: 'User B', correctCount: 20, totalPredictions: 38 },
];

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

export async function mockPointBalance(page: Page) {
  await page.route(`${API}/points/my-balance**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubPointBalance)),
    });
  });
  await page.route(`${API}/points/ticket-price**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse(stubPointTicketPrice)),
    });
  });
}

export async function mockTicketHistory(page: Page, tickets = [stubTicket]) {
  await page.route(`${API}/prediction-tickets/history**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ tickets, total: tickets.length, totalPages: 1 })),
    });
  });
}

export async function mockPointTransactions(page: Page, transactions = [stubPointTransaction]) {
  await page.route(`${API}/points/transactions**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ transactions, total: transactions.length, totalPages: 1 })),
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
  await page.route(`${API}/prediction-tickets/history**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ tickets: [], total: 0, totalPages: 1 })),
    });
  });
  await page.route(`${API}/predictions/history**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ items, total: items.length, totalPages: 1 })),
    });
  });
}

export async function mockMatrixPredictions(
  page: Page,
  predictions = [stubMatrixPrediction],
  unlocked = true,
) {
  await page.route(`${API}/predictions/matrix**`, async (route) => {
    if (!unlocked) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: '매트릭스 티켓이 필요합니다.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ predictions, date: '20250301', unlocked: true })),
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ horse: stubHorse, history: [stubHorseHistory], totalPages: 1 })),
    });
  });
}

export async function mockJockeyProfile(page: Page, jkNo = 'J001') {
  await page.route(`${API}/jockeys/${jkNo}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ jockey: stubJockey, history: [], totalPages: 1 })),
    });
  });
}

export async function mockTrainerProfile(page: Page, trName = '박감독') {
  await page.route(`${API}/trainers/${encodeURIComponent(trName)}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ trainer: stubTrainer, history: [], totalPages: 1 })),
    });
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

export async function mockRankings(page: Page) {
  await page.route(`${API}/rankings**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ rankings: stubRanking, total: 2, myRank: null })),
    });
  });
}

export async function mockGroupedResults(
  page: Page,
  grouped = [stubGroupedResult],
) {
  await page.route(`${API}/results/grouped**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ results: grouped, total: grouped.length, page: 1, totalPages: 1 }),
      ),
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
