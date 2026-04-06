/**
 * E2E: Password reset flow
 * - Forgot password: form submission, success/error states
 * - Reset password: token-based form, validation, success/error
 */
import { test, expect } from '@playwright/test';
import {
  mockForgotPassword,
  mockForgotPasswordFail,
  mockResetPassword,
  mockResetPasswordInvalid,
} from './fixtures/api-mocks';

test.describe('Forgot password page', () => {
  test('renders email input and submit button', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('has back link to login page', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    const backLink = page.locator('a[href*="/auth/login"]');
    await expect(backLink.first()).toBeVisible();
  });

  test('shows success message after submitting valid email', async ({ page }) => {
    await mockForgotPassword(page);
    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'user@example.com');
    await page.click('button[type="submit"]');

    // Should show email-sent confirmation
    const confirmation = page.locator('text=/이메일|확인|발송/i').first();
    await expect(confirmation).toBeVisible({ timeout: 5000 });
  });

  test('success state shows link back to login', async ({ page }) => {
    await mockForgotPassword(page);
    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'user@example.com');
    await page.click('button[type="submit"]');

    // After success, a login link should appear
    const loginLink = page.locator('a[href*="/auth/login"]');
    await expect(loginLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error message for unregistered email', async ({ page }) => {
    await mockForgotPasswordFail(page);
    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'notfound@example.com');
    await page.click('button[type="submit"]');

    const error = page.locator('text=/등록|이메일|찾을 수 없/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('submit button is disabled while submitting', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { sent: true }, status: 200 }),
      });
    });

    await page.goto('/auth/forgot-password');
    await page.fill('input[type="email"]', 'user@example.com');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 300 });
  });
});

test.describe('Reset password page', () => {
  test('renders new password fields when token is provided', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-reset-token');

    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('successfully resets password and redirects to login', async ({ page }) => {
    await mockResetPassword(page);
    await page.goto('/auth/reset-password?token=valid-reset-token');

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('NewPassword123!');
    await passwordInputs.nth(1).fill('NewPassword123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-reset-token');

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('NewPassword123!');
    await passwordInputs.nth(1).fill('DifferentPassword456!');

    await page.click('button[type="submit"]');

    const error = page.locator('text=/일치|다릅니다/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('shows error for expired or invalid token', async ({ page }) => {
    await mockResetPasswordInvalid(page);
    await page.goto('/auth/reset-password?token=expired-token');

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('NewPassword123!');
    await passwordInputs.nth(1).fill('NewPassword123!');

    await page.click('button[type="submit"]');

    const error = page.locator('text=/유효하지|만료|토큰/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });
});
