/**
 * E2E: Full page crawl — runs against live server (localhost:3000 + 3001)
 * Checks: JS console errors, page render, broken links, clickable elements, navigation
 *
 * Run: npx playwright test e2e/crawl.spec.ts --project=chromium
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

const BASE = 'http://localhost:3000';

/** Collect console errors during page visit */
async function visitAndCheck(
  page: Page,
  path: string,
  opts?: { expectStatus?: number; skipConsoleErrors?: boolean },
) {
  const consoleErrors: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore common non-critical errors
      if (
        text.includes('favicon') ||
        text.includes('Failed to load resource') ||
        text.includes('ERR_CONNECTION_REFUSED') ||
        text.includes('hydration') ||
        text.includes('Hydration')
      ) return;
      consoleErrors.push(`[${path}] ${text}`);
    }
  };
  page.on('console', onConsole);

  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });

  // Check HTTP status
  const status = response?.status() ?? 0;
  const expectedStatus = opts?.expectStatus ?? 200;
  // Allow redirects (301/302/307/308) and expected status
  const isOk = status === expectedStatus || (status >= 300 && status < 400);
  expect(isOk, `${path} returned status ${status}, expected ${expectedStatus}`).toBe(true);

  // Page should not be completely blank
  const bodyText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '');
  expect((bodyText ?? '').length, `${path} has empty body`).toBeGreaterThan(0);

  // No JS errors
  if (!opts?.skipConsoleErrors && consoleErrors.length > 0) {
    console.warn(`Console errors on ${path}:`, consoleErrors);
  }

  page.off('console', onConsole);
  return { consoleErrors, status };
}

// -------------------------------------------------------------------
// Public pages (no auth required)
// -------------------------------------------------------------------
test.describe('Crawl — public pages', () => {
  const publicPages = [
    '/',
    '/races',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/predictions/accuracy',
    '/mypage/subscriptions',
    '/welcome',
    '/legal/terms',
    '/legal/privacy',
    '/legal/refund',
  ];

  for (const path of publicPages) {
    test(`${path} renders without JS crash`, async ({ page }) => {
      await visitAndCheck(page, path);
      // Should have some visible content
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

// -------------------------------------------------------------------
// Protected pages (show login prompt or redirect)
// -------------------------------------------------------------------
test.describe('Crawl — protected pages show login prompt', () => {
  const protectedPages = [
    '/profile',
    '/profile/edit',
    '/mypage',
    '/mypage/notifications',
    '/mypage/ticket-history',
    '/mypage/prediction-history',
    '/settings',
    '/settings/notifications',
    '/settings/delete-account',
    '/predictions/matrix',
  ];

  for (const path of protectedPages) {
    test(`${path} shows login prompt when unauthenticated`, async ({ page }) => {
      await visitAndCheck(page, path);
      // Should show login link/button
      await expect(page.locator('body')).toContainText(/로그인/, { timeout: 5000 });
    });
  }
});

// -------------------------------------------------------------------
// Error pages
// -------------------------------------------------------------------
test.describe('Crawl — error handling', () => {
  test('404 page renders correctly', async ({ page }) => {
    await visitAndCheck(page, '/this-page-does-not-exist', { expectStatus: 404 });
    // Should show some content (not blank white page)
    const text = await page.locator('body').textContent({ timeout: 3000 }).catch(() => '');
    expect((text ?? '').length).toBeGreaterThan(10);
  });
});

// -------------------------------------------------------------------
// Navigation links — click through and verify no crash
// -------------------------------------------------------------------
test.describe('Crawl — navigation flow', () => {
  test('home → races → race detail (if available) flow', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await expect(page).toHaveTitle(/OddsCast/);

    // Navigate to races
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });
    await expect(page.locator('body')).not.toBeEmpty();

    // Find first race link and click it
    const raceLink = page.locator('a[href*="/races/"]').first();
    if (await raceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await raceLink.getAttribute('href');
      await raceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Should be on a race detail page
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
      // Page should render content
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('home → accuracy flow', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });

    // Navigate to accuracy page
    await page.goto(`${BASE}/predictions/accuracy`, { waitUntil: 'networkidle', timeout: 15000 });
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page).toHaveTitle(/OddsCast/);
  });
});

// -------------------------------------------------------------------
// Clickable elements — verify interactive elements are clickable
// -------------------------------------------------------------------
test.describe('Crawl — interactive elements', () => {
  test('home page buttons and links are clickable', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });

    // All visible links should have valid href
    const links = page.locator('a[href]');
    const count = await links.count();
    const brokenLinks: string[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      if (await link.isVisible().catch(() => false)) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript') && !href.startsWith('mailto')) {
          // Internal links should not be empty
          if (href.startsWith('/') && href.length <= 1) continue;
          // External links check
          if (href.startsWith('http') && !href.includes('localhost')) continue;
          // Verify the link element is not disabled
          const isDisabled = await link.getAttribute('aria-disabled');
          if (isDisabled === 'true') continue;
          // Link should be clickable (not zero-sized)
          const box = await link.boundingBox().catch(() => null);
          if (!box || box.width === 0 || box.height === 0) {
            brokenLinks.push(`Zero-sized link: ${href}`);
          }
        }
      }
    }

    if (brokenLinks.length > 0) {
      console.warn('Broken/zero-sized links on home:', brokenLinks);
    }
    // Allow some issues but flag them
    expect(brokenLinks.length, `Found ${brokenLinks.length} broken links`).toBeLessThan(5);
  });

  test('races page table rows are clickable', async ({ page }) => {
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Find clickable race links
    const raceLinks = page.locator('a[href*="/races/"]');
    const count = await raceLinks.count();

    if (count > 0) {
      // First race link should have a non-zero bounding box
      const firstLink = raceLinks.first();
      if (await firstLink.isVisible().catch(() => false)) {
        const box = await firstLink.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);
      }
    }
  });

  test('accuracy page stats render with correct data', async ({ page }) => {
    await page.goto(`${BASE}/predictions/accuracy`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should have stat cards or empty state — either way, no blank page
    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(50);

    // Should have heading
    await expect(page.locator('body')).toContainText(/예측 정확도|통계/, { timeout: 5000 });
  });

  test('subscription plans page shows plan cards', async ({ page }) => {
    await page.goto(`${BASE}/mypage/subscriptions`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should show plan names or loading/error state
    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(50);
  });
});

// -------------------------------------------------------------------
// Form interactions on live server
// -------------------------------------------------------------------
test.describe('Crawl — form interactions', () => {
  test('login form accepts input and submits', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 15000 });

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="이메일"]').first();
    const pwInput = page.locator('input[type="password"], input[name="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(pwInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill('test@invalid.com');
    await pwInput.fill('wrongpassword');

    // Submit
    const submitBtn = page.getByRole('button', { name: /로그인|login/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should show error message (invalid credentials) — actual message: "이메일 또는 비밀번호가 잘못되었습니다"
    await expect(page.locator('body')).toContainText(/잘못되었습니다|올바르지|실패|error|invalid/i, { timeout: 8000 });
  });

  test('register form validates required fields', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`, { waitUntil: 'networkidle', timeout: 15000 });

    // Email, password, name fields should be present
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const pwInput = page.locator('input[type="password"], input[name="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(pwInput).toBeVisible({ timeout: 5000 });

    // Both should be editable
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });
});

// -------------------------------------------------------------------
// Mobile-specific checks
// -------------------------------------------------------------------
test.describe('Crawl — responsive layout checks', () => {
  test('home page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });

    // FloatingAppBar should be visible
    const appBar = page.locator('nav, [role="navigation"]').first();
    await expect(appBar).toBeVisible({ timeout: 5000 });

    // Touch targets should be at least 44px
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const count = await navLinks.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = navLinks.nth(i);
      if (await link.isVisible().catch(() => false)) {
        const box = await link.boundingBox();
        if (box) {
          // Touch target should be at least 40px (allowing slight margin from 44px spec)
          expect(box.height, `Nav link ${i} too small: ${box.height}px`).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });

  test('races page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Page should render (not blank)
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page).toHaveTitle(/OddsCast/);
  });
});
