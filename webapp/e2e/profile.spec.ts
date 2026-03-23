/**
 * E2E: Profile page and profile edit
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockTicketBalance,
  mockMatrixBalance,
  mockSubscriptionStatus,
  seedAuth,
  stubUser,
} from './fixtures/api-mocks';

async function setupProfile(page: import('@playwright/test').Page) {
  await mockAuthMe(page);
  await mockTicketBalance(page);
  await mockMatrixBalance(page);
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

    await expect(page.locator('body')).toContainText(stubUser.name, { timeout: 8000 });
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

    // MenuList renders <a> links — use getByRole to target visible links
    await expect(page.getByRole('link', { name: /구독/ }).first()).toBeVisible({ timeout: 8000 });
  });

  test('has link to profile edit page', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    await expect(page.getByRole('link', { name: /프로필 수정/ }).first()).toBeVisible({ timeout: 8000 });
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
