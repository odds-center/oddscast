#!/usr/bin/env bash
# ============================================
# Golden Race — env 파일 설정 스크립트
# ============================================
# 사용법:
#   ./scripts/setup-env.sh           — .env 없을 때만 example → .env 복사
#   ./scripts/setup-env.sh --force  — 기존 .env 무시하고 example 기준으로 복사
#   ./scripts/setup-env.sh --generate — JWT_SECRET 자동 생성 후 server/.env 반영
#   ./scripts/setup-env.sh --interactive — 대화형으로 주요 값 입력 (Node 스크립트 호출)
#
# 대화형/생성 기능은 Node 스크립트 사용:
#   node scripts/setup-env.mjs --interactive
#   node scripts/setup-env.mjs --generate
# ============================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FORCE=false
GENERATE=false
INTERACTIVE=false
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
    --generate|-g) GENERATE=true ;;
    --interactive|-i) INTERACTIVE=true ;;
  esac
done

# 대화형은 Node 스크립트로 위임
if [[ "$INTERACTIVE" == "true" ]]; then
  exec node "$REPO_ROOT/scripts/setup-env.mjs" --interactive
fi

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [[ ! -f "$src" ]]; then
    echo "[skip] $src 없음"
    return
  fi
  if [[ -f "$dst" && "$FORCE" != "true" ]]; then
    echo "[skip] 이미 존재: $dst"
    return
  fi
  cp "$src" "$dst"
  echo "[ok] $src → $dst"
}

echo "=== Golden Race env 설정 ==="

copy_if_missing "server/.env.example" "server/.env"
copy_if_missing "webapp/.env.example" "webapp/.env.local"
copy_if_missing "admin/.env.example" "admin/.env.local"
copy_if_missing "mobile/.env.example" "mobile/.env"

if [[ "$GENERATE" == "true" ]]; then
  if [[ -f "server/.env" ]]; then
    SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    if command -v sed &>/dev/null; then
      if grep -q "^JWT_SECRET=" "server/.env"; then
        sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=\"$SECRET\"|" "server/.env"
      else
        echo "JWT_SECRET=\"$SECRET\"" >> "server/.env"
      fi
      echo "[ok] server/.env JWT_SECRET 생성: ${SECRET:0:8}..."
    else
      echo "[warn] sed 없음. node scripts/setup-env.mjs --generate 사용하세요."
    fi
  else
    echo "[warn] server/.env 없음. 먼저 복사 후 --generate 실행하세요."
  fi
fi

echo "=== 완료 ==="
echo "각 디렉터리의 .env / .env.local 파일을 열어 실제 값(DATABASE_URL, API 키 등)으로 수정하세요."
