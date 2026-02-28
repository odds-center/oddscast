#!/usr/bin/env bash
# ============================================
# OddsCast — 로컬 개발 환경 한 번에 셋업
# ============================================
# 1) server/.env 생성 (없을 때 .env.example 기반)
# 2) Docker PostgreSQL 기동 시도 (실패 시 건너뜀)
# 3) DB 준비 대기 후 마이그레이션 + 시드
# ============================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== OddsCast 로컬 셋업 ==="

# --- 1) server/.env ---
if [[ ! -f "server/.env" ]]; then
  echo "[1/4] server/.env 생성 (from .env.example)"
  cp server/.env.example server/.env
  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32 2>/dev/null)
    if [[ -n "$SECRET" ]]; then
      sed -i.bak "s|your-jwt-secret-at-least-32-chars|$SECRET|" server/.env 2>/dev/null || true
      rm -f server/.env.bak 2>/dev/null
    fi
  fi
  echo "      → DATABASE_URL은 Docker 기본값(oddscast:oddscast@localhost:5432/oddscast?schema=oddscast)으로 설정됨."
else
  echo "[1/4] server/.env 이미 존재 (skip)"
fi

# --- 2) Docker PostgreSQL ---
echo "[2/4] PostgreSQL 기동 시도 (Docker)"
if docker compose up -d postgres 2>/dev/null; then
  echo "      → Docker PostgreSQL 시작됨. 준비 대기 중..."
  for i in {1..30}; do
    if (docker compose exec -T postgres pg_isready -U oddscast -d oddscast 2>/dev/null) || (nc -z localhost 5432 2>/dev/null); then
      echo "      → PostgreSQL 준비됨 (${i}초)"
      break
    fi
    if [[ $i -eq 30 ]]; then
      echo "      [warn] 30초 내 준비되지 않음. 수동으로 확인 후 'cd server && pnpm run db:setup' 실행"
      exit 1
    fi
    sleep 1
  done
else
  echo "      → Docker 미실행 또는 실패. 이미 localhost:5432 에 PostgreSQL이 있으면 마이그레이션 단계에서 진행됩니다."
fi

# --- 3) 의존성 (server) ---
echo "[3/4] server 의존성 확인 (pnpm install은 필요 시 수동 실행)"

# --- 4) Prisma generate + migrate + seed (로컬 DB URL로 실행) ---
echo "[4/4] DB 마이그레이션 및 시드 (로컬 PostgreSQL)"
LOCAL_URL="postgresql://oddscast:oddscast@localhost:5432/oddscast?schema=oddscast"
(cd server && DATABASE_URL="$LOCAL_URL" pnpm run db:setup) || {
  echo "[fail] db:setup 실패. Docker: docker compose up -d postgres 후 다시 실행하세요."
  echo "        또는 server/.env 의 DATABASE_URL 을 로컬 URL 로 바꾼 뒤 PostgreSQL을 띄우고: cd server && pnpm run db:setup"
  exit 1
}

echo "=== 로컬 셋업 완료 ==="
echo "  - DB: postgresql://localhost:5432/oddscast (스키마 oddscast)"
echo "  - 서버 실행: cd server && pnpm run dev"
echo "  - 웹앱 실행: cd webapp && pnpm run dev"
