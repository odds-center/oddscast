import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for OddsCast WebApp.
 *
 * Tests use page.route() to intercept API calls so they run without
 * a live NestJS server. Set E2E_BASE_URL to point at a real server
 * for integration testing.
 *
 * Run: pnpm test:e2e
 * UI mode: pnpm test:e2e:ui
 */

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start Next.js server automatically.
  // CI: uses `next start` (requires `pnpm build` to run first).
  // Local: uses `pnpm dev`, reuses existing server if already running.
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
