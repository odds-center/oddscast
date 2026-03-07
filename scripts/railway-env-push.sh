#!/usr/bin/env bash
# OddsCast — Railway 환경변수 한번에 push
#
# 사용법:
#   ./scripts/railway-env-push.sh [service] [--from-bitwarden]
#
# service: server (기본값) | webapp
# --from-bitwarden: Bitwarden Secure Note에서 시크릿 로드
#                   (없으면 로컬 .env 파일에서 로드)
#
# Bitwarden Secure Note 이름 규칙:
#   server → "OddsCast Railway Server"
#   webapp → "OddsCast Railway WebApp"
#   Note 내용은 KEY=VALUE 형식 (일반 .env 포맷)
#
# 사전 준비:
#   railway CLI: npm install -g @railway/cli  또는  brew install railway
#   railway login && railway link  (프로젝트/서비스 연결)
#   Bitwarden CLI (선택): brew install bitwarden-cli

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── 인수 파싱 ──────────────────────────────────────────────────────────────
SERVICE="server"
USE_BITWARDEN=false

for arg in "$@"; do
  case "$arg" in
    server|webapp) SERVICE="$arg" ;;
    --from-bitwarden) USE_BITWARDEN=true ;;
    --help|-h)
      sed -n '2,20p' "$0" | sed 's/^# *//'
      exit 0
      ;;
    *)
      echo "[error] 알 수 없는 인수: $arg" >&2
      exit 1
      ;;
  esac
done

echo "=== Railway Env Push: $SERVICE ==="

# ── 사전 조건 확인 ────────────────────────────────────────────────────────
if ! command -v railway &>/dev/null; then
  echo "[error] railway CLI가 설치되지 않았습니다."
  echo "  설치: npm install -g @railway/cli  또는  brew install railway"
  exit 1
fi

# ── 환경변수 로드 ─────────────────────────────────────────────────────────
load_from_env_file() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    echo "[error] $env_file 파일이 없습니다." >&2
    exit 1
  fi
  echo "[info] $env_file 에서 로드 중..."
  # 주석·빈 줄 제거 후 KEY=VALUE 배열로 반환
  grep -E '^[A-Z_][A-Z0-9_]*=' "$env_file" | grep -v '^#' || true
}

load_from_bitwarden() {
  local note_name="$1"
  if ! command -v bw &>/dev/null; then
    echo "[error] Bitwarden CLI(bw)가 설치되지 않았습니다." >&2
    echo "  설치: brew install bitwarden-cli" >&2
    exit 1
  fi

  # BW_SESSION이 없으면 unlock 진행
  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "[info] Bitwarden 잠금 해제 중... (마스터 패스워드 입력 필요)"
    BW_SESSION=$(bw unlock --raw)
    export BW_SESSION
  fi

  echo "[info] Bitwarden에서 \"$note_name\" 로드 중..."
  local notes
  notes=$(bw get notes "$note_name" --session "$BW_SESSION" 2>/dev/null) || {
    echo "[error] Bitwarden에서 \"$note_name\" 항목을 찾을 수 없습니다." >&2
    echo "  Bitwarden Vault에 Secure Note를 추가하세요:" >&2
    echo "  이름: $note_name" >&2
    echo "  내용: KEY=VALUE 형식 (일반 .env 포맷)" >&2
    exit 1
  }

  # 주석·빈 줄 제거
  echo "$notes" | grep -E '^[A-Z_][A-Z0-9_]*=' | grep -v '^#' || true
}

# ── 서비스별 설정 ─────────────────────────────────────────────────────────
case "$SERVICE" in
  server)
    ENV_FILE="server/.env"
    BW_NOTE_NAME="OddsCast Railway Server"
    # 로컬 전용이라 Railway에서 override할 값들
    OVERRIDES=(
      "PORT=3001"
      "APP_ENV=production"
    )
    # Railway에서 제외할 키 (DATABASE_URL은 Railway PostgreSQL이 자동 주입)
    EXCLUDE_KEYS=("DATABASE_URL")
    ;;
  webapp)
    ENV_FILE="webapp/.env"
    BW_NOTE_NAME="OddsCast Railway WebApp"
    OVERRIDES=(
      "NEXT_PUBLIC_APP_ENV=production"
    )
    EXCLUDE_KEYS=()
    ;;
esac

# ── env 로드 ──────────────────────────────────────────────────────────────
if $USE_BITWARDEN; then
  RAW_VARS=$(load_from_bitwarden "$BW_NOTE_NAME")
else
  RAW_VARS=$(load_from_env_file "$ENV_FILE")
fi

if [[ -z "$RAW_VARS" ]]; then
  echo "[error] 로드된 환경변수가 없습니다." >&2
  exit 1
fi

# ── 제외 키 필터링 ────────────────────────────────────────────────────────
FILTERED_VARS="$RAW_VARS"
for key in "${EXCLUDE_KEYS[@]:-}"; do
  [[ -z "$key" ]] && continue
  FILTERED_VARS=$(echo "$FILTERED_VARS" | grep -v "^${key}=" || true)
  echo "[skip] $key (Railway가 자동 관리)"
done

# ── Override 적용 ─────────────────────────────────────────────────────────
for override in "${OVERRIDES[@]:-}"; do
  [[ -z "$override" ]] && continue
  key="${override%%=*}"
  # 기존 값 교체 또는 추가
  FILTERED_VARS=$(echo "$FILTERED_VARS" | grep -v "^${key}=" || true)
  FILTERED_VARS="${FILTERED_VARS}"$'\n'"${override}"
  echo "[override] $key"
done

# ── Railway 서비스 선택 ───────────────────────────────────────────────────
echo ""
echo "[info] Railway 서비스: $SERVICE"
echo "[info] 적용할 환경변수 목록:"
echo "$FILTERED_VARS" | while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  echo "  - $key"
done

echo ""
read -rp "위 변수들을 Railway $SERVICE 서비스에 push하시겠습니까? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "취소됨."; exit 0; }

# ── Railway variables set ─────────────────────────────────────────────────
echo ""
echo "[info] Railway에 환경변수 push 중..."

# KEY=VALUE 쌍을 배열로 변환해서 한번에 전달
VARS_ARGS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  VARS_ARGS+=("$line")
done <<< "$FILTERED_VARS"

if [[ ${#VARS_ARGS[@]} -eq 0 ]]; then
  echo "[error] push할 변수가 없습니다." >&2
  exit 1
fi

railway variables set --service "$SERVICE" "${VARS_ARGS[@]}"

echo ""
echo "=== 완료 ==="
echo "  railway variables --service $SERVICE  로 확인 가능"
