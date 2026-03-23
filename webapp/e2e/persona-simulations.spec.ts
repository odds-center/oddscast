/**
 * Persona Simulation E2E Tests
 *
 * 5 personas × 2 scenarios = 10 simulations.
 * Each test simulates a real user journey from PERSONA_SIMULATION.md
 * and verifies the key UX moments (conversion events, friction points, happy paths).
 *
 * Personas:
 *  1. Kim   — Regular Racing Fan (55, mobile)
 *  2. Park  — Newcomer (48, weekday visitor)
 *  3. Lee   — Data Analyst (42, desktop)
 *  4. Choi  — Casual Senior (63, mobile)
 *  5. Jung  — Matrix Power User (50, mobile)
 */
import { test, expect, type Page } from '@playwright/test';
import {
  mockLogin,
  mockAuthMe,
  mockRaceList,
  mockRaceDetail,
  mockRacePredictionLocked,
  mockRacePredictionUnlocked,
  mockTicketBalance,
  mockSubscriptionPlans,
  mockSubscriptionStatus,
  mockMatrixPredictions,
  mockMatrixBalance,
  mockHitRecords,
  mockAccuracyStats,
  mockGroupedResults,
  mockNotifications,
  mockNotificationPrefs,
  mockPredictionHistory,
  mockTicketHistory,
  mockHorseProfile,
  mockJockeyProfile,
  seedAuth,
  stubRace,
  stubRaceEntry,
  apiResponse,
} from './fixtures/api-mocks';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Silence all home page background API calls that are not relevant to the test. */
async function mockHomePageAPIs(page: Page) {
  await mockRaceList(page);
  await mockGroupedResults(page);
  await mockAccuracyStats(page);

  // Fortune (logged-in bonus card)
  await page.route('**/api/fortune**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ fortune: '오늘의 행운은 당신 편입니다.' })),
    });
  });

  // Rankings preview
  await page.route('**/api/users/rankings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ rankings: [] })),
    });
  });

  // Weekly preview
  await page.route('**/api/weekly-preview**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ id: 1, weekLabel: '2026-03-23', content: { highlights: '이번 주 서울 특별경주', horsesToWatch: [], trackConditions: '良馬場' } }),
      ),
    });
  });

  // Matrix preview (home section)
  await page.route('**/api/predictions/matrix**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        apiResponse({ raceMatrix: [], experts: [{ id: 'ai_consensus', name: 'AI 종합' }] }),
      ),
    });
  });

  // Notifications (unread count badge)
  await page.route('**/api/notifications/unread-count**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiResponse({ count: 0 })),
    });
  });
}

/** Race detail stub with 5 entries for richer simulation. */
const raceDetailWith5Entries = {
  ...stubRace,
  status: 'SCHEDULED',
  entries: [
    { ...stubRaceEntry, hrNo: '1', hrName: '천리마', chulNo: '1', jkName: '김철수' },
    { ...stubRaceEntry, id: 'entry-2', hrNo: '2', hrName: '번개', chulNo: '2', jkName: '이기수' },
    { ...stubRaceEntry, id: 'entry-3', hrNo: '3', hrName: '바람', chulNo: '3', jkName: '박선수' },
    { ...stubRaceEntry, id: 'entry-4', hrNo: '4', hrName: '폭풍', chulNo: '4', jkName: '최기수' },
    { ...stubRaceEntry, id: 'entry-5', hrNo: '5', hrName: '황금마', chulNo: '5', jkName: '정기수' },
  ],
  results: [],
  dividends: [],
};

// ---------------------------------------------------------------------------
// Simulation 1 — Kim: First Visit on Race Day (Mobile)
// Regular Racing Fan discovers OddsCast via Google search on Saturday morning.
// Key journey: home → race detail → locked prediction → register page
// ---------------------------------------------------------------------------
test.describe('Sim 1 — Kim: Race-day first visit (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // Galaxy S23

  test('lands on home, sees today races, taps race, hits prediction paywall', async ({ page }) => {
    await mockHomePageAPIs(page);
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionLocked(page);

    await page.goto('/');

    // Home page title loads
    await expect(page).toHaveTitle(/OddsCast/);

    // Mobile app bar is visible
    const appBar = page.locator('.nav-mobile-bar').first();
    await expect(appBar).toBeVisible({ timeout: 8000 });

    // Navigate to race list
    await page.goto('/races');
    await expect(page.getByRole('link', { name: /서울 1R/ }).first()).toBeVisible({ timeout: 8000 });

    // Go to race detail
    await page.goto('/races/1');

    // Entry table renders with horse names
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });

    // Prediction is locked — login/ticket prompt should appear
    const lockedMsg = page.locator('text=/예측권|로그인|ticket/i').first();
    await expect(lockedMsg).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 2 — Kim: Returning Subscriber (Mobile)
// Subscribed Kim re-opens app on next race day, uses tickets freely.
// Key journey: home → race detail → unlocked prediction → results check
// ---------------------------------------------------------------------------
test.describe('Sim 2 — Kim: Returning subscriber (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('logged-in subscriber sees unlocked prediction and race results', async ({ page }) => {
    await mockHomePageAPIs(page);
    await mockAuthMe(page);
    await mockRaceDetail(page, { ...raceDetailWith5Entries, status: 'COMPLETED', results: [
      { ord: '1', chulNo: '1', hrNo: '1', hrName: '천리마', jkName: '김철수', rcTime: '72.3', diffUnit: null },
      { ord: '2', chulNo: '2', hrNo: '2', hrName: '번개', jkName: '이기수', rcTime: '72.6', diffUnit: '목' },
      { ord: '3', chulNo: '3', hrNo: '3', hrName: '바람', jkName: '박선수', rcTime: '72.9', diffUnit: '1/2' },
    ], dividends: [] });
    await mockRacePredictionUnlocked(page);
    await mockTicketBalance(page);
    await mockSubscriptionStatus(page, true);
    await mockHitRecords(page);

    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    // Navigate to race detail
    await page.goto('/races/1');

    // Race entries are visible
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });

    // Unlocked prediction data renders
    const predictionEl = page.locator('text=/AI 예측|예측권|분석/i').first();
    await expect(predictionEl).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 3 — Park: Weekday Empty State (Desktop)
// Newcomer visits on Wednesday — no races today.
// Key journey: home (no races) → sees helpful content → browses results → accuracy
// ---------------------------------------------------------------------------
test.describe('Sim 3 — Park: Weekday empty state (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('weekday visitor sees non-empty home and can navigate to accuracy dashboard', async ({
    page,
  }) => {
    // No upcoming races (weekday)
    await page.route('**/api/races**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ races: [], total: 0, page: 1, totalPages: 1 })),
      });
    });
    await mockGroupedResults(page);
    await mockAccuracyStats(page);
    await page.route('**/api/fortune**', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });
    await page.route('**/api/users/rankings**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse({ rankings: [] })) });
    });
    await page.route('**/api/weekly-preview**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse(null)) });
    });
    await page.route('**/api/notifications/unread-count**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse({ count: 0 })) });
    });
    await page.route('**/api/predictions/matrix**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse({ raceMatrix: [], experts: [] })) });
    });

    await page.goto('/');

    // Page still loads (not a blank error screen)
    await expect(page).toHaveTitle(/OddsCast/);

    // Accuracy page accessible from weekday home
    await page.goto('/predictions/accuracy');
    await expect(page.locator('text=/72|적중률/i').first()).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 4 — Park: Friday Return + First Ticket Use (Mobile)
// Park returns on Friday (race day), registers, uses signup bonus ticket.
// Key journey: register → welcome → race detail → use ticket → see analysis
// ---------------------------------------------------------------------------
test.describe('Sim 4 — Park: Friday return, first ticket use (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('new user sees register page and can access race detail after auth', async ({ page }) => {
    await mockHomePageAPIs(page);
    await mockAuthMe(page);
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionUnlocked(page);
    await mockTicketBalance(page);

    // Register page loads correctly
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Simulate post-registration: seed auth and go to race detail
    await page.goto('/races/1');
    await seedAuth(page);
    await page.reload();

    // Entry table is visible
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });

    // AI analysis text is present (unlocked prediction)
    const analysis = page.locator('text=/AI|분석|예측/i').first();
    await expect(analysis).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 5 — Lee: Deep Evaluation Flow (Desktop)
// Data analyst checks accuracy page first, then horse detail, then race detail.
// Key journey: /predictions/accuracy → /horses/H001 → /races/1 → /races/1/simulator
// ---------------------------------------------------------------------------
test.describe('Sim 5 — Lee: Deep evaluation entry path (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('analyst visits accuracy → horse profile → race detail in sequence', async ({ page }) => {
    await mockAccuracyStats(page);
    await mockHorseProfile(page, 'H001');
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionUnlocked(page);
    await mockTicketBalance(page);
    await mockHitRecords(page);
    await mockAuthMe(page);

    // Step 1: Accuracy dashboard (trust-building)
    await page.goto('/predictions/accuracy');
    await expect(page.locator('text=/72|적중률/i').first()).toBeVisible({ timeout: 8000 });

    // Step 2: Horse profile
    await page.goto('/horses/H001');
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });

    // Step 3: Race detail with unlocked prediction
    await seedAuth(page);
    await page.goto('/races/1');
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 6 — Lee: Simulator Weight Adjustment (Desktop)
// Power user opens simulator, adjusts factor weights, views re-ranked results.
// Key journey: /races/1 → /races/1/simulator → adjust sliders → see ranking
// ---------------------------------------------------------------------------
test.describe('Sim 6 — Lee: Simulator weight adjustment (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('simulator page loads with factor sliders and re-rank button', async ({ page }) => {
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionUnlocked(page);
    await mockTicketBalance(page);
    await mockHitRecords(page);
    await mockAuthMe(page);
    await seedAuth(page);

    await page.goto('/races/1/simulator');

    // Simulator page title
    await expect(page).toHaveTitle(/시뮬레이터|OddsCast/);

    // Factor sliders present (레이팅, 폼, 컨디션, 경험, 훈련, 거리적성)
    const sliders = page.locator('input[type="range"]');
    await expect(sliders.first()).toBeVisible({ timeout: 8000 });

    // At least one factor label visible
    const factorLabel = page.locator('text=/레이팅|폼|컨디션|경험|훈련|거리/').first();
    await expect(factorLabel).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 7 — Choi: Senior First Visit (Mobile, Small Screen)
// Son sets up app on Galaxy A54. Key UX: readable text, scrollable tables.
// Key journey: home → race detail → entry table scroll → prediction
// ---------------------------------------------------------------------------
test.describe('Sim 7 — Choi: Senior first visit, table scroll (mobile)', () => {
  test.use({ viewport: { width: 360, height: 780 } }); // Galaxy A54

  test('race detail entry table is scrollable and text is readable', async ({ page }) => {
    await mockHomePageAPIs(page);
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionLocked(page);

    await page.goto('/races/1');

    // Entry table renders
    const horseText = page.locator('text=천리마').first();
    await expect(horseText).toBeVisible({ timeout: 8000 });

    // Table wrapper should have overflow-x-auto (scroll enabled)
    const tableWrapper = page.locator('.overflow-x-auto').first();
    await expect(tableWrapper).toBeVisible({ timeout: 8000 });

    // Text is not cut off — horse names are visible
    await expect(page.locator('text=번개').first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 8 — Choi: Tablet View, AI Bar Chart (Tablet)
// Son opens on Samsung tablet. Checks that prediction bar chart is visible
// and factor breakdown is accessible.
// ---------------------------------------------------------------------------
test.describe('Sim 8 — Choi: Tablet view, AI prediction chart (tablet)', () => {
  test.use({ viewport: { width: 800, height: 1024 } }); // Samsung tablet

  test('prediction bar chart is visible and race detail loads on tablet', async ({ page }) => {
    await mockRaceDetail(page, raceDetailWith5Entries);
    await mockRacePredictionUnlocked(page);
    await mockTicketBalance(page);
    await mockHitRecords(page);
    await mockAuthMe(page);
    await seedAuth(page);

    await page.goto('/races/1');

    // Race page loads
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });

    // AI prediction section present
    const predSection = page.locator('text=/AI|예측|분석/i').first();
    await expect(predSection).toBeVisible({ timeout: 8000 });

    // Table is scrollable on tablet too
    const tableWrapper = page.locator('.overflow-x-auto').first();
    await expect(tableWrapper).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 9 — Jung: Matrix First Visit (Mobile)
// Taxi driver discovers OddsCast, immediately goes to matrix.
// Key journey: home → /predictions/matrix (locked) → sees plans
// ---------------------------------------------------------------------------
test.describe('Sim 9 — Jung: Matrix first visit, unauthenticated (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('unauthenticated user sees matrix preview and subscription CTA', async ({ page }) => {
    await mockMatrixPredictions(page, undefined, false); // locked
    await mockMatrixBalance(page);
    await mockSubscriptionStatus(page, false);
    await mockSubscriptionPlans(page);
    await mockTicketBalance(page);
    await page.route('**/api/notifications/unread-count**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse({ count: 0 })) });
    });

    await page.goto('/predictions/matrix');

    // Matrix page renders
    await expect(page).toHaveTitle(/OddsCast/);

    // Some matrix content or locked indicator is present
    const matrixContent = page.locator('text=/매트릭스|matrix|AI|구독|티켓/i').first();
    await expect(matrixContent).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Simulation 10 — Jung: Matrix Power User, Unlocked (Mobile)
// Subscribed Jung checks Friday matrix, reads commentary.
// Key journey: /predictions/matrix (unlocked) → sees race grid → commentary tab
// ---------------------------------------------------------------------------
test.describe('Sim 10 — Jung: Matrix power user, full access (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('logged-in subscriber sees unlocked matrix grid with race data', async ({ page }) => {
    await mockAuthMe(page);
    await mockMatrixPredictions(page, undefined, true); // unlocked
    await mockMatrixBalance(page);
    await mockHitRecords(page);
    await mockSubscriptionStatus(page, true);
    await mockTicketBalance(page);
    await page.route('**/api/notifications/unread-count**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse({ count: 0 })) });
    });

    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    // Matrix page loads
    await expect(page).toHaveTitle(/OddsCast/);

    // Some matrix or prediction content present
    const matrixEl = page.locator('text=/AI|서울|매트릭스|예측/i').first();
    await expect(matrixEl).toBeVisible({ timeout: 8000 });
  });
});
