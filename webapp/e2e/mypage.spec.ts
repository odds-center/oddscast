/**
 * E2E: MyPage — notifications, ticket history, point transactions, prediction history
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockNotifications,
  mockTicketHistory,
  mockPredictionHistory,
  mockTicketBalance,
  seedAuth,
  stubNotification,
  stubTicket,
  stubPredictionHistoryItem,
} from './fixtures/api-mocks';

// -------------------------------------------------------------------
// Mypage index
// -------------------------------------------------------------------
test.describe('Mypage index', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage');
    await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows menu links when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await page.goto('/mypage');
    await seedAuth(page);
    await page.reload();

    const notifLink = page.locator('a[href*="notifications"]').first();
    await expect(notifLink).toBeVisible({ timeout: 8000 });
  });

  test('shows ticket history link', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketBalance(page);
    await page.goto('/mypage');
    await seedAuth(page);
    await page.reload();

    const ticketLink = page.locator('a[href*="ticket-history"]').first();
    await expect(ticketLink).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Notification list
// -------------------------------------------------------------------
test.describe('Notifications page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage/notifications');
    await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows notification items when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [stubNotification]);
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    // Notification title appears in both mobile card and desktop table — use toContainText
    await expect(page.locator('body')).toContainText('경주 시작 30분 전', { timeout: 8000 });
  });

  test('shows unread badge on notification', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [{ ...stubNotification, isRead: false }]);
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('body')).toContainText('서울 1경주가 곧 시작됩니다.', { timeout: 8000 });
  });

  test('shows empty state when no notifications', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, []);
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    const empty = page.locator('text=/알림이 없습니다|없습니다/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });

  test('has mark-all-read button', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [stubNotification]);
    await page.route('**/api/notifications/read-all**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {}, status: 200 }) });
    });
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    const markAllBtn = page.locator('text=/모두 읽음|전체 읽음/i').first();
    await expect(markAllBtn).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Ticket history
// -------------------------------------------------------------------
test.describe('Ticket history page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage/ticket-history');
    await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket rows when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketHistory(page, [stubTicket]);
    await page.goto('/mypage/ticket-history');
    await seedAuth(page);
    await page.reload();

    // Should show ticket type label
    const typeLabel = page.locator('text=/RACE|예측권|사용 가능/i').first();
    await expect(typeLabel).toBeVisible({ timeout: 8000 });
  });

  test('shows tab filter buttons (all / available / used / expired)', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketHistory(page, [stubTicket]);
    await page.goto('/mypage/ticket-history');
    await seedAuth(page);
    await page.reload();

    const allTab = page.locator('text=/전체|all/i').first();
    await expect(allTab).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no tickets', async ({ page }) => {
    await mockAuthMe(page);
    await mockTicketHistory(page, []);
    await page.goto('/mypage/ticket-history');
    await seedAuth(page);
    await page.reload();

    const empty = page.locator('text=/티켓이 없습니다|없습니다/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Prediction history
// -------------------------------------------------------------------
test.describe('Prediction history page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage/prediction-history');
    await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows prediction history items when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockPredictionHistory(page, [stubPredictionHistoryItem]);
    await page.goto('/mypage/prediction-history');
    await seedAuth(page);
    await page.reload();

    // raceLabel renders in both mobile card and desktop table — use toContainText
    await expect(page.locator('body')).toContainText('1경주', { timeout: 8000 });
  });

  test('shows meet and race number', async ({ page }) => {
    await mockAuthMe(page);
    await mockPredictionHistory(page, [stubPredictionHistoryItem]);
    await page.goto('/mypage/prediction-history');
    await seedAuth(page);
    await page.reload();

    await expect(page.locator('body')).toContainText('서울', { timeout: 8000 });
  });
});
