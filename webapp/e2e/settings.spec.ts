/**
 * E2E: Settings — notification preferences
 */
import { test, expect } from '@playwright/test';
import {
  mockNotificationPrefs,
  mockAuthMe,
  seedAuth,
} from './fixtures/api-mocks';

test.describe('Notification settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockNotificationPrefs(page);
    // Mock PATCH for saving prefs
    await page.route('**/api/notifications/preferences**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              pushEnabled: true,
              raceEnabled: true,
              predictionEnabled: true,
              subscriptionEnabled: true,
              systemEnabled: true,
              promotionEnabled: false,
            },
            status: 200,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {}, status: 200 }),
        });
      }
    });
  });

  test('shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/settings/notifications');

    await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows notification preference toggles when logged in', async ({ page }) => {
    await page.goto('/settings/notifications');
    await seedAuth(page);
    await page.reload();

    // Radix Switch renders as button[role="switch"]
    const toggles = page.locator('button[role="switch"], [data-slot="switch"]');
    await expect(toggles.first()).toBeVisible({ timeout: 8000 });
  });

  test('settings page renders without crashing', async ({ page }) => {
    await page.goto('/settings/notifications');
    await seedAuth(page);
    await page.reload();

    // Page title or heading should be present
    const heading = page.locator('h1, h2').filter({ hasText: /알림|설정|notification/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Settings menu', () => {
  test('renders settings menu items', async ({ page }) => {
    await mockAuthMe(page);
    await page.goto('/settings');
    await seedAuth(page);
    await page.reload();

    // Should contain notification settings link
    const notifLink = page.locator('a[href*="notifications"]').first();
    await expect(notifLink).toBeVisible({ timeout: 8000 });
  });

  test('delete account link is present', async ({ page }) => {
    await mockAuthMe(page);
    await page.goto('/settings');
    await seedAuth(page);
    await page.reload();

    // Settings page uses "회원탈퇴" (not "계정 삭제")
    const deleteLink = page.locator('a[href*="delete-account"]').or(page.getByText('회원탈퇴')).first();
    await expect(deleteLink).toBeVisible({ timeout: 8000 });
  });
});
