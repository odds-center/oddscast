# DB 백업 가이드

> 프로덕션 PostgreSQL 일일 백업 자동화 시 참고.  
> **관련:** [TODO_CONTINUE.md](../TODO_CONTINUE.md) §1 배포·인프라, §5 추천 순서

**Last updated:** 2026-02-24

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

## 3. 자동화 (cron / GitHub Actions)

### 3.1 서버 cron (Railway/EC2 등)

- 매일 새벽 실행: cron에서 `pg_dump $DATABASE_URL -Fc -f /path/to/backups/oddscast_$(date +\%Y\%m\%d).dump` 등으로 실행
- 덤프 파일을 외부 스토리지(S3, Railway Volume)에 복사하도록 스크립트 확장.

### 3.2 GitHub Actions (스케줄)

- **주의:** 프로덕션 `DATABASE_URL`을 GitHub Secrets에 두면 보안 위험. 가능하면 백업 전용 DB 사용자(읽기 위주)를 두고 URL만 저장.
- `schedule: cron('0 18 * * *')` (UTC 18:00 = 한국 03:00) 등으로 workflow 실행.
- workflow 내에서 `pg_dump` 가능한 runner가 없으므로, **백업 전용 작은 서버/함수**에서 `pg_dump` 실행 후 S3 등에 업로드하는 구성을 권장.

### 3.3 호스팅 제공 백업

- **Railway:** PostgreSQL add-on은 스냅샷/백업 기능이 있을 수 있음. Dashboard에서 확인.
- **Supabase / Neon 등:** 자체 백업·PITR 정책 확인.

---

## 4. 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| pg_dump 로컬 테스트 | □ | DATABASE_URL 설정 후 pg_dump $DATABASE_URL -Fc -f ./backup.dump |
| 백업 저장 경로 결정 | □ | S3 / Volume / 로컬 |
| cron 또는 스케줄러 등록 | □ | 일일 1회 권장 |
| 복원 테스트 | □ | 별도 DB에 pg_restore로 확인 |

설정 후 [TODO_CONTINUE.md](../TODO_CONTINUE.md) §1·§5에서 "DB 백업" 항목 상태를 갱신하면 됩니다.
