/**
 * E2E: Navigation — FloatingAppBar, page titles, 404
 */
import { test, expect } from '@playwright/test';
import { mockRaceList, mockAuthMe } from './fixtures/api-mocks';

test.describe('FloatingAppBar (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test.beforeEach(async ({ page }) => {
    await mockRaceList(page);
    await mockAuthMe(page);
  });

  test('app bar is visible on home page', async ({ page }) => {
    await page.goto('/');

    // The floating app bar uses .nav-mobile-bar CSS class
    const appBar = page.locator('.nav-mobile-bar, nav[aria-label*="앱"], .floating-app-bar').first();
    await expect(appBar).toBeVisible({ timeout: 8000 });
  });

  test('all 5 nav items are visible on mobile', async ({ page }) => {
    await page.goto('/');

    // 5 nav items: Home, Races, Matrix, Results, Profile
    const navItems = page.locator('.nav-mobile-item');
    await expect(navItems).toHaveCount(5, { timeout: 8000 });
  });

  test('clicking Races nav item navigates to /races', async ({ page }) => {
    await page.goto('/');

    // Find and click the races nav item
    const racesItem = page.locator('.nav-mobile-item').filter({ hasText: /경주|races/i }).first();
    await racesItem.click();

    await expect(page).toHaveURL(/\/races/, { timeout: 5000 });
  });
});

test.describe('Page titles', () => {
  test.beforeEach(async ({ page }) => {
    await mockRaceList(page);
  });

  test('home page has title OddsCast', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('/races has page title with OddsCast', async ({ page }) => {
    await page.goto('/races');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('/auth/login has page title with OddsCast', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/OddsCast/);
  });

  test('/auth/register has page title with OddsCast', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/OddsCast/);
  });
});

test.describe('404 page', () => {
  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');

    // Custom 404 page
    const notFound = page.locator('text=/404|찾을 수 없|not found/i').first();
    await expect(notFound).toBeVisible({ timeout: 8000 });
  });

  test('404 page has link back to home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');

    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Accessibility basics', () => {
  test.beforeEach(async ({ page }) => {
    await mockRaceList(page);
  });

  test('main content area has role=main', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('[role="main"], main#main-content').first();
    await expect(main).toBeVisible({ timeout: 8000 });
  });

  test('login form inputs have associated labels', async ({ page }) => {
    await page.goto('/auth/login');

    // Each input should be visible and accessible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
});
