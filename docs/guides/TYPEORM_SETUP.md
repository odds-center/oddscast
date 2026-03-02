# TypeORM 설정 가이드

서버에서 TypeORM을 사용하기 위한 로컬 설정 및 마이그레이션 실행 방법.

---

## 1. 의존성 설치

**반드시 실행:** TypeORM 패키지가 `server/package.json`에 추가되어 있으므로, 프로젝트 루트에서 한 번 설치한다.

```bash
pnpm install
# 또는 서버만
pnpm --filter server install
```

필요 패키지: `typeorm`, `@nestjs/typeorm` (이미 `server/package.json`에 포함됨).  
설치 후 `pnpm --filter server build` 로 빌드가 통과하는지 확인한다.

---

## 2. 환경 변수

- **DATABASE_URL**: PostgreSQL 연결 문자열.  
  예: `postgresql://user:password@localhost:5432/oddscast?schema=oddscast`  
  로컬에서 스키마를 쓰는 경우 `?schema=oddscast` 포함 권장. (`docs/guides/LOCAL_DB_SETUP.md` 참고)
- **NODE_ENV**: `development`이면 TypeORM SQL 로깅 활성화.

---

## 3. DB 스키마

TypeORM은 **synchronize: false**로 설정되어 있어, 스키마를 자동으로 만들지 않습니다.

- **최초 DB 준비:** `./scripts/setup.sh` 또는 `docs/db/schema.sql`을 DB에 실행해 스키마·테이블·Enum을 생성.
- **스키마 이름:** `oddscast`. `TypeOrmModule.forRootAsync`에서 `schema: 'oddscast'`로 설정됨.

---

## 4. 앱에서의 사용

- **Entity:** `server/src/database/entities/` 에 정의.  
  `entities/index.ts`와 `app.module.ts`의 `entities: [...]`에 등록된 Entity만 사용. 추가 시 두 곳 모두 반영.
- **Repository 주입:** 서비스에서 `@InjectRepository(Entity)` 등으로 주입 후 사용. DB 접근은 TypeORM 전용.

---

## 5. 마이그레이션

**현재:** 스키마는 `./scripts/setup.sh` 또는 `docs/db/schema.sql` 수동 적용. TypeORM `synchronize: false`이므로 앱이 스키마를 자동 생성하지 않음.

**TypeORM migration CLI (도입됨):**

- **실행:** 서버 디렉터리에서 `pnpm run migration:run`. (빌드 후 `dist/database/data-source.js`로 migration 실행.)
- **생성:** `pnpm run migration:generate --name=MigrationName` (예: `--name=AddNewColumn`). 생성된 파일은 `server/src/database/migrations/`에 추가됨.
- DataSource: `server/src/database/data-source.ts`. 마이그레이션 디렉터리: `server/src/database/migrations/`.

### CI / 배포 시 마이그레이션 실행

- **수동 스키마 (현재):** 배포 전 또는 배포 스크립트에서 `psql $DATABASE_URL -f docs/db/schema.sql` 실행 (로컬은 `./scripts/setup.sh`). 기존 DB가 있으면 스키마가 이미 적용된 상태이므로, 신규 컬럼/테이블만 반영된 SQL을 별도로 작성·실행하는 방식 권장.
- **TypeORM migration 사용 시:** 배포 파이프라인에서 `pnpm --filter server run migration:run`(또는 위 `typeorm migration:run`)을 DB 연결 가능한 단계에서 실행. 보통 앱 기동 전 한 번만 실행.
- **권장 순서:** 1) DB 마이그레이션 실행, 2) 앱 빌드/배포, 3) 앱 기동.

---

## 6. 시드 데이터 (초기 데이터)

**통일된 적용 순서:**

1. **스키마:** `docs/db/schema.sql` — 테이블·Enum·기본 구조.
2. **패치:** `docs/db/patches/` — 컬럼 추가/기본값 등 (updated_at_default.sql, login_bonus_columns.sql 등). 필요 시 순서대로 실행.
3. **초기 설정값:** PointConfig, SubscriptionPlan 등은 `schema.sql` 또는 별도 시드 SQL에 포함. Admin에서도 설정 가능.

- **로컬:** `./scripts/setup.sh` 실행 시 schema.sql 적용. 패치는 수동으로 `psql $DATABASE_URL -f docs/db/patches/파일명.sql`.
- **배포:** 동일 순서로 schema + patches 적용 후 앱 기동.

---

## 7. 참고

- **마이그레이션 계획:** `docs/TYPEORM_MIGRATION.md`
- **전체 스키마:** `docs/db/schema.sql`
- **로컬 DB:** `docs/guides/LOCAL_DB_SETUP.md`
- **E2E 테스트:** `server/test/app.e2e-spec.ts` — Health, /api/races, /api/results, 404. `pnpm --filter server run test:e2e`
