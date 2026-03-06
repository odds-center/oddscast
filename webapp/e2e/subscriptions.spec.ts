/**
 * E2E: Subscription plan list and checkout flow
 */
import { test, expect } from '@playwright/test';
import {
  mockSubscriptionPlans,
  mockSubscriptionStatus,
  mockAuthMe,
  seedAuth,
  stubSubscriptionPlan,
} from './fixtures/api-mocks';

test.describe('Subscription plans — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockSubscriptionPlans(page);
    await mockSubscriptionStatus(page, false);
  });

  test('shows plan list with name and price', async ({ page }) => {
    await page.goto('/mypage/subscriptions');

    await expect(page.locator('text=스탠다드').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=9,900').first()).toBeVisible();
  });

  test('shows ticket count per plan', async ({ page }) => {
    await page.goto('/mypage/subscriptions');

    // totalTickets = 7
    await expect(page.locator('text=/7장/').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows login prompt instead of subscribe button when not logged in', async ({ page }) => {
    await page.goto('/mypage/subscriptions');

    // Should show login CTA, not a "구독하기" button
    const loginCta = page.locator('text=/로그인/').first();
    await expect(loginCta).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Subscription plans — authenticated, no active subscription', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockSubscriptionPlans(page);
    await mockSubscriptionStatus(page, false);
  });

  test('shows subscribe button for each plan', async ({ page }) => {
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    const subscribeBtn = page.locator('text=구독하기').first();
    await expect(subscribeBtn).toBeVisible({ timeout: 8000 });
  });

  test('subscribe button links to checkout with planId param', async ({ page }) => {
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    const subscribeLink = page.locator(`a[href*="subscription-checkout?planId=${stubSubscriptionPlan.id}"]`).first();
    await expect(subscribeLink).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Subscription plans — authenticated, active subscription', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockSubscriptionPlans(page);
    await page.route('**/api/subscriptions/status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            isActive: true,
            planId: 'STANDARD',
            monthlyTickets: 7,
            daysUntilRenewal: 15,
          },
          status: 200,
        }),
      });
    });
    await page.route('**/api/subscriptions/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { subscriptions: [{ id: 1, planId: 1, status: 'ACTIVE', plan: { displayName: '스탠다드' } }] },
          status: 200,
        }),
      });
    });
  });

  test('shows current subscription card with renewal info', async ({ page }) => {
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    const renewalText = page.locator('text=/갱신|일 후/i').first();
    await expect(renewalText).toBeVisible({ timeout: 8000 });
  });

  test('shows cancel button for active subscription', async ({ page }) => {
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    const cancelBtn = page.locator('text=구독 취소').first();
    await expect(cancelBtn).toBeVisible({ timeout: 8000 });
  });

  test('cancel confirmation dialog appears on cancel click', async ({ page }) => {
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    await page.locator('text=구독 취소').first().click();

    // Confirmation dialog
    await expect(page.locator('text=/취소하시겠습니까|네, 취소합니다/i').first()).toBeVisible();
  });
});

test.describe('Subscription plan API error', () => {
  test('shows error state when plans API fails', async ({ page }) => {
    await page.route('**/api/subscriptions/plans**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });
    await mockSubscriptionStatus(page, false);

    await page.goto('/mypage/subscriptions');

    // DataFetchState error UI
    const errorEl = page.locator('text=/확인할 수 없습니다|오류|error|다시/i').first();
    await expect(errorEl).toBeVisible({ timeout: 8000 });
  });
});
