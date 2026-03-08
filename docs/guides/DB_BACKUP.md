# DB 백업 가이드

> 프로덕션 PostgreSQL 일일 백업 자동화 시 참고.  
> **관련:** [TODO_CONTINUE.md](../TODO_CONTINUE.md) §1 배포·인프라, §5 추천 순서

**Last updated:** 2026-03-08

---

## 1. 수동 백업 (pg_dump)

`DATABASE_URL`이 있는 환경에서:

```bash
# 전체 DB 덤프 (압축)
pg_dump "$DATABASE_URL" -Fc -f backup_$(date +%Y%m%d_%H%M).dump

# SQL 평문 (복원 시 psql로)
pg_dump "$DATABASE_URL" -f backup_$(date +%Y%m%d).sql
```

- `-Fc`: custom format (압축, `pg_restore`로 복원).
- 복원: `pg_restore -d "$DATABASE_URL" backup_YYYYMMDD.dump` (스키마/데이터 옵션은 pg_restore 도큐먼트 참고).

---

## 2. 백업 스크립트 예시

`pg_dump`로 백업. cron 또는 CI에서 호출 예:

```bash
#!/usr/bin/env bash
# DATABASE_URL 필요. 출력 경로는 환경에 맞게 변경.
# 예: BACKUP_OUT_DIR=/tmp/backups && pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_OUT_DIR/oddscast_$(date +%Y%m%d_%H%M).dump"

set -e
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set" >&2
  exit 1
fi

OUT_DIR="${BACKUP_OUT_DIR:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/oddscast_$(date +%Y%m%d_%H%M).dump"
pg_dump "$DATABASE_URL" -Fc -f "$FILE"
echo "Backup: $FILE"
```

- 로컬 테스트: `cd server && export $(grep -v '^#' .env | xargs) && pg_dump "$DATABASE_URL" -Fc -f /tmp/oddscast.dump`

---

## 3. 자동화 (GitHub Actions — 구현됨)

`.github/workflows/db-backup.yml`으로 **매일 03:00 KST 자동 실행**. `workflow_dispatch`로 수동 트리거도 가능.

### 3.1 GitHub Secret 설정 (필수)

GitHub 저장소 → Settings → Secrets and variables → Actions:

| Secret | 설명 |
|--------|------|
| `PROD_DATABASE_URL` | Railway PostgreSQL 연결 문자열 |

### 3.2 백업 저장소

- **GitHub Artifacts**: 90일 보관. 별도 설정 없이 바로 동작.

### 3.3 수동 백업 스크립트

```bash
# server/.env에서 DATABASE_URL 로드 후 실행
cd server && export $(grep -v '^#' .env | xargs) && cd ..
./scripts/db-backup.sh ./backups
```

### 3.4 복원

```bash
pg_restore -d "$DATABASE_URL" --no-owner backup.dump
```

### 3.5 호스팅 제공 백업

- **Railway:** PostgreSQL Dashboard → Backups 탭에서 자동 스냅샷 확인 (플랜별 상이).

---

## 4. 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| GitHub Secret `PROD_DATABASE_URL` 등록 | □ | Railway DB URL 복사 후 등록 |
| 워크플로우 첫 실행 확인 | □ | Actions 탭 → DB Backup → Run workflow |
| Artifact 다운로드 테스트 | □ | 실행 후 Artifacts에서 `.dump` 파일 확인 |
| 복원 테스트 | □ | 로컬 DB에 `pg_restore`로 확인 |
