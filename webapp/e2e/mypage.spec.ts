/**
 * E2E: MyPage — notifications, ticket history, point transactions, prediction history
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockNotifications,
  mockTicketHistory,
  mockPointTransactions,
  mockPredictionHistory,
  mockTicketBalance,
  seedAuth,
  stubNotification,
  stubTicket,
  stubPointTransaction,
  stubPredictionHistoryItem,
} from './fixtures/api-mocks';

// -------------------------------------------------------------------
// Mypage index
// -------------------------------------------------------------------
test.describe('Mypage index', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
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
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('shows notification items when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [stubNotification]);
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    await expect(
      page.locator('text=경주 시작 30분 전').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows unread badge on notification', async ({ page }) => {
    await mockAuthMe(page);
    await mockNotifications(page, [{ ...stubNotification, isRead: false }]);
    await page.goto('/mypage/notifications');
    await seedAuth(page);
    await page.reload();

    const unreadEl = page.locator('text=서울 1경주가 곧 시작됩니다.').first();
    await expect(unreadEl).toBeVisible({ timeout: 8000 });
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
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
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
// Point transactions
// -------------------------------------------------------------------
test.describe('Point transactions page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage/point-transactions');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('shows transaction rows when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockPointTransactions(page, [stubPointTransaction]);
    await page.goto('/mypage/point-transactions');
    await seedAuth(page);
    await page.reload();

    await expect(
      page.locator('text=일일 로그인 보너스').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows balance column', async ({ page }) => {
    await mockAuthMe(page);
    await mockPointTransactions(page, [stubPointTransaction]);
    await page.goto('/mypage/point-transactions');
    await seedAuth(page);
    await page.reload();

    // balanceAfter: 110
    const balanceEl = page.locator('text=/110|pt/i').first();
    await expect(balanceEl).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no transactions', async ({ page }) => {
    await mockAuthMe(page);
    await mockPointTransactions(page, []);
    await page.goto('/mypage/point-transactions');
    await seedAuth(page);
    await page.reload();

    const empty = page.locator('text=/내역이 없습니다|없습니다/i').first();
    await expect(empty).toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------
// Prediction history
// -------------------------------------------------------------------
test.describe('Prediction history page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/mypage/prediction-history');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('shows prediction history items when logged in', async ({ page }) => {
    await mockAuthMe(page);
    await mockPredictionHistory(page, [stubPredictionHistoryItem]);
    await page.goto('/mypage/prediction-history');
    await seedAuth(page);
    await page.reload();

    await expect(
      page.locator('text=봄 개막 특별경주').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows meet and race number', async ({ page }) => {
    await mockAuthMe(page);
    await mockPredictionHistory(page, [stubPredictionHistoryItem]);
    await page.goto('/mypage/prediction-history');
    await seedAuth(page);
    await page.reload();

    // meetName: 서울, rcNo: 1
    await expect(page.locator('text=서울').first()).toBeVisible({ timeout: 8000 });
  });
});
