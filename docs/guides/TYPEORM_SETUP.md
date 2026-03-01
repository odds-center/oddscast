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

- **최초 DB 준비:** `docs/DB_SCHEMA_FULL.sql`을 DB에 실행해 스키마·테이블·Enum을 생성.
- **스키마 이름:** `oddscast`. `TypeOrmModule.forRootAsync`에서 `schema: 'oddscast'`로 설정됨.

---

## 4. 앱에서의 사용

- **Entity:** `server/src/database/entities/` 에 정의.  
  현재: `User`, `Favorite`. 추가 Entity는 동일 디렉터리에 생성 후 `entities/index.ts`와 `app.module.ts`의 `entities: [...]`에 등록.
- **Repository 주입:** 서비스에서 `@InjectRepository(User)` 등으로 주입 후 사용.
- **PgService와 병행:** 전환 완료 전까지는 기존 `PgService`(raw SQL)와 TypeORM을 함께 사용 가능. 모듈별로 TypeORM으로 옮긴 뒤, 최종적으로 PgService 제거.

---

## 5. 마이그레이션 (추후)

스키마 변경 시 TypeORM CLI로 마이그레이션 생성·실행할 예정.

- **생성:** `pnpm --filter server exec typeorm migration:generate -d src/database/data-source.js src/database/migrations/MigrationName`
- **실행:** `pnpm --filter server exec typeorm migration:run -d src/database/data-source.js`

DataSource 파일(`data-source.ts`)과 `migrations` 디렉터리는 마이그레이션 도입 시 추가.  
현재는 기존 `DB_SCHEMA_FULL.sql` 수동 적용으로 스키마 관리.

---

## 6. 참고

- **마이그레이션 계획:** `docs/TYPEORM_MIGRATION.md`
- **전체 스키마:** `docs/DB_SCHEMA_FULL.sql`
- **로컬 DB:** `docs/guides/LOCAL_DB_SETUP.md`
