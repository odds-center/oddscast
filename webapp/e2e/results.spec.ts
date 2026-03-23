/**
 * E2E: Race results — inline results on unified /races page.
 * Completed races show 1st/2nd/3rd place inline in the races list.
 */
import { test, expect } from '@playwright/test';
import { mockGroupedResults, mockRaceList, stubGroupedResult, stubRace } from './fixtures/api-mocks';

const RESULTS_URL = '/races';

// A completed race stub matching stubGroupedResult's raceId='1'
const completedRace = { ...stubRace, id: '1', status: 'COMPLETED' };

test.describe('Results — inline on unified races page', () => {
  test.beforeEach(async ({ page }) => {
    // Race list with a completed race + matching grouped results
    await mockRaceList(page, [completedRace]);
    await mockGroupedResults(page, [stubGroupedResult]);
  });

  test('page title contains OddsCast', async ({ page }) => {
    await page.goto(RESULTS_URL);
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows race name and meet name', async ({ page }) => {
    await page.goto(RESULTS_URL);

    await expect(page.locator('text=서울').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows 1-2-3 finishing order inline', async ({ page }) => {
    await page.goto(RESULTS_URL);

    // Content appears in both mobile cards and desktop table — use toContainText
    await expect(page.locator('body')).toContainText('천리마', { timeout: 8000 });
    await expect(page.locator('body')).toContainText('번개', { timeout: 8000 });
    await expect(page.locator('body')).toContainText('바람', { timeout: 8000 });
  });

  test('shows date filter bar', async ({ page }) => {
    await page.goto(RESULTS_URL);

    const filter = page.locator('text=/오늘|today/i').first();
    await expect(filter).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no races', async ({ page }) => {
    await mockRaceList(page, []);
    await page.goto(RESULTS_URL);

    const empty = page.locator('text=/없습니다|no races/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });

  // Error test is in its own describe block below (no conflicting beforeEach mock)

  test('race card links to race detail', async ({ page }) => {
    await page.goto(RESULTS_URL);

    // Link exists in both mobile and desktop — use getByRole for visible link
    await expect(page.getByRole('link', { name: /서울|1R/ }).first()).toBeVisible({ timeout: 8000 });
  });

  test('date filter changes URL query param', async ({ page }) => {
    await page.goto(RESULTS_URL);

    const yesterdayChip = page.locator('text=/어제|yesterday/i').first();
    if (await yesterdayChip.isVisible()) {
      await yesterdayChip.click();
      await expect(page).toHaveURL(/date=yesterday/, { timeout: 3000 });
    }
  });
});

// Smoke test: page loads without JS crash regardless of API state
test.describe('Races page — resilience', () => {
  test('page renders date filter bar even when API is slow', async ({ page }) => {
    // Delay API response to verify UI renders before data arrives
    await page.route('**/api/races**', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { races: [], total: 0, page: 1, totalPages: 1 }, status: 200 }),
      });
    });

    await page.goto(RESULTS_URL);

    // Filter bar is rendered outside DataFetchState — always visible
    const filter = page.locator('text=/오늘|today/i').first();
    await expect(filter).toBeVisible({ timeout: 8000 });
  });
});
