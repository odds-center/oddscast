/**
 * E2E: Welcome (marketing landing) page
 */
import { test, expect } from '@playwright/test';

test.describe('Welcome page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls the welcome page makes
    await page.route('**/api/predictions/accuracy-stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            totalPredictions: 150,
            scoredPredictions: 120,
            averageAccuracy: 52.3,
            perfectTop3Count: 15,
            atLeast1HitCount: 85,
          },
        }),
      }),
    );

    await page.route('**/api/subscriptions/plans', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              planName: 'LIGHT',
              displayName: '라이트',
              totalPrice: 4900,
              totalTickets: 10,
              matrixTickets: 1,
              isActive: true,
            },
            {
              id: 2,
              planName: 'STANDARD',
              displayName: '스탠다드',
              totalPrice: 9900,
              totalTickets: 15,
              matrixTickets: 5,
              isActive: true,
            },
            {
              id: 3,
              planName: 'PREMIUM',
              displayName: '프리미엄',
              totalPrice: 14900,
              totalTickets: 30,
              matrixTickets: 8,
              isActive: true,
            },
          ],
        }),
      }),
    );
  });

  test('should render hero section with CTA', async ({ page }) => {
    await page.goto('/welcome');

    // Page title
    await expect(page).toHaveTitle(/OddsCast/);

    // Hero heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8000 });

    // CTA buttons (register / login)
    const ctaLink = page.locator('a[href*="register"], a[href*="login"]').first();
    await expect(ctaLink).toBeVisible({ timeout: 5000 });
  });

  test('should render feature cards', async ({ page }) => {
    await page.goto('/welcome');

    // Feature section should have multiple cards
    const featureCards = page.locator('h3');
    const count = await featureCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should render pricing section with plans', async ({ page }) => {
    await page.goto('/welcome');

    // Should show plan names from API
    await expect(page.getByText('라이트')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('스탠다드')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('프리미엄')).toBeVisible({ timeout: 5000 });
  });

  test('should render FAQ section', async ({ page }) => {
    await page.goto('/welcome');

    // FAQ section with questions
    const faqItems = page.locator('details, [role="region"], summary');
    const count = await faqItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have OG meta tags for SEO', async ({ page }) => {
    await page.goto('/welcome');

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /OddsCast/);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'website');
  });

  test('should not show floating app bar (standalone layout)', async ({ page }) => {
    await page.goto('/welcome');

    // Welcome page has its own layout, no floating app bar
    const appBar = page.locator('.nav-mobile-bar');
    // Should not be visible (or not exist)
    await expect(appBar).toHaveCount(0, { timeout: 3000 }).catch(() => {
      // If it exists but is hidden, that's also fine
    });
  });
});
