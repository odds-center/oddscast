#!/usr/bin/env node
/**
 * Golden Race — env 설정 스크립트
 *
 * 사용법:
 *   node scripts/setup-env.mjs           — example → .env 복사 (기존 파일 있으면 스킵)
 *   node scripts/setup-env.mjs --force   — 기존 무시하고 덮어쓰기
 *   node scripts/setup-env.mjs --generate — JWT_SECRET 자동 생성 후 server/.env 반영
 *   node scripts/setup-env.mjs --interactive — 대화형으로 주요 값 입력
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const CONFIGS = [
  { src: 'server/.env.example', dst: 'server/.env' },
  { src: 'webapp/.env.example', dst: 'webapp/.env.local' },
  { src: 'admin/.env.example', dst: 'admin/.env.local' },
  { src: 'mobile/.env.example', dst: 'mobile/.env' },
];

function copyIfMissing(src, dst, force = false) {
  const srcPath = path.join(REPO_ROOT, src);
  const dstPath = path.join(REPO_ROOT, dst);

  if (!fs.existsSync(srcPath)) {
    console.log(`[skip] ${src} 없음`);
    return false;
  }
  if (fs.existsSync(dstPath) && !force) {
    console.log(`[skip] 이미 존재: ${dst}`);
    return false;
  }
  fs.copyFileSync(srcPath, dstPath);
  console.log(`[ok] ${src} → ${dst}`);
  return true;
}

function generateJwtSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function updateEnvFile(filePath, key, value) {
  const fullPath = path.join(REPO_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  const lineRegex = new RegExp(`^${key}=.*`, 'm');
  const escaped = value.includes(' ') || value.includes('=') ? `"${value.replace(/"/g, '\\"')}"` : value;
  const newLine = `${key}=${escaped}`;

  if (lineRegex.test(content)) {
    content = content.replace(lineRegex, newLine);
  } else {
    content = content.trimEnd() + `\n${newLine}\n`;
  }
  fs.writeFileSync(fullPath, content);
}

async function prompt(question, defaultValue = '') {
  const readline = (await import('readline')).default;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function runInteractive() {
  console.log('\n=== 대화형 env 설정 ===\n');

  const dbUrl = await prompt('DATABASE_URL (PostgreSQL)', 'postgresql://user:password@localhost:5432/goldenrace');
  const jwtSecret = await prompt('JWT_SECRET (비어있으면 새로 생성)', '');
  const googleId = await prompt('GOOGLE_CLIENT_ID (구글 로그인)', '');
  const geminiKey = await prompt('GEMINI_API_KEY (AI 예측, 선택)', '');

  const secret = jwtSecret || generateJwtSecret();
  if (!jwtSecret) console.log(`  → JWT_SECRET 생성됨: ${secret.slice(0, 8)}...`);

  // 먼저 복사
  const force = true;
  CONFIGS.forEach(({ src, dst }) => copyIfMissing(src, dst, force));

  // server/.env 업데이트
  if (dbUrl) updateEnvFile('server/.env', 'DATABASE_URL', dbUrl);
  updateEnvFile('server/.env', 'JWT_SECRET', secret);
  if (googleId) updateEnvFile('server/.env', 'GOOGLE_CLIENT_ID', googleId);
  if (geminiKey) updateEnvFile('server/.env', 'GEMINI_API_KEY', geminiKey);

  // webapp/admin/mobile — 구글 클라이언트 ID
  if (googleId) {
    updateEnvFile('webapp/.env.local', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', googleId);
    updateEnvFile('mobile/.env', 'EXPO_PUBLIC_WEB_CLIENT_ID', googleId);
  }

  console.log('\n[ok] 설정 완료. server/.env, webapp/.env.local 등을 확인하세요.\n');
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const generate = args.includes('--generate') || args.includes('-g');
  const interactive = args.includes('--interactive') || args.includes('-i');

  if (interactive) {
    await runInteractive();
    return;
  }

  console.log('=== Golden Race env 설정 ===\n');

  CONFIGS.forEach(({ src, dst }) => copyIfMissing(src, dst, force));

  if (generate) {
    const secret = generateJwtSecret();
    const serverEnv = path.join(REPO_ROOT, 'server/.env');
    if (fs.existsSync(serverEnv)) {
      updateEnvFile('server/.env', 'JWT_SECRET', `"${secret}"`);
      console.log(`[ok] server/.env JWT_SECRET 생성: ${secret.slice(0, 8)}...`);
    } else {
      console.log('[warn] server/.env 없음. 먼저 복사 후 --generate 실행하세요.');
    }
  }

  console.log('\n=== 완료 ===');
  console.log('각 .env 파일을 열어 DATABASE_URL, API 키 등을 확인·수정하세요.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
