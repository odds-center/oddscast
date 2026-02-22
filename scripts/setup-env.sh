#!/usr/bin/env bash
# ============================================
# OddsCast — env 파일 설정 스크립트
# ============================================
# 사용법:
#   ./scripts/setup-env.sh          — .env 파일 생성 (이미 있으면 skip)
#   ./scripts/setup-env.sh --force  — 기존 .env 덮어쓰기
# ============================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
  esac
done

write_env() {
  local dst="$1"
  local content="$2"
  if [[ -f "$dst" && "$FORCE" != "true" ]]; then
    echo "[skip] 이미 존재: $dst"
    return
  fi
  echo "$content" > "$dst"
  echo "[ok] 생성: $dst"
}

echo "=== OddsCast env 설정 ==="

# --- server/.env ---
write_env "server/.env" '# ============================================
# OddsCast Server 환경 변수
# ============================================

# PostgreSQL 연결 문자열 (Prisma)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19wS0FUQzVJdWJUbHBsTExVUGIzNGEiLCJhcGlfa2V5IjoiMDFLSEFLMTMxQjVFU1ZZNjdZMDEwVEc4UDIiLCJ0ZW5hbnRfaWQiOiI5MDVhNTVhOWFjOTlmMmVlZTg1YWVkNmFhMmU1MWVhNmViYTlhNDk0YTBhNzNiMjkxMzM1NjE1ZWUxMDkxODE4IiwiaW50ZXJuYWxfc2VjcmV0IjoiODM4MjY1ZGEtZGU4Yi00MmVjLWE3Y2QtNmFjYmFiZWYzMTEzIn0.zn9cWVQU-f911hHILdC72v6NJ7B7B-ux3AKkZVQxkZE"

# 서버 포트
PORT=3001

# Google OAuth (구글 로그인)
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Google Gemini API (AI 예측)
GEMINI_API_KEY=AIzaSyC69L87vbMM4wTkSsE41smOGsWvrSglYU0

# JWT 시크릿 (토큰 서명용)
JWT_SECRET=your-jwt-secret-at-least-32-chars

# Redis (캐시 — 선택, 미설정 시 인메모리 캐시 사용)
# REDIS_URL=redis://localhost:6379

# KRA 공공데이터 API (경마 출전표, 결과 등) — 인코딩된 키 사용
KRA_SERVICE_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D'

# --- webapp/.env ---
write_env "webapp/.env" '# ============================================
# OddsCast WebApp 환경 변수
# ============================================

# NestJS API 서버 URL (base만, /api는 코드에서 붙음)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WebApp URL (모바일 WebView에서 사용)
NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000

# Google OAuth Web Client ID (구글 로그인, Server와 동일한 Web Client ID)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Google Analytics (선택)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX'

# --- admin/.env ---
write_env "admin/.env" '# ============================================
# OddsCast Admin 환경 변수
# ============================================

# Admin 전용 API Base URL (NestJS /api/admin prefix)
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3001/api/admin

# rewrite용 (next.config.js) - 미설정 시 localhost:3001/api 사용
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# API 타임아웃 ms (선택, 기본 30000)
# NEXT_PUBLIC_ADMIN_API_TIMEOUT=30000'

# --- mobile/.env ---
write_env "mobile/.env" '# ============================================
# OddsCast Mobile (Expo) 환경 변수
# ============================================

# Google OAuth — Web Client ID (GSI / 서버 idToken 검증용)
EXPO_PUBLIC_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Google OAuth — iOS Client ID (Expo/Google Sign-In)
EXPO_PUBLIC_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com

# Google OAuth — Android Client ID
EXPO_PUBLIC_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com

# API 서버 (푸시 등록 등) — prod 배포 시 설정
# EXPO_PUBLIC_API_URL=https://your-api-domain.com/api

# WebApp URL (prod WebView 로드) — 미설정 시 기본값 사용
# EXPO_PUBLIC_WEBAPP_URL=https://oddscast-webapp.vercel.app'

# JWT_SECRET 자동 생성 (placeholder 남아있으면)
if [[ -f "server/.env" ]]; then
  if grep -q "^JWT_SECRET=your-jwt-secret" "server/.env"; then
    SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=\"$SECRET\"|" "server/.env"
    rm -f "server/.env.bak"
    echo "[ok] server/.env JWT_SECRET 자동 생성"
  fi
fi

# prisma generate
if [[ -f "server/prisma/schema.prisma" ]]; then
  echo "=== Prisma Client 생성 ==="
  (cd server && pnpm prisma generate 2>/dev/null) && echo "[ok] Prisma Client 생성 완료" || echo "[warn] Prisma generate 실패 — pnpm install 먼저 실행하세요"
fi

echo "=== 완료 ==="
