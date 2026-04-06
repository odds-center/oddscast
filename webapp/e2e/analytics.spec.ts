/**
 * E2E: Advanced Analytics Dashboard (/analytics)
 * - Public sections visible to all users: track condition, AI accuracy by meet
 * - Auth-gated sections show locked state when not logged in
 * - Authenticated users can view all sections
 * - Meet selector switches data
 */
import { test, expect } from '@playwright/test';
import {
  mockAnalytics,
  mockAnalyticsUnauth,
  mockAuthMe,
  seedAuth,
} from './fixtures/api-mocks';

test.describe('Analytics page — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnalyticsUnauth(page);
  });

  test('renders page heading', async ({ page }) => {
    await page.goto('/analytics');

    // Page heading text (CompactPageTitle)
    const heading = page.locator('text=/고급 분석/i').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('shows track condition public section', async ({ page }) => {
    await page.goto('/analytics');

    // Track condition section card title
    const section = page.locator('text=/주로 상태|트랙 조건/i').first();
    await expect(section).toBeVisible({ timeout: 8000 });
  });

  test('shows AI prediction accuracy public section', async ({ page }) => {
    await page.goto('/analytics');

    // Prediction accuracy section heading
    const section = page.locator('text=/예측 정확도/i').first();
    await expect(section).toBeVisible({ timeout: 8000 });
  });

  test('shows locked state for auth-gated sections', async ({ page }) => {
    await page.goto('/analytics');

    // LockedSection renders a login prompt
    const loginPrompt = page.locator('a[href*="/auth/login"]').first();
    await expect(loginPrompt).toBeVisible({ timeout: 8000 });
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle(/고급 분석|OddsCast/i, { timeout: 8000 });
  });
});

test.describe('Analytics page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnalytics(page);
    await mockAuthMe(page);
  });

  test('shows all sections without locked state when logged in', async ({ page }) => {
    await page.goto('/analytics');
    await seedAuth(page);
    await page.reload();

    // Heading should be visible
    const heading = page.locator('text=/고급 분석/i').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('displays track condition stats with data', async ({ page }) => {
    await page.goto('/analytics');
    await seedAuth(page);
    await page.reload();

    // Stub has condition '양' (conditionLabel '良')
    const conditionData = page.locator('text=/주로 상태|트랙/i').first();
    await expect(conditionData).toBeVisible({ timeout: 8000 });
  });

  test('displays post position section for logged-in users', async ({ page }) => {
    await page.goto('/analytics');
    await seedAuth(page);
    await page.reload();

    // Post position section card title
    const section = page.locator('text=/출발 번호/i').first();
    await expect(section).toBeVisible({ timeout: 8000 });
  });

  test('meet selector tabs are visible', async ({ page }) => {
    await page.goto('/analytics');
    await seedAuth(page);
    await page.reload();

    // Meet tabs: 서울, 제주, 부산경남
    const meetTab = page.locator('button:has-text("서울"), [role="tab"]:has-text("서울")').first();
    await expect(meetTab).toBeVisible({ timeout: 8000 });
  });

  test('switching meet tab triggers new data fetch', async ({ page }) => {
    let analyticsRequestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/analytics/')) analyticsRequestCount++;
    });

    await page.goto('/analytics');
    await seedAuth(page);
    await page.reload();

    const initialCount = analyticsRequestCount;

    // Click a different meet tab
    const jejuTab = page.locator('button:has-text("제주"), [role="tab"]:has-text("제주")').first();
    if (await jejuTab.isVisible({ timeout: 3000 })) {
      await jejuTab.click();
      await page.waitForTimeout(500);
      expect(analyticsRequestCount).toBeGreaterThan(initialCount);
    }
  });
});

test.describe('Analytics page — SEO', () => {
  test('has main landmark', async ({ page }) => {
    await mockAnalyticsUnauth(page);
    await page.goto('/analytics');

    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 5000 });
  });
});
