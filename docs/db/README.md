# OddsCast DB SQL — 전체 SQL 확인

**이 폴더(`docs/db/`)에서 프로젝트의 모든 DB 관련 SQL을 확인·관리합니다.**

## 파일 목록

| 파일 | 설명 |
|------|------|
| **schema.sql** | 전체 DDL (idempotent): 스키마·Enum·테이블·인덱스·FK. **여러 번 실행해도 테이블/타입 중복 생성 없음.** |
| **patches/updated_at_default.sql** | 기존 DB에 `updatedAt` DEFAULT 추가 (필요 시 1회 실행). |
| **patches/drop_prisma_migrations.sql** | Prisma 제거 후 `_prisma_migrations` 테이블 삭제 (필요 시 1회 실행). |

## 스키마 적용 방법

- **신규 DB:** 프로젝트 루트에서 `./scripts/setup.sh` 실행 (env·Docker·스키마 일괄 적용).
- **수동:** `psql $DATABASE_URL -f docs/db/schema.sql` 또는 DBeaver로 `docs/db/schema.sql` 실행.

## 스키마·연결

- 스키마 이름: `oddscast`
- `server/.env`의 `DATABASE_URL`에 `?schema=oddscast` 권장.

상세 로컬 DB 설정은 [LOCAL_DB_SETUP.md](../guides/LOCAL_DB_SETUP.md)를 참고하세요.
