/**
 * E2E: Predictions — matrix guide and accuracy dashboard
 */
import { test, expect } from '@playwright/test';
import {
  mockMatrixPredictions,
  mockAccuracyStats,
  mockTicketBalance,
  mockAuthMe,
  mockSubscriptionStatus,
  seedAuth,
  stubMatrixPrediction,
  stubAccuracyStats,
} from './fixtures/api-mocks';

// -------------------------------------------------------------------
// Accuracy dashboard (public)
// -------------------------------------------------------------------
test.describe('Prediction accuracy page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAccuracyStats(page);
  });

  test('page title contains OddsCast', async ({ page }) => {
    await page.goto('/predictions/accuracy');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows overall accuracy stats', async ({ page }) => {
    await page.goto('/predictions/accuracy');

    // overall.accuracy3 = 72(%)
    const accuracyEl = page.locator('text=/72|적중률|accuracy/i').first();
    await expect(accuracyEl).toBeVisible({ timeout: 8000 });
  });

  test('shows monthly breakdown table', async ({ page }) => {
    await page.goto('/predictions/accuracy');

    // byMonth entry: 2025-02
    const monthEl = page.locator('text=/2025|2월/i').first();
    await expect(monthEl).toBeVisible({ timeout: 8000 });
  });

  test('shows meet breakdown table', async ({ page }) => {
    await page.goto('/predictions/accuracy');

    // byMeet entry: 서울
    const meetEl = page.locator('text=서울').first();
    await expect(meetEl).toBeVisible({ timeout: 8000 });
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/predictions/accuracy-stats**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/predictions/accuracy');

    const error = page.locator('text=/오류|다시|error/i').first();
    await expect(error).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Matrix guide (requires login + matrix ticket)
// -------------------------------------------------------------------
test.describe('Prediction matrix page — unauthenticated', () => {
  test('shows login prompt when not logged in', async ({ page }) => {
    await mockMatrixPredictions(page, [], false);
    await page.goto('/predictions/matrix');

    const loginCta = page.locator('text=/로그인|login/i').first();
    await expect(loginCta).toBeVisible({ timeout: 8000 });
  });

  test('page renders title and date filter', async ({ page }) => {
    await mockMatrixPredictions(page, []);
    await page.goto('/predictions/matrix');

    await expect(page).toHaveTitle(/OddsCast/);
    const heading = page.locator('h1, h2').filter({ hasText: /종합|매트릭스|matrix/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Prediction matrix page — authenticated, unlocked', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockSubscriptionStatus(page, false);
    await mockMatrixPredictions(page, [stubMatrixPrediction], true);
  });

  test('shows prediction matrix table with horse scores', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows win probability for top horses', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    // winProb: 35
    const probEl = page.locator('text=/35%|35|winProb/i').first();
    await expect(probEl).toBeVisible({ timeout: 10000 });
  });

  test('shows race name and number', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('text=봄 개막 특별경주').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Prediction matrix page — authenticated, locked', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockSubscriptionStatus(page, false);
    await mockMatrixPredictions(page, [], false);
  });

  test('shows unlock / purchase prompt', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    // Should show some form of unlock CTA or lock icon
    const lockEl = page.locator('text=/잠금|티켓|구매|1,000원/i').first();
    await expect(lockEl).toBeVisible({ timeout: 10000 });
  });
});
