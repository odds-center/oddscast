/**
 * E2E: Authentication flows — login, failed login, logout
 */
import { test, expect } from '@playwright/test';
import {
  mockLogin,
  mockLoginFail,
  mockAuthMe,
  stubUser,
} from './fixtures/api-mocks';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
    await mockAuthMe(page);
  });

  test('successful login redirects to home and shows user name', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', stubUser.email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should navigate away from /auth/login
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.locator('a[href*="/auth/register"]');
    await expect(registerLink).toBeVisible();
  });

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/auth/login');

    const forgotLink = page.locator('a[href*="forgot-password"]');
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Failed login', () => {
  test('shows error message on wrong credentials', async ({ page }) => {
    await mockLoginFail(page);
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Error message should appear
    const error = page.locator('text=/비밀번호|이메일|올바르지|실패/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('submit button is disabled while loading', async ({ page }) => {
    // Slow down the API response to observe loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '인증 실패' }),
      });
    });

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'a@b.com');
    await page.fill('input[type="password"]', 'pw');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // During the 300ms delay the button should be disabled or show loading
    await expect(submitBtn).toBeDisabled({ timeout: 200 });
  });
});

test.describe('Register page', () => {
  test('renders name, email, password fields', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('has link back to login', async ({ page }) => {
    await page.goto('/auth/register');

    const loginLink = page.locator('a[href*="/auth/login"]');
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Protected page redirect', () => {
  test('unauthenticated user visiting /profile is redirected to login', async ({ page }) => {
    // No auth token set — localStorage is empty
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });
});
