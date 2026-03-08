/**
 * E2E: Profile page and profile edit
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockPointBalance,
  mockTicketBalance,
  mockSubscriptionStatus,
  seedAuth,
  stubUser,
} from './fixtures/api-mocks';

async function setupProfile(page: import('@playwright/test').Page) {
  await mockAuthMe(page);
  await mockPointBalance(page);
  await mockTicketBalance(page);
  await mockSubscriptionStatus(page, false);
}

test.describe('Profile page — unauthenticated', () => {
  test('shows login prompt when not logged in', async ({ page }) => {
    // Profile page shows RequireLogin component (not a hard redirect)
    await page.goto('/profile');
    await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupProfile(page);
  });

  test('shows user display name', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    const name = page.locator(`text=${stubUser.name}`).first();
    await expect(name).toBeVisible({ timeout: 8000 });
  });

  test('shows point balance', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    // Point balance (1200pt)
    const pts = page.locator('text=/1,200|1200|pt/i').first();
    await expect(pts).toBeVisible({ timeout: 8000 });
  });

  test('shows prediction ticket balance', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    // RACE tickets: 2장
    const tickets = page.locator('text=/2장|2 장|예측권/i').first();
    await expect(tickets).toBeVisible({ timeout: 8000 });
  });

  test('shows navigation menu links', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    // Should have link to subscriptions
    const subLink = page.locator('a[href*="subscriptions"]').first();
    await expect(subLink).toBeVisible({ timeout: 8000 });
  });

  test('shows consecutive login days', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    // consecutiveLoginDays = 1
    const streak = page.locator('text=/연속|1일|streak/i').first();
    await expect(streak).toBeVisible({ timeout: 8000 });
  });

  test('has link to profile edit page', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    const editLink = page.locator('a[href*="/profile/edit"]').first();
    await expect(editLink).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Profile edit page', () => {
  test('shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile/edit');
    await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('renders name and nickname fields when logged in', async ({ page }) => {
    await mockAuthMe(page);
    // Mock profile update
    await page.route('**/api/auth/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {}, status: 200 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: stubUser, status: 200 }),
        });
      }
    });

    await page.goto('/profile/edit');
    await seedAuth(page);
    await page.reload();

    // Name input
    const nameInput = page.locator('input[name="name"], input[placeholder*="이름"]').first();
    await expect(nameInput).toBeVisible({ timeout: 8000 });
  });
});
