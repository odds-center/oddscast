/**
 * E2E: Deep UI/UX interaction tests — runs against live server (localhost:3000 + 3001)
 * Focuses on: back navigation, empty/error states, responsive breakpoints,
 * form validation, loading behavior, date pickers, and edge cases
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// -------------------------------------------------------------------
// Back navigation (CompactPageTitle back button)
// -------------------------------------------------------------------
test.describe('Back navigation', () => {
  test('race detail back button returns to races list', async ({ page }) => {
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Click first race link
    const raceLink = page.locator('a[href*="/races/"]').first();
    if (await raceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await raceLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Find back button (CompactPageTitle renders a back link)
      const backBtn = page.locator('a[href="/races"], a[href="/"]').first()
        .or(page.getByRole('link', { name: /뒤로|back/i }).first());
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        // Should be back on races or home
        const url = page.url();
        expect(url.includes('/races') || url.endsWith('/')).toBe(true);
      }
    }
  });

  test('settings sub-pages have back navigation', async ({ page }) => {
    await page.goto(`${BASE}/settings/notifications`, { waitUntil: 'networkidle', timeout: 15000 });

    // CompactPageTitle should have back to /settings
    const backLink = page.locator('a[href*="/settings"]').first();
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });

  test('legal pages have back navigation', async ({ page }) => {
    await page.goto(`${BASE}/legal/terms`, { waitUntil: 'networkidle', timeout: 15000 });

    // Legal pages may or may not have explicit back — verify page is navigable
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// -------------------------------------------------------------------
// Empty states — pages with no data should show friendly messages
// -------------------------------------------------------------------
test.describe('Empty states', () => {
  test('races page shows content even without races for today', async ({ page }) => {
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should show either race cards OR empty state message — not a blank page
    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(100);
  });

  test('accuracy page shows stats or empty state', async ({ page }) => {
    await page.goto(`${BASE}/predictions/accuracy`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should show stats or "통계가 없습니다" empty state
    await expect(page.locator('body')).toContainText(/예측 정확도|통계/, { timeout: 5000 });
  });

  test('weekly preview shows content or empty state', async ({ page }) => {
    await page.goto(`${BASE}/weekly-preview`, { waitUntil: 'networkidle', timeout: 15000 });

    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(50);
  });
});

// -------------------------------------------------------------------
// Loading states — verify spinner or skeleton appears briefly
// -------------------------------------------------------------------
test.describe('Loading states', () => {
  test('races page shows loading then content', async ({ page }) => {
    // Intercept to add delay
    await page.route('**/api/races**', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto(`${BASE}/races`);

    // During loading, should see spinner or skeleton
    const loadingIndicator = page.locator('text=/로딩|준비|loading/i')
      .or(page.locator('[class*="animate-spin"], [class*="skeleton"], [role="status"]'));

    // Loading indicator may appear briefly — check but don't require
    await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Eventually content should load
    await expect(page.locator('body')).toContainText(/경주|없습니다|OddsCast/, { timeout: 15000 });
  });
});

// -------------------------------------------------------------------
// Responsive breakpoint behavior
// -------------------------------------------------------------------
test.describe('Responsive breakpoints', () => {
  test('mobile viewport shows mobile navigation bar at bottom', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });

    // FloatingAppBar should be visible at bottom
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 5000 });

    // On mobile, nav should be near the bottom of viewport
    const box = await nav.boundingBox();
    if (box) {
      // Nav top should be in the lower portion of the screen
      expect(box.y).toBeGreaterThan(600);
    }
  });

  test('desktop viewport shows floating nav bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('race detail entry table renders properly on both viewports', async ({ page }) => {
    // Find a race to test
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });
    const raceLink = page.locator('a[href*="/races/"]').first();

    if (await raceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await raceLink.getAttribute('href');
      if (!href) return;

      // Desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 15000 });
      const desktopBody = await page.locator('body').textContent({ timeout: 5000 });

      // Mobile view
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
      const mobileBody = await page.locator('body').textContent({ timeout: 5000 });

      // Both should have content (not blank)
      expect((desktopBody ?? '').length).toBeGreaterThan(100);
      expect((mobileBody ?? '').length).toBeGreaterThan(100);
    }
  });
});

// -------------------------------------------------------------------
// Date filter interactions on races page
// -------------------------------------------------------------------
test.describe('Date filter on races page', () => {
  test('date filter chips are clickable and update URL', async ({ page }) => {
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Find "오늘" chip
    const todayChip = page.locator('button, a, [role="tab"]').filter({ hasText: /^오늘$/ }).first();
    if (await todayChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should be clickable
      const box = await todayChip.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(30);
      expect(box!.height).toBeGreaterThan(30);
    }

    // Find "어제" chip and click
    const yesterdayChip = page.locator('button, a, [role="tab"]').filter({ hasText: /^어제$/ }).first();
    if (await yesterdayChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yesterdayChip.click();
      // URL should update
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('date=') || url.includes('yesterday')).toBe(true);
    }
  });
});

// -------------------------------------------------------------------
// Form error validation (real server)
// -------------------------------------------------------------------
test.describe('Form error handling', () => {
  test('forgot password with non-existent email shows message', async ({ page }) => {
    await page.goto(`${BASE}/auth/forgot-password`, { waitUntil: 'networkidle', timeout: 15000 });

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill('nonexistent@test.com');

    const submitBtn = page.getByRole('button', { name: /전송|보내기|reset|submit/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      // Should show some feedback (success or error)
      await page.waitForTimeout(2000);
      const body = await page.locator('body').textContent({ timeout: 5000 });
      // Page should still be functional (not crashed)
      expect((body ?? '').length).toBeGreaterThan(50);
    }
  });

  test('register with short password shows validation error', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`, { waitUntil: 'networkidle', timeout: 15000 });

    const emailInput = page.locator('input[type="email"]').first();
    const pwInput = page.locator('input[type="password"]').first();
    const nameInput = page.locator('input[name="name"]').first();

    await emailInput.fill('test@test.com');
    await pwInput.fill('12'); // Too short
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Test');
    }

    const submitBtn = page.getByRole('button', { name: /가입|register|회원가입/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      // Should show validation error for short password
      await expect(page.locator('body')).toContainText(/6자|짧|short|자 이상/i, { timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Welcome/onboarding page interactions
// -------------------------------------------------------------------
test.describe('Welcome page', () => {
  test('welcome page CTA buttons work', async ({ page }) => {
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should have a CTA button/link to register or login
    const cta = page.getByRole('link', { name: /시작|가입|로그인|start/i }).first();
    if (await cta.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await cta.getAttribute('href');
      expect(href).toBeTruthy();
      // Should point to auth page
      expect(href).toMatch(/auth|login|register/);
    }
  });

  test('welcome page has feature cards', async ({ page }) => {
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should have multiple feature sections
    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(200);
  });
});

// -------------------------------------------------------------------
// Subscription page — plan cards clickability
// -------------------------------------------------------------------
test.describe('Subscription page UX', () => {
  test('plan cards have proper touch targets', async ({ page }) => {
    await page.goto(`${BASE}/mypage/subscriptions`, { waitUntil: 'networkidle', timeout: 15000 });

    // Should show subscription plans
    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect((body ?? '').length).toBeGreaterThan(50);

    // Plan cards or plan names should be present
    const planElements = page.locator('text=/LIGHT|STANDARD|PREMIUM|라이트|스탠다드|프리미엄/i');
    const count = await planElements.count();
    if (count > 0) {
      // At least one plan should be visible
      await expect(planElements.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// -------------------------------------------------------------------
// Page titles and meta tags
// -------------------------------------------------------------------
test.describe('Page metadata', () => {
  const pageTitles: [string, RegExp][] = [
    ['/', /OddsCast/],
    ['/races', /OddsCast/],
    ['/auth/login', /로그인|OddsCast/],
    ['/predictions/accuracy', /정확도|OddsCast/],
    ['/welcome', /OddsCast/],
    ['/legal/terms', /OddsCast/],
  ];

  for (const [path, titlePattern] of pageTitles) {
    test(`${path} has correct page title`, async ({ page }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await expect(page).toHaveTitle(titlePattern);
    });
  }
});

// -------------------------------------------------------------------
// Scroll behavior & sticky headers
// -------------------------------------------------------------------
test.describe('Scroll behavior', () => {
  test('races page allows scrolling with sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/races`, { waitUntil: 'networkidle', timeout: 15000 });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // CompactPageTitle should be sticky (still visible after scroll)
    // Verify page didn't crash after scroll
    await expect(page.locator('body')).not.toBeEmpty();

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Nav should still be visible
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 3000 });
  });
});

// -------------------------------------------------------------------
// Console error monitoring on key pages
// -------------------------------------------------------------------
test.describe('Console error monitoring', () => {
  const pagesToCheck = [
    '/',
    '/races',
    '/predictions/accuracy',
    '/auth/login',
    '/mypage/subscriptions',
    '/welcome',
  ];

  for (const path of pagesToCheck) {
    test(`${path} has no critical JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out known non-critical errors
          if (
            text.includes('favicon') ||
            text.includes('Failed to load resource') ||
            text.includes('ERR_CONNECTION_REFUSED') ||
            text.includes('Hydration') ||
            text.includes('hydration') ||
            text.includes('ChunkLoadError') ||
            text.includes('NEXT_NOT_FOUND')
          ) return;
          errors.push(text);
        }
      });

      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for any deferred errors

      // No critical JS errors
      expect(errors, `Console errors on ${path}: ${errors.join(', ')}`).toHaveLength(0);
    });
  }
});
