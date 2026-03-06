/**
 * Playwright config for integration tests (real NestJS server + real DB).
 *
 * Prerequisites:
 *   1. NestJS server running:  cd server && pnpm run dev
 *   2. Next.js webapp running: pnpm run dev  (or let webServer below start it)
 *   3. Copy .env.test.example -> .env.test and fill in credentials
 *
 * Run: pnpm test:e2e:integration
 * UI:  pnpm test:e2e:integration:ui
 */
import { defineConfig, devices } from '@playwright/test';

// .env.test is loaded via --env-file=.env.test in the npm script (Node 20+)
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e/integration',
  globalSetup: './e2e/integration/global-setup.ts',

  fullyParallel: false, // integration tests share DB state — run sequentially
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL,
    storageState: 'playwright/.auth/user.json', // pre-authenticated
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

  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: true, // always reuse — NestJS must be started manually
    timeout: 60_000,
  },
});
