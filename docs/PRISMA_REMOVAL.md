# Prisma 제거 및 PgService(raw SQL) 전환

## 완료된 작업

- Prisma 패키지 및 `server/prisma/` 폴더 제거
- `PgService` (pg Pool) 및 `DatabaseModule` 추가
- `app.module`에서 `PrismaModule` 제거, `DatabaseModule` 사용
- **구현 완료 (raw SQL):** Auth, Config, Users, Rankings, PredictionTickets, Horses, Jockeys, Trainers, Admin controller, Payments, SubscriptionBillingScheduler, Referrals, PredictionsScheduler, **RacesService**, **ResultsService**, **KraService**, **PredictionsService**, FavoritesService 등 전부 `this.db.query(...)` 로 전환 완료
- **공용:** `server/src/common/race-includes.ts`, `server/src/database/db-enums.ts` (타입 호환용)
- **참조:** `docs/DB_SCHEMA_FULL.sql` — Railway 등에서 스키마 적용용

## 다음 단계: TypeORM 마이그레이션 (권장)

현재는 **raw SQL 직접 작성** 방식이라 유지보수·타입 안전성·스키마 마이그레이션 관리에 한계가 있다.  
**TypeORM** 으로 전환하는 계획과 작업 순서는 **`docs/TYPEORM_MIGRATION.md`** 에 정리되어 있다.

- **마이그레이션 문서:** [docs/TYPEORM_MIGRATION.md](./TYPEORM_MIGRATION.md)  
- 상세 TODO·체크리스트: `docs/PRISMA_REMOVAL_TODO.md` (Prisma → raw SQL 전환 완료 상태 반영)

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
