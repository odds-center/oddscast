/**
 * E2E: Bug report floating button and modal
 * - BugReportButton visible on most pages, hidden on /welcome
 * - Modal opens, validates, and submits to POST /api/bug-reports
 */
import { test, expect } from '@playwright/test';
import {
  mockAuthMe,
  mockBugReportSubmit,
  mockRaceList,
  seedAuth,
} from './fixtures/api-mocks';

async function setupHome(page: import('@playwright/test').Page) {
  await mockAuthMe(page);
  await mockRaceList(page);
  await mockBugReportSubmit(page);
  // Silence other common requests
  await page.route('**/api/**', async (route) => {
    if (!route.request().url().includes('bug-report') && !route.request().url().includes('races') && !route.request().url().includes('auth')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null, status: 200 }) });
    } else {
      await route.continue();
    }
  });
}

test.describe('BugReportButton visibility', () => {
  test('floating bug report button is visible on home page', async ({ page }) => {
    await mockAuthMe(page);
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null, status: 200 }) });
    });

    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    // BugReportButton — fixed floating button, identified by text or aria
    const bugBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], button:has-text("버그"), .bug-report-button').first();
    await expect(bugBtn).toBeVisible({ timeout: 8000 });
  });

  test('floating bug report button is not rendered on /welcome page', async ({ page }) => {
    await page.goto('/welcome');

    // On /welcome the BugReportButton should be hidden
    const bugBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], .bug-report-button').first();
    // Either not in DOM or not visible
    const count = await bugBtn.count();
    if (count > 0) {
      await expect(bugBtn).not.toBeVisible();
    }
    // else: not present, also passes
  });
});

test.describe('BugReportModal', () => {
  test('opens modal when bug report button is clicked', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    const triggerBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], button:has-text("버그"), .bug-report-button').first();
    await expect(triggerBtn).toBeVisible({ timeout: 8000 });
    await triggerBtn.click();

    // Dialog/modal should appear
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('modal contains textarea for description', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    const triggerBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], button:has-text("버그"), .bug-report-button').first();
    await triggerBtn.click();

    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    const textarea = page.locator('[role="dialog"] textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('modal description textarea is pre-filled with template', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    const triggerBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], button:has-text("버그"), .bug-report-button').first();
    await triggerBtn.click();

    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });

    const textarea = page.locator('[role="dialog"] textarea').first();
    const content = await textarea.inputValue();
    // Template should have content (location/steps/actual/expected)
    expect(content.length).toBeGreaterThan(0);
  });

  test('successfully submits bug report and closes modal', async ({ page }) => {
    await setupHome(page);
    await page.goto('/');
    await seedAuth(page);
    await page.reload();

    const triggerBtn = page.locator('[data-testid="bug-report-button"], button[aria-label*="버그"], button:has-text("버그"), .bug-report-button').first();
    await triggerBtn.click();

    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });

    // Fill title if present
    const titleInput = page.locator('[role="dialog"] input[name="title"], [role="dialog"] input[placeholder*="제목"]').first();
    if (await titleInput.isVisible({ timeout: 1000 })) {
      await titleInput.fill('버튼이 클릭되지 않습니다');
    }

    // Submit
    const submitBtn = page.locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("제출"), [role="dialog"] button:has-text("신고")').first();
    await submitBtn.click();

    // Modal closes after submission
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  });
});
