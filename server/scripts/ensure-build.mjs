#!/usr/bin/env node
/**
 * Ensures server/dist exists before nest start --watch.
 * Run once so "Cannot find module dist/main" does not occur when dist was removed or never built.
 */
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distMain = join(root, 'dist', 'main.js');

if (!existsSync(distMain)) {
  console.log('[ensure-build] dist/main.js not found, running build...');
  execSync('pnpm run build', { cwd: root, stdio: 'inherit' });
}
