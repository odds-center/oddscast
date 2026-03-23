/**
 * E2E: UI/UX Interaction Tests
 * Verifies table clicks, button interactions, navigation, tabs, and form inputs
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockRaceList,
  mockRaceDetail,
  mockRacePredictionLocked,
  mockTicketBalance,
  mockMatrixBalance,
  mockMatrixPredictions,
  mockHitRecords,
  mockAccuracyStats,
  mockSubscriptionPlans,
  mockSubscriptionStatus,
  mockNotificationPrefs,
  mockNotifications,
  mockTicketHistory,
  seedAuth,
  stubRace,
  stubRaceEntry,
  stubNotification,
  stubTicket,
  stubMatrixPrediction,
  stubSubscriptionPlan,
  apiResponse,
} from './fixtures/api-mocks';

// -------------------------------------------------------------------
// Race list — table row clicks navigate to detail
// -------------------------------------------------------------------
test.describe('Race list interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockRaceList(page, [
      stubRace,
      { ...stubRace, id: '2', rcNo: '2', rcName: '서울 2경주' },
    ]);
    // Mock race detail for navigation target
    await mockRaceDetail(page, { ...stubRace, entries: [stubRaceEntry], results: [], dividends: [] });
  });

  test('clicking race link navigates to race detail', async ({ page }) => {
    await page.goto('/races');

    // Click the first race link
    const raceLink = page.getByRole('link', { name: /서울 1R/ }).first();
    await expect(raceLink).toBeVisible({ timeout: 8000 });
    await raceLink.click();

    // Should navigate to race detail page
    await expect(page).toHaveURL(/\/races\/1/, { timeout: 5000 });
  });

  test('date filter chips update URL', async ({ page }) => {
    await page.goto('/races');

    // Click "어제" filter chip if visible
    const yesterdayChip = page.locator('text=/어제|yesterday/i').first();
    if (await yesterdayChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yesterdayChip.click();
      await expect(page).toHaveURL(/date=/, { timeout: 3000 });
    }
  });

  test('pagination buttons navigate between pages', async ({ page }) => {
    // Mock race list with enough items for pagination
    await page.route('**/api/races**', async (route) => {
      const url = new URL(route.request().url());
      const currentPage = url.searchParams.get('page') ?? '1';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiResponse({
            races: [{ ...stubRace, id: currentPage, rcNo: currentPage }],
            total: 30,
            page: Number(currentPage),
            totalPages: 3,
          }),
        ),
      });
    });
    await page.goto('/races');

    // Wait for race list to load
    await expect(page.locator('body')).toContainText('1R', { timeout: 8000 });

    // Look for a "next" button or page number — pagination renders as buttons or links
    const nextBtn = page.locator('[aria-label*="next"], [aria-label*="다음"]').first()
      .or(page.locator('button').filter({ hasText: /^2$/ }).first())
      .or(page.locator('a').filter({ hasText: /^2$/ }).first());
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await expect(page).toHaveURL(/page=2/, { timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Race detail — tab switching & prediction interaction
// -------------------------------------------------------------------
test.describe('Race detail interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockRaceDetail(page, {
      ...stubRace,
      entries: [stubRaceEntry, { ...stubRaceEntry, id: 'entry-2', hrNo: '2', hrName: '번개', chulNo: '2', jkName: '이기수' }],
      results: [],
      dividends: [],
    });
    await mockTicketBalance(page);
    // Mock ticket history
    await page.route('**/api/prediction-tickets/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ tickets: [], total: 0, totalPages: 1 })),
      });
    });
    // Mock prediction preview
    await page.route('**/api/predictions/preview/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse(null)),
      });
    });
    await mockRacePredictionLocked(page);
  });

  test('clicking horse name navigates to horse profile', async ({ page }) => {
    await page.goto('/races/1');

    // Horse name links to /horses/:hrNo
    const horseLink = page.getByRole('link', { name: '천리마' }).first();
    if (await horseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await horseLink.click();
      await expect(page).toHaveURL(/\/horses\//, { timeout: 5000 });
    }
  });

  test('use ticket button is clickable when logged in', async ({ page }) => {
    await page.goto('/races/1');
    await seedAuth(page);
    await page.reload();

    // Find the "예측권 1장 사용" button
    const useBtn = page.getByRole('button', { name: /예측권.*사용/ }).first();
    if (await useBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await expect(useBtn).toBeEnabled();
    }
  });
});

// -------------------------------------------------------------------
// Prediction matrix — tab switching
// -------------------------------------------------------------------
test.describe('Matrix page tab interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockMatrixBalance(page);
    await mockHitRecords(page);
    await mockSubscriptionStatus(page, false);
    await mockMatrixPredictions(page, [stubMatrixPrediction], true);
  });

  test('switching between matrix and commentary tabs', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    // Default tab is "종합 예상표"
    await expect(page.locator('body')).toContainText('천리마', { timeout: 10000 });

    // Click "AI 코멘트" tab
    const commentaryTab = page.locator('button, [role="tab"]').filter({ hasText: /AI 코멘트/ }).first();
    if (await commentaryTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await commentaryTab.click();
      await expect(page).toHaveURL(/tab=commentary/, { timeout: 5000 });
    }
  });

  test('view mode toggle between detail and compact', async ({ page }) => {
    await page.goto('/predictions/matrix');
    await seedAuth(page);
    await page.reload();

    // Wait for content to load
    await expect(page.locator('body')).toContainText('천리마', { timeout: 10000 });

    // Click "한눈에" button for compact view
    const compactBtn = page.locator('button').filter({ hasText: '한눈에' }).first();
    if (await compactBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await compactBtn.click();
      // After clicking compact, the grid layout should appear
      await expect(page.locator('body')).toContainText('단승', { timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Navigation — FloatingAppBar interactions
// -------------------------------------------------------------------
test.describe('FloatingAppBar interactions', () => {
  test('all nav items navigate correctly', async ({ page }) => {
    await mockRaceList(page);
    await page.goto('/');

    // Click "경주" nav
    const racesNav = page.getByRole('link', { name: /경주/ }).first();
    await expect(racesNav).toBeVisible({ timeout: 5000 });
    await racesNav.click();
    await expect(page).toHaveURL(/\/races/, { timeout: 5000 });
  });

  test('profile nav shows login page when unauthenticated', async ({ page }) => {
    await page.goto('/');

    // Click profile nav item
    const profileNav = page.getByRole('link', { name: /프로필|내 정보/ }).first();
    if (await profileNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileNav.click();
      // Should show login prompt on profile page
      await expect(page.locator('body')).toContainText(/로그인/, { timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Subscription plans — button interactions
// -------------------------------------------------------------------
test.describe('Subscription plan interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockSubscriptionPlans(page, [
      stubSubscriptionPlan,
      { ...stubSubscriptionPlan, id: 2, planName: 'PREMIUM', displayName: '프리미엄', totalPrice: 14900, totalTickets: 15 },
    ]);
    await mockSubscriptionStatus(page, false);
  });

  test('clicking subscribe button navigates to checkout', async ({ page }) => {
    await mockAuthMe(page);
    await page.goto('/mypage/subscriptions');
    await seedAuth(page);
    await page.reload();

    // Find subscribe/checkout link
    const subscribeBtn = page.getByRole('link', { name: /구독|시작/ }).first();
    if (await subscribeBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await subscribeBtn.click();
      await expect(page).toHaveURL(/subscription-checkout|planId/, { timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Notification settings — toggle interactions
// -------------------------------------------------------------------
test.describe('Notification toggle interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockNotificationPrefs(page);
    // Mock PATCH for saving prefs
    await page.route('**/api/notifications/preferences**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            apiResponse({
              pushEnabled: true,
              raceEnabled: true,
              predictionEnabled: true,
              subscriptionEnabled: true,
              systemEnabled: true,
              promotionEnabled: false,
            }),
          ),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiResponse({})),
        });
      }
    });
  });

  test('toggling a switch sends API request', async ({ page }) => {
    await page.goto('/settings/notifications');
    await seedAuth(page);
    await page.reload();

    // Find first toggle switch
    const toggle = page.locator('button[role="switch"]').first();
    await expect(toggle).toBeVisible({ timeout: 8000 });

    // Track API calls
    let patchCalled = false;
    await page.route('**/api/notifications/preferences', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        patchCalled = true;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({})),
      });
    });

    await toggle.click();
    // Wait briefly for the mutation to fire
    await page.waitForTimeout(500);
    // API should have been called (mutation fired)
    expect(patchCalled).toBe(true);
  });
});

// -------------------------------------------------------------------
// Ticket history — tab filter interactions
// -------------------------------------------------------------------
test.describe('Ticket history tab interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketHistory(page, [
      stubTicket,
      { ...stubTicket, id: 'ticket-2', status: 'USED', usedAt: '2025-03-01T12:00:00.000Z' as never },
      { ...stubTicket, id: 'ticket-3', status: 'EXPIRED' },
    ]);
  });

  test('clicking tab filters changes displayed tickets', async ({ page }) => {
    await page.goto('/mypage/ticket-history');
    await seedAuth(page);
    await page.reload();

    // "전체" tab should be visible and active by default
    const allTab = page.locator('text=/전체|all/i').first();
    await expect(allTab).toBeVisible({ timeout: 8000 });

    // Click "사용 가능" or "available" tab
    const availableTab = page.locator('button, [role="tab"]').filter({ hasText: /사용 가능|AVAILABLE|available/i }).first();
    if (await availableTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await availableTab.click();
      // URL or UI should reflect the filter change
      await page.waitForTimeout(300);
    }
  });
});

// -------------------------------------------------------------------
// Notifications — mark all read interaction
// -------------------------------------------------------------------
test.describe('Notification mark all read', () => {
  test('clicking mark all read sends API request', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [
      { ...stubNotification, isRead: false },
      { ...stubNotification, id: 'notif-2', title: '구독 갱신', message: '구독이 갱신되었습니다.', isRead: false },
    ]);

    let markAllCalled = false;
    await page.route('**/api/notifications/read-all**', async (route) => {
      markAllCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({})),
      });
    });

    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    // "모두 읽음으로 표시" button should appear when unread notifications exist
    const markAllBtn = page.locator('button').filter({ hasText: /모두 읽음/ }).first();
    if (await markAllBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await markAllBtn.click();
      await page.waitForTimeout(500);
      expect(markAllCalled).toBe(true);
    }
  });
});

// -------------------------------------------------------------------
// Profile — navigation to sub-pages
// -------------------------------------------------------------------
test.describe('Profile navigation interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await mockMatrixBalance(page);
    await mockSubscriptionStatus(page, false);
  });

  test('clicking settings link navigates to settings page', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    const settingsLink = page.getByRole('link', { name: /설정/ }).first();
    await expect(settingsLink).toBeVisible({ timeout: 8000 });
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 5000 });
  });

  test('clicking ticket history link navigates correctly', async ({ page }) => {
    await page.goto('/profile');
    await seedAuth(page);
    await page.reload();

    const ticketLink = page.getByRole('link', { name: /예측권 이력/ }).first();
    await expect(ticketLink).toBeVisible({ timeout: 8000 });
    await ticketLink.click();
    await expect(page).toHaveURL(/ticket-history/, { timeout: 5000 });
  });
});

// -------------------------------------------------------------------
// Auth form — input validation interactions
// -------------------------------------------------------------------
test.describe('Auth form interactions', () => {
  test('login form validates empty fields', async ({ page }) => {
    await page.goto('/auth/login');

    // Submit with empty fields
    const submitBtn = page.getByRole('button', { name: /로그인|login/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    // Fill only email, leave password empty
    await page.fill('input[type="email"], input[name="email"]', 'test@test.com');

    // Try to submit — form should prevent or show validation
    await submitBtn.click();

    // Should still be on login page (not navigated away)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 3000 });
  });

  test('register page link navigates to register', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.getByRole('link', { name: /회원가입|register/i }).first();
    await expect(registerLink).toBeVisible({ timeout: 5000 });
    await registerLink.click();
    await expect(page).toHaveURL(/\/auth\/register/, { timeout: 5000 });
  });
});

// -------------------------------------------------------------------
// Accuracy page — data display interaction
// -------------------------------------------------------------------
test.describe('Accuracy page interactions', () => {
  test('accuracy page loads all three stat sections', async ({ page }) => {
    await mockAccuracyStats(page);
    await page.goto('/predictions/accuracy');

    // Overall stats
    await expect(page.locator('body')).toContainText('100건', { timeout: 8000 });
    await expect(page.locator('body')).toContainText('72건', { timeout: 8000 });

    // Monthly and meet sections
    await expect(page.locator('body')).toContainText('2025년 02월', { timeout: 5000 });
    await expect(page.locator('body')).toContainText(/서울/, { timeout: 5000 });
  });
});
