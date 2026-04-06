/**
 * E2E: Kakao OAuth login flow
 * - Login/register pages render Kakao button
 * - /auth/kakao/success page handles token in query params
 * - Invalid/missing token redirects back to login with error
 */
import { test, expect } from '@playwright/test';
import { mockKakaoAuthMe, mockAuthMe, seedAuth, stubToken } from './fixtures/api-mocks';

test.describe('Kakao login button', () => {
  test('login page renders Kakao login button', async ({ page }) => {
    await page.goto('/auth/login');

    // Kakao button should be visible (identified by kakao text or aria-label)
    const kakaoBtn = page.locator('text=/카카오/i').first();
    await expect(kakaoBtn).toBeVisible({ timeout: 5000 });
  });

  test('register page renders Kakao signup button', async ({ page }) => {
    await page.goto('/auth/register');

    const kakaoBtn = page.locator('text=/카카오/i').first();
    await expect(kakaoBtn).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Kakao OAuth success page', () => {
  test('redirects to home after successful Kakao token exchange', async ({ page }) => {
    await mockKakaoAuthMe(page);

    // Navigate to the success page the server would redirect to
    await page.goto(`/auth/kakao/success?token=${stubToken}&refreshToken=mock-refresh`);

    // Should eventually navigate to home
    await expect(page).toHaveURL('/', { timeout: 8000 });
  });

  test('shows loading spinner while processing', async ({ page }) => {
    const kakaoUser = { id: 99, email: 'kakao_user@kakao.com', name: '카카오유저', role: 'USER', isActive: true };
    // Delay getMe to observe the loading state
    await page.route('**/api/auth/me', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: kakaoUser, status: 200, message: null }),
      });
    });

    await page.goto(`/auth/kakao/success?token=${stubToken}`);

    // Loading indicator should be present during processing
    const spinner = page.locator('text=/카카오 로그인/i').first();
    await expect(spinner).toBeVisible({ timeout: 2000 });
  });

  test('redirects to login with error when token is missing', async ({ page }) => {
    await page.goto('/auth/kakao/success');

    // Without token query param, should redirect to login with error
    await expect(page).toHaveURL(/\/auth\/login.*error=kakao_failed/, { timeout: 5000 });
  });

  test('redirects to login with error when getMe fails', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '인증 실패' }),
      });
    });

    await page.goto(`/auth/kakao/success?token=bad-token`);

    await expect(page).toHaveURL(/\/auth\/login.*error=kakao_failed/, { timeout: 5000 });
  });
});

test.describe('Kakao logged-in user', () => {
  test('authenticated Kakao user can access home page', async ({ page }) => {
    await mockKakaoAuthMe(page);
    await seedAuth(page);

    await page.goto('/');
    await page.reload();

    // Should render the home page without redirect
    await expect(page).toHaveURL('/');
  });
});
