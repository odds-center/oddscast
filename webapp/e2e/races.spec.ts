/**
 * E2E: Race list and race detail flows
 */
import { test, expect } from '@playwright/test';
import {
  mockRaceList,
  mockRaceDetail,
  mockRacePredictionLocked,
  mockRacePredictionUnlocked,
  mockTicketBalance,
  mockAuthMe,
  mockGroupedResults,
  seedAuth,
  stubRace,
  stubRaceEntry,
  stubGroupedResult,
} from './fixtures/api-mocks';

test.describe('Race list', () => {
  test('home page renders race list section', async ({ page }) => {
    await mockRaceList(page);
    await page.goto('/');

    // The page title and basic structure should load
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('/races page shows race cards with race names', async ({ page }) => {
    await mockRaceList(page, [
      stubRace,
      { ...stubRace, id: '2', rcNo: '2', rcName: '서울 2경주' },
    ]);
    await page.goto('/races');

    // Desktop table shows "{meetName} {rcNo}R" in LinkBadge <a> elements
    // Use getByRole to target visible anchor links only (avoids hidden mobile card spans)
    await expect(page.getByRole('link', { name: /서울 1R/ }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /서울 2R/ }).first()).toBeVisible({ timeout: 8000 });
  });

  test('/races page shows loading state then races', async ({ page }) => {
    // Delay response to observe loading state
    await page.route('**/api/races**', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { races: [stubRace], total: 1, page: 1, totalPages: 1 },
          status: 200,
        }),
      });
    });

    await page.goto('/races');

    // Don't assert on exact timing, just confirm races appear eventually (shows "서울 1R")
    await expect(page.locator('text=/서울|1R/').first()).toBeVisible({ timeout: 10000 });
  });

  test('empty race list shows empty state', async ({ page }) => {
    await mockRaceList(page, []);
    await page.goto('/races');

    // DataFetchState empty message should appear
    const empty = page.locator('text=/경주|없습니다|found/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Race detail — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockRaceDetail(page, {
      ...stubRace,
      entries: [stubRaceEntry],
      results: [],
      dividends: [],
    });
    await mockRacePredictionLocked(page);
  });

  test('race detail page shows meet name and entries', async ({ page }) => {
    await page.goto('/races/1');

    // RaceHeaderCard shows meetName; entry table shows horse names (target table to avoid hidden mobile card)
    await expect(page.locator('text=서울').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').getByText('천리마').first()).toBeVisible({ timeout: 8000 });
  });

  test('race detail shows jockey and trainer name', async ({ page }) => {
    await page.goto('/races/1');

    await expect(page.locator('table').getByText('김철수').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Race detail — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockRaceDetail(page, {
      ...stubRace,
      entries: [stubRaceEntry],
      results: [],
      dividends: [],
    });
    await mockTicketBalance(page);
  });

  test('shows AI prediction section when prediction is unlocked', async ({ page }) => {
    await mockRacePredictionUnlocked(page);
    await page.goto('/races/1');

    // Seed auth to localStorage so the page sees user as logged in
    await seedAuth(page);
    await page.reload();

    await expect(
      page.locator('text=/AI|예측|분석|천리마/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows locked prediction prompt when no ticket used', async ({ page }) => {
    await mockRacePredictionLocked(page);
    await page.goto('/races/1');

    await seedAuth(page);
    await page.reload();

    // Some form of "unlock" or "need ticket" UI
    const lockedEl = page.locator('text=/예측권|잠금|unlock|티켓/i').first();
    await expect(lockedEl).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Race schedule page', () => {
  test('/races/schedule renders calendar or date picker', async ({ page }) => {
    await mockRaceList(page);
    await page.goto('/races/schedule');

    await expect(page).toHaveTitle(/일정|OddsCast/);
    // Should have some content (calendar, schedule etc.)
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Races page — unified view', () => {
  test('shows race cards with schedule info for upcoming races', async ({ page }) => {
    await mockRaceList(page, [stubRace]);
    await page.goto('/races');

    // Race card shows "서울 1R" (meetName + rcNoR)
    await expect(page.locator('text=/서울|1R/').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows inline results for completed races', async ({ page }) => {
    await mockRaceList(page, [{ ...stubRace, status: 'COMPLETED' }]);
    await mockGroupedResults(page, [stubGroupedResult]);
    await page.goto('/races');

    await expect(page.locator('text=천리마').last()).toBeVisible({ timeout: 8000 });
  });

  test('no separate results tab exists', async ({ page }) => {
    await mockRaceList(page, [stubRace]);
    await page.goto('/races');

    // Should NOT have a separate results tab button
    const tabBtn = page.locator('button').filter({ hasText: '경주 결과' });
    await expect(tabBtn).toHaveCount(0);
  });
});
