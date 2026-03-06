/**
 * E2E: Detail pages — horses, jockeys, trainers, weekly preview, ranking
 */
import { test, expect } from '@playwright/test';
import {
  mockHorseProfile,
  mockJockeyProfile,
  mockTrainerProfile,
  mockWeeklyPreview,
  mockRankings,
  mockAuthMe,
  seedAuth,
  stubHorse,
  stubJockey,
  stubWeeklyPreview,
  stubRanking,
} from './fixtures/api-mocks';

// -------------------------------------------------------------------
// Horse profile
// -------------------------------------------------------------------
test.describe('Horse profile page', () => {
  test.beforeEach(async ({ page }) => {
    await mockHorseProfile(page, 'H001');
  });

  test('page renders horse name', async ({ page }) => {
    await page.goto('/horses/H001');

    await expect(page.locator(`text=${stubHorse.hrName}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('shows trainer name', async ({ page }) => {
    await page.goto('/horses/H001');

    await expect(page.locator(`text=${stubHorse.trName}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('shows page title with OddsCast', async ({ page }) => {
    await page.goto('/horses/H001');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/horses/H002**', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: '말 정보를 찾을 수 없습니다.' }) });
    });

    await page.goto('/horses/H002');

    const error = page.locator('text=/찾을 수 없습니다|오류|error/i').first();
    await expect(error).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Jockey profile
// -------------------------------------------------------------------
test.describe('Jockey profile page', () => {
  test.beforeEach(async ({ page }) => {
    await mockJockeyProfile(page, 'J001');
  });

  test('page renders jockey name', async ({ page }) => {
    await page.goto('/jockeys/J001');

    await expect(page.locator(`text=${stubJockey.jkName}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('shows page title with OddsCast', async ({ page }) => {
    await page.goto('/jockeys/J001');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows empty history state gracefully', async ({ page }) => {
    await page.goto('/jockeys/J001');

    // Either table with no rows or empty state message
    const content = page.locator('main').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Trainer profile
// -------------------------------------------------------------------
test.describe('Trainer profile page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTrainerProfile(page, '박감독');
  });

  test('page renders trainer name', async ({ page }) => {
    await page.goto('/trainers/%EB%B0%95%EA%B0%90%EB%8F%85');

    await expect(page.locator('text=박감독').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows page title with OddsCast', async ({ page }) => {
    await page.goto('/trainers/%EB%B0%95%EA%B0%90%EB%8F%85');
    await expect(page).toHaveTitle(/OddsCast/);
  });
});

// -------------------------------------------------------------------
// Weekly preview
// -------------------------------------------------------------------
test.describe('Weekly preview page', () => {
  test.beforeEach(async ({ page }) => {
    await mockWeeklyPreview(page);
  });

  test('page title contains OddsCast', async ({ page }) => {
    await page.goto('/weekly-preview');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows weekly preview highlights', async ({ page }) => {
    await page.goto('/weekly-preview');

    await expect(
      page.locator('text=서울 경마장에서 특별경주').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows horses to watch', async ({ page }) => {
    await page.goto('/weekly-preview');

    // stubWeeklyPreview.content.horsesToWatch[0].hrName = 천리마
    await expect(page.locator('text=천리마').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows track condition', async ({ page }) => {
    await page.goto('/weekly-preview');

    // trackConditions: 良馬場
    await expect(page.locator('text=/양마장|良馬場|track/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no preview available', async ({ page }) => {
    await page.route('**/api/weekly-preview**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, status: 200 }),
      });
    });

    await page.goto('/weekly-preview');

    const empty = page.locator('text=/없습니다|준비 중|아직/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Ranking page
// -------------------------------------------------------------------
test.describe('Ranking page', () => {
  test.beforeEach(async ({ page }) => {
    await mockRankings(page);
  });

  test('page title contains OddsCast', async ({ page }) => {
    await page.goto('/ranking');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('shows top ranked users', async ({ page }) => {
    await page.goto('/ranking');

    await expect(page.locator('text=User A').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=User B').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows rank numbers', async ({ page }) => {
    await page.goto('/ranking');

    // Rank 1 and 2
    const rankOne = page.locator('text=/^1$|1위|1등/i').first();
    await expect(rankOne).toBeVisible({ timeout: 8000 });
  });

  test('shows correct prediction counts', async ({ page }) => {
    await page.goto('/ranking');

    // correctCount: 25
    const count = page.locator('text=/25/').first();
    await expect(count).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no rankings', async ({ page }) => {
    await page.route('**/api/rankings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { rankings: [], total: 0, myRank: null }, status: 200 }),
      });
    });

    await page.goto('/ranking');

    const empty = page.locator('text=/없습니다|순위가 없습니다/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Legal pages (static, no API)
// -------------------------------------------------------------------
test.describe('Legal pages', () => {
  test('terms page renders', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page).toHaveTitle(/OddsCast/);
    const heading = page.locator('h1, h2').filter({ hasText: /이용약관|terms/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page).toHaveTitle(/OddsCast/);
    const heading = page.locator('h1, h2').filter({ hasText: /개인정보|privacy/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('refund policy page renders', async ({ page }) => {
    await page.goto('/legal/refund');
    await expect(page).toHaveTitle(/OddsCast/);
    const heading = page.locator('h1, h2').filter({ hasText: /환불|refund/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});
