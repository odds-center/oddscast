# Prisma 제거 및 PgService(raw SQL) 전환

## 완료된 작업

- Prisma 패키지 및 `server/prisma/` 폴더 제거
- `PgService` (pg Pool) 및 `DatabaseModule` 추가
- `app.module`에서 `PrismaModule` 제거, `DatabaseModule` 사용
- **구현 완료 (raw SQL):** Auth, Config, Users, Rankings, PredictionTickets, Horses, Jockeys, Trainers, Admin controller, Payments, SubscriptionBillingScheduler, Referrals, PredictionsScheduler, **RacesService**, **ResultsService**, **KraService**, **PredictionsService**, FavoritesService 등 전부 `this.db.query(...)` 로 전환 완료
- **공용:** `server/src/common/race-includes.ts`, `server/src/database/db-enums.ts` (타입 호환용)
- **참조:** `docs/DB_SCHEMA_FULL.sql` — Railway 등에서 스키마 적용용

## TypeORM 마이그레이션 — 완료

서버는 **TypeORM** 기반으로 전환 완료되었다. 엔티티·Repository·QueryBuilder 사용, Prisma 및 `server/prisma/` 제거 완료.

- **참고:** [docs/TYPEORM_MIGRATION.md](./TYPEORM_MIGRATION.md), [docs/PRISMA_REMOVAL_TODO.md](./PRISMA_REMOVAL_TODO.md)
- **CLI 시드:** `server/scripts/seed-sample-races.mjs`는 Prisma 없이 `pg`만 사용.

## DB 스키마 적용 (Railway 등)

1. Railway에서 PostgreSQL 생성 후 연결 URL 확인
2. `docs/DB_SCHEMA_FULL.sql` 내용을 해당 DB에 실행
3. `DATABASE_URL` 환경 변수 설정

## 빌드 확인

```bash
pnpm install
pnpm --filter @oddscast/shared build
pnpm --filter server build
```
