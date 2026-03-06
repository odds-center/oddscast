#!/usr/bin/env bash
# OddsCast — 로컬 개발 환경 한 번에 셋업
# Steps: env files, Docker Postgres, DB schema (DDL), seed data, admin user
# KRA race data is loaded via Admin UI after setup.
# Usage: ./scripts/setup.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== OddsCast 로컬 셋업 ==="

# --- 1) server/.env ---
if [[ ! -f "server/.env" ]]; then
  echo "[1/5] server/.env 생성 (from .env.example)"
  cp server/.env.example server/.env
  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32 2>/dev/null)
    [[ -n "$SECRET" ]] && sed -i.bak "s|your-jwt-secret-at-least-32-chars|$SECRET|" server/.env 2>/dev/null || true
    rm -f server/.env.bak 2>/dev/null
  fi
  echo "      → DATABASE_URL 기본값 사용. JWT_SECRET 자동 생성됨."
else
  echo "[1/5] server/.env 이미 존재 (skip)"
fi

# --- 2) webapp/.env, admin/.env (최소값, 없을 때만) ---
echo "[2/5] webapp/.env, admin/.env 확인"
[[ ! -f "webapp/.env" ]] && echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > webapp/.env && echo "      → webapp/.env 생성"
[[ ! -f "admin/.env" ]]  && echo 'NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3001/api/admin' > admin/.env && echo "      → admin/.env 생성"

# --- 3) Docker PostgreSQL ---
echo "[3/5] PostgreSQL 기동 (Docker)"
if docker compose up -d postgres 2>/dev/null; then
  echo "      → 대기 중..."
  for i in {1..30}; do
    if (docker compose exec -T postgres pg_isready -U oddscast -d oddscast 2>/dev/null) || (nc -z localhost 5432 2>/dev/null); then
      echo "      → PostgreSQL 준비됨 (${i}초)"
      break
    fi
    [[ $i -eq 30 ]] && { echo "      [warn] 30초 내 준비 안 됨. 수동: psql -h localhost -U oddscast -d oddscast -f docs/db/schema.sql"; exit 1; }
    sleep 1
  done
else
  echo "      → Docker 미실행 또는 실패. 이미 5432에 Postgres 있으면 다음 단계에서 스키마만 적용."
fi

# --- 4) DB 스키마 + 시드 데이터 적용 ---
echo "[4/5] DB 스키마 적용 (docs/db/schema.sql)"
PSQL_URL="postgresql://oddscast:oddscast@localhost:5432/oddscast"
if command -v psql &>/dev/null; then
  EXIST=$(psql "$PSQL_URL" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='oddscast' AND table_name='users' LIMIT 1" 2>/dev/null || true)
  if [[ "$EXIST" == "1" ]]; then
    echo "      → oddscast.users 이미 있음 (skip)"
  elif psql "$PSQL_URL" -f docs/db/schema.sql 2>/dev/null; then
    echo "      → 스키마 적용 완료."
  else
    echo "      [warn] 스키마 적용 실패. 수동: psql \"$PSQL_URL\" -f docs/db/schema.sql"
  fi

  echo "      → 시드 데이터 적용 (docs/db/seed.sql)"
  if psql "$PSQL_URL" -f docs/db/seed.sql 2>/dev/null; then
    echo "      → 시드 완료."
  else
    echo "      [warn] 시드 적용 실패. 수동: psql \"$PSQL_URL\" -f docs/db/seed.sql"
  fi
else
  echo "      [warn] psql 없음. 수동:"
  echo "        psql \"$PSQL_URL\" -f docs/db/schema.sql"
  echo "        psql \"$PSQL_URL\" -f docs/db/seed.sql"
fi

# --- 5) Admin 계정 생성 ---
echo "[5/5] Admin 계정 생성"
ADMIN_EXISTS=$(psql "$PSQL_URL" -tAc "SELECT 1 FROM oddscast.admin_users WHERE \"loginId\"='admin' LIMIT 1" 2>/dev/null || true)
if [[ "$ADMIN_EXISTS" == "1" ]]; then
  echo "      → admin 계정 이미 있음 (skip)"
elif [[ -f "server/node_modules/bcrypt/package.json" ]]; then
  HASH=$(node -e "require('./server/node_modules/bcrypt').hash('admin1234',10).then(h=>process.stdout.write(h))" 2>/dev/null)
  if [[ -n "$HASH" ]]; then
    psql "$PSQL_URL" -c "INSERT INTO oddscast.admin_users (\"loginId\",password,name) VALUES ('admin','$HASH','Administrator') ON CONFLICT DO NOTHING;" 2>/dev/null \
      && echo "      → admin 계정 생성 완료. (loginId: admin / password: admin1234)" \
      || echo "      [warn] admin 계정 INSERT 실패."
  else
    echo "      [warn] bcrypt 해시 생성 실패."
  fi
else
  echo "      [warn] server/node_modules 없음. 먼저 pnpm install 후 재실행하거나 수동으로 admin 계정 생성:"
  echo "        node -e \"require('./server/node_modules/bcrypt').hash('admin1234',10).then(h=>console.log(h))\" | xargs -I{} psql \"$PSQL_URL\" -c \"INSERT INTO oddscast.admin_users (\\\"loginId\\\",password,name) VALUES ('admin','{}','Administrator') ON CONFLICT DO NOTHING;\""
fi

echo "=== 셋업 완료 ==="
echo "  - Admin:  loginId=admin / password=admin1234  (프로덕션 전 반드시 변경)"
echo "  - 서버: cd server && pnpm run dev"
echo "  - 웹앱: cd webapp && pnpm run dev"
