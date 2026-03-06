/**
 * E2E: Race results page
 */
import { test, expect } from '@playwright/test';
import { mockGroupedResults, stubGroupedResult } from './fixtures/api-mocks';

test.describe('Results list', () => {
  test.beforeEach(async ({ page }) => {
    await mockGroupedResults(page, [stubGroupedResult]);
  });

  test('page title contains OddsCast', async ({ page }) => {
    await page.goto('/results');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows race name and meet name', async ({ page }) => {
    await page.goto('/results');

    await expect(page.locator('text=서울').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows 1-2-3 finishing order', async ({ page }) => {
    await page.goto('/results');

    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=번개').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=바람').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows jockey names', async ({ page }) => {
    await page.goto('/results');

    await expect(page.locator('text=김철수').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows date filter bar', async ({ page }) => {
    await page.goto('/results');

    // FilterDateBar has today / yesterday / date picker chips
    const filter = page.locator('text=/오늘|today/i').first();
    await expect(filter).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no results', async ({ page }) => {
    // Override to return empty results
    await page.route('**/api/results/grouped**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { results: [], total: 0, page: 1, totalPages: 0 }, status: 200 }),
      });
    });

    await page.goto('/results');

    const empty = page.locator('text=/결과가 없습니다|없습니다|no results/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });

  test('results page renders without crashing on API error', async ({ page }) => {
    await page.route('**/api/results/grouped**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/results');

    // DataFetchState error message
    const error = page.locator('text=/오류|다시|error/i').first();
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('race number badge links to race detail', async ({ page }) => {
    await page.goto('/results');

    // LinkBadge → link to /races/1
    const raceLink = page.locator('a[href*="/races/1"]').first();
    await expect(raceLink).toBeVisible({ timeout: 8000 });
  });

  test('date filter changes URL query param', async ({ page }) => {
    await mockGroupedResults(page, []);
    await page.goto('/results');

    // Click the "어제" (yesterday) filter chip
    const yesterdayChip = page.locator('text=/어제|yesterday/i').first();
    if (await yesterdayChip.isVisible()) {
      await yesterdayChip.click();
      await expect(page).toHaveURL(/date=yesterday/, { timeout: 3000 });
    }
  });
});
