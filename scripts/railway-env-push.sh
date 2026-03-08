#!/usr/bin/env bash
# OddsCast — Railway 환경변수 한번에 push (Bitwarden 연동 지원)
#
# 사용법:
#   ./scripts/railway-env-push.sh [service] [옵션]
#
# service: server (기본값) | webapp
#
# 옵션:
#   --from-bitwarden     Bitwarden Secure Note에서 시크릿 로드 후 Railway push
#   --save-to-bitwarden  로컬 .env를 Bitwarden Secure Note에 저장/갱신
#   --help               도움말
#
# Bitwarden Secure Note 이름:
#   server → "OddsCast Railway Server"
#   webapp → "OddsCast Railway WebApp"
#   Note 내용은 KEY=VALUE 형식 (일반 .env 포맷)
#
# 사전 준비:
#   railway CLI:    npm install -g @railway/cli  또는  brew install railway
#   railway login && railway link  (프로젝트/서비스 연결)
#   Bitwarden CLI:  brew install bitwarden-cli  (Bitwarden 옵션 사용 시)
#   jq:             brew install jq             (Bitwarden 옵션 사용 시)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── 인수 파싱 ──────────────────────────────────────────────────────────────
SERVICE="server"
USE_BITWARDEN=false
SAVE_TO_BITWARDEN=false

for arg in "$@"; do
  case "$arg" in
    server|webapp|admin)  SERVICE="$arg" ;;
    --from-bitwarden)     USE_BITWARDEN=true ;;
    --save-to-bitwarden)  SAVE_TO_BITWARDEN=true ;;
    --help|-h)
      sed -n '2,22p' "$0" | sed 's/^# *//'
      exit 0
      ;;
    *)
      echo "[error] 알 수 없는 인수: $arg" >&2
      exit 1
      ;;
  esac
done

# ── 서비스별 설정 ─────────────────────────────────────────────────────────
case "$SERVICE" in
  server)
    ENV_FILE="server/.env"
    BW_NOTE_NAME="OddsCast Railway Server"
    OVERRIDES=("PORT=3001" "APP_ENV=production")
    EXCLUDE_KEYS=("DATABASE_URL")  # Railway PostgreSQL이 자동 주입
    ;;
  webapp)
    ENV_FILE="webapp/.env"
    BW_NOTE_NAME="OddsCast Railway WebApp"
    OVERRIDES=("NEXT_PUBLIC_APP_ENV=production")
    EXCLUDE_KEYS=()
    ;;
  admin)
    ENV_FILE="admin/.env"
    BW_NOTE_NAME="OddsCast Railway Admin"
    OVERRIDES=("NEXT_PUBLIC_APP_ENV=production")
    EXCLUDE_KEYS=()
    ;;
esac

# ── Bitwarden 공통 함수 ───────────────────────────────────────────────────
bw_check() {
  if ! command -v bw &>/dev/null; then
    echo "[error] Bitwarden CLI(bw)가 없습니다. 설치: brew install bitwarden-cli" >&2
    exit 1
  fi
  if ! command -v jq &>/dev/null; then
    echo "[error] jq가 없습니다. 설치: brew install jq" >&2
    exit 1
  fi
}

bw_unlock() {
  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "[info] Bitwarden 잠금 해제 중... (마스터 패스워드 입력)"
    BW_SESSION=$(bw unlock --raw)
    export BW_SESSION
  fi
}

# ── --save-to-bitwarden: 로컬 .env → Bitwarden Note ──────────────────────
if $SAVE_TO_BITWARDEN; then
  echo "=== .env → Bitwarden 저장: $SERVICE ==="
  bw_check
  bw_unlock

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[error] $ENV_FILE 파일이 없습니다." >&2
    exit 1
  fi

  NOTE_CONTENT=$(cat "$ENV_FILE")

  # 기존 항목 존재 여부 확인
  EXISTING_ID=$(bw get item "$BW_NOTE_NAME" --session "$BW_SESSION" 2>/dev/null | jq -r '.id // empty' || true)

  if [[ -n "$EXISTING_ID" ]]; then
    echo "[info] 기존 항목 발견 (id: $EXISTING_ID) — 갱신합니다."
    ITEM_JSON=$(bw get item "$EXISTING_ID" --session "$BW_SESSION")
    UPDATED_JSON=$(echo "$ITEM_JSON" | jq --arg notes "$NOTE_CONTENT" '.notes = $notes')
    echo "$UPDATED_JSON" | bw encode | bw edit item "$EXISTING_ID" --session "$BW_SESSION" > /dev/null
    echo "[ok] \"$BW_NOTE_NAME\" 갱신 완료."
  else
    echo "[info] 새 Secure Note 생성: \"$BW_NOTE_NAME\""
    # type=2 = Secure Note
    TEMPLATE=$(bw get template item --session "$BW_SESSION")
    NEW_ITEM=$(echo "$TEMPLATE" | jq \
      --arg name "$BW_NOTE_NAME" \
      --arg notes "$NOTE_CONTENT" \
      '.type = 2 | .name = $name | .notes = $notes | .secureNote = {"type": 0}')
    echo "$NEW_ITEM" | bw encode | bw create item --session "$BW_SESSION" > /dev/null
    echo "[ok] \"$BW_NOTE_NAME\" 생성 완료."
  fi

  echo ""
  echo "=== 완료 ==="
  echo "  이제 --from-bitwarden 옵션으로 Railway에 push할 수 있습니다."
  exit 0
fi

# ── Railway CLI 확인 ──────────────────────────────────────────────────────
echo "=== Railway Env Push: $SERVICE ==="

if ! command -v railway &>/dev/null; then
  echo "[error] railway CLI가 없습니다."
  echo "  설치: npm install -g @railway/cli  또는  brew install railway"
  exit 1
fi

# ── 환경변수 로드 ─────────────────────────────────────────────────────────
load_from_env_file() {
  echo "[info] $ENV_FILE 에서 로드 중..."
  grep -E '^[A-Z_][A-Z0-9_]*=' "$ENV_FILE" | grep -v '^#' || true
}

load_from_bitwarden() {
  bw_check
  bw_unlock
  echo "[info] Bitwarden \"$BW_NOTE_NAME\" 로드 중..."
  local notes
  notes=$(bw get notes "$BW_NOTE_NAME" --session "$BW_SESSION" 2>/dev/null) || {
    echo "[error] \"$BW_NOTE_NAME\" 항목을 찾을 수 없습니다." >&2
    echo "  먼저 실행: ./scripts/railway-env-push.sh $SERVICE --save-to-bitwarden" >&2
    exit 1
  }
  echo "$notes" | grep -E '^[A-Z_][A-Z0-9_]*=' | grep -v '^#' || true
}

if $USE_BITWARDEN; then
  RAW_VARS=$(load_from_bitwarden)
else
  RAW_VARS=$(load_from_env_file)
fi

[[ -z "$RAW_VARS" ]] && { echo "[error] 로드된 환경변수가 없습니다." >&2; exit 1; }

# ── 제외 키 필터링 ────────────────────────────────────────────────────────
FILTERED_VARS="$RAW_VARS"
for key in "${EXCLUDE_KEYS[@]:-}"; do
  [[ -z "$key" ]] && continue
  FILTERED_VARS=$(echo "$FILTERED_VARS" | grep -v "^${key}=" || true)
  echo "[skip] $key (Railway 자동 관리)"
done

# ── Override 적용 ─────────────────────────────────────────────────────────
for override in "${OVERRIDES[@]:-}"; do
  [[ -z "$override" ]] && continue
  key="${override%%=*}"
  FILTERED_VARS=$(echo "$FILTERED_VARS" | grep -v "^${key}=" || true)
  FILTERED_VARS="${FILTERED_VARS}"$'\n'"${override}"
  echo "[override] $key → ${override#*=}"
done

# ── 미리보기 및 확인 ─────────────────────────────────────────────────────
echo ""
echo "[info] 적용할 환경변수 목록 (값은 숨김):"
echo "$FILTERED_VARS" | while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  echo "  - $key"
done

echo ""
read -rp "Railway $SERVICE 서비스에 push하시겠습니까? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "취소됨."; exit 0; }

# ── Railway variables set ─────────────────────────────────────────────────
echo ""
echo "[info] Railway에 push 중..."

VARS_ARGS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  VARS_ARGS+=("$line")
done <<< "$FILTERED_VARS"

[[ ${#VARS_ARGS[@]} -eq 0 ]] && { echo "[error] push할 변수가 없습니다." >&2; exit 1; }

railway variables set --service "$SERVICE" "${VARS_ARGS[@]}"

echo ""
echo "=== 완료 ==="
echo "  확인: railway variables --service $SERVICE"
