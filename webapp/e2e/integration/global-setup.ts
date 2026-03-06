/**
 * Playwright global setup for integration tests (real server).
 *
 * Steps:
 * 1. Register test user (ignored if already exists)
 * 2. Login → obtain JWT
 * 3. Save browser storageState to playwright/.auth/user.json
 *
 * Requires:
 *   - NestJS server running at E2E_API_URL (default: http://localhost:3001/api)
 *   - Next.js server running at E2E_BASE_URL (default: http://localhost:3000)
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test (or env)
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';
  const apiURL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

  const email = process.env.TEST_USER_EMAIL ?? 'test@test.com';
  const password = process.env.TEST_USER_PASSWORD ?? 'test1234';

  console.log(`[setup] API: ${apiURL}`);
  console.log(`[setup] Webapp: ${baseURL}`);
  console.log(`[setup] Test user: ${email}`);

  // 1. Attempt registration — ignore 409 Conflict (already exists)
  const registerRes = await fetch(`${apiURL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'E2E User' }),
  });
  if (!registerRes.ok && registerRes.status !== 409) {
    const body = await registerRes.text();
    console.warn(`[setup] Registration returned ${registerRes.status}: ${body}`);
  }

  // 2. Login
  const loginRes = await fetch(`${apiURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) {
    const body = await loginRes.text();
    throw new Error(`[setup] Login failed (${loginRes.status}): ${body}`);
  }

  const loginBody = (await loginRes.json()) as {
    data: { accessToken: string; user: unknown };
  };
  const { accessToken, user } = loginBody.data;

  // 3. Save storageState
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(baseURL);
  await page.evaluate(
    ({ token, userData }: { token: string; userData: unknown }) => {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('jwt_user', JSON.stringify(userData));
    },
    { token: accessToken, userData: user },
  );

  await page.context().storageState({ path: path.join(authDir, 'user.json') });
  await browser.close();

  console.log('[setup] Auth state saved to playwright/.auth/user.json');
}

export default globalSetup;
