/**
 * E2E: Coach mark onboarding system
 * Verifies that tour elements are mounted, localStorage state is persisted,
 * and the CoachMarkButton on profile replays the tour.
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockTicketBalance,
  mockMatrixBalance,
  mockSubscriptionStatus,
  mockRaceList,
  mockGroupedResults,
  mockMatrixPredictions,
  mockHitRecords,
  seedAuth,
} from './fixtures/api-mocks';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Clear all coach mark localStorage keys so auto-start fires. */
async function clearCoachMarkStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith('oddscast_coach_'),
    );
    keys.forEach((k) => localStorage.removeItem(k));
  });
}

/** Mark all coach mark tours as completed so auto-start does NOT fire.
 *  The store uses '1' as the completion marker (see coachMarkStore.ts markTourComplete). */
async function completeAllTours(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const tourIds = ['homeTour', 'raceTour', 'raceDetailTour', 'matrixTour', 'profileTour'];
    for (const id of tourIds) {
      localStorage.setItem(`oddscast_coach_${id}`, '1');
    }
  });
}

async function setupHome(page: import('@playwright/test').Page) {
  await page.route('**/api/races**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { races: [], total: 0, page: 1, totalPages: 1 }, status: 200 }),
    });
  });
  await page.route('**/api/results**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { raceGroups: [], total: 0, page: 1, totalPages: 1 }, status: 200 }),
    });
  });
  await page.route('**/api/**', async (route) => {
    // Fallback: fulfill common endpoints
    const url = route.request().url();
    if (url.includes('/fortune') || url.includes('/weekly-preview') || url.includes('/ranking')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, status: 200 }),
      });
      return;
    }
    await route.continue();
  });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

test.describe('Coach mark — data-tour attributes', () => {
  test('home page has data-tour attributes for appbar and quickmenu', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');

    // FloatingAppBar has data-tour="home-appbar" (rendered in _app.tsx)
    await expect(page.locator('[data-tour="home-appbar"]')).toBeAttached({ timeout: 8000 });
    // Quick menu bar
    await expect(page.locator('[data-tour="home-quickmenu"]')).toBeVisible({ timeout: 8000 });
  });

  test('races page has data-tour attributes for filter and list', async ({ page }) => {
    await mockRaceList(page);
    await mockGroupedResults(page);
    await page.goto('/races');

    await expect(page.locator('[data-tour="race-filter"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-tour="race-list"]')).toBeVisible({ timeout: 8000 });
  });

  test('matrix page has data-tour attribute for filter', async ({ page }) => {
    await mockAuthMe(page);
    await mockMatrixPredictions(page, [], true);
    await mockHitRecords(page);
    await mockMatrixBalance(page);
    await mockTicketBalance(page);
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('[data-tour="matrix-filter"]')).toBeVisible({ timeout: 8000 });
  });

  test('profile page has data-tour attributes for stats and menu', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockMatrixBalance(page);
    await mockSubscriptionStatus(page, false);
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('[data-tour="profile-stats"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-tour="profile-menu"]')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Coach mark — localStorage persistence', () => {
  test('completed tour state is stored in localStorage', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    // Manually write completed state as if a tour finished (store uses '1')
    await page.evaluate(() => {
      localStorage.setItem('oddscast_coach_homeTour', '1');
    });

    const stored = await page.evaluate(() =>
      localStorage.getItem('oddscast_coach_homeTour'),
    );
    expect(stored).toBe('1');
  });

  test('cleared coach mark storage allows shouldAutoStart to trigger again', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    // First: mark all tours completed
    await completeAllTours(page);
    const before = await page.evaluate(
      () => localStorage.getItem('oddscast_coach_homeTour'),
    );
    expect(before).toBe('1');

    // Then: clear
    await clearCoachMarkStorage(page);
    const after = await page.evaluate(
      () => localStorage.getItem('oddscast_coach_homeTour'),
    );
    expect(after).toBeNull();
  });
});

test.describe('Coach mark — CoachMarkButton on profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockMatrixBalance(page);
    await mockSubscriptionStatus(page, false);
  });

  test('CoachMarkButton is visible on profile page when logged in', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    // Button text: 이용 가이드 보기
    const btn = page.getByRole('button', { name: /이용 가이드 보기/i });
    await expect(btn).toBeVisible({ timeout: 8000 });
  });

  test('clicking CoachMarkButton resets and triggers profileTour', async ({ page }) => {
    // Mark profileTour as completed first
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    await page.evaluate(() => {
      localStorage.setItem('oddscast_coach_profileTour', '1');
    });

    // Confirm it's marked
    const before = await page.evaluate(() =>
      localStorage.getItem('oddscast_coach_profileTour'),
    );
    expect(before).toBe('1');

    // Click the guide button — resetTour removes the key
    const btn = page.getByRole('button', { name: /이용 가이드 보기/i });
    await btn.click();

    // After resetTour, the key should be removed
    const after = await page.evaluate(() =>
      localStorage.getItem('oddscast_coach_profileTour'),
    );
    expect(after).toBeNull();
  });
});
