# TypeORM 마이그레이션

> **현재 단계:** 서비스 레이어 **TypeORM 전환 완료**. 모든 모듈이 Entity/Repository/QueryBuilder 사용.  
> **스키마:** DB는 `docs/DB_SCHEMA_FULL.sql` 수동 적용. TypeORM `synchronize`는 `false`, migration CLI는 선택 사항.  
> **정리:** “마이그레이션”은 이 단계에서 완료된 상태이며, 선택 작업만 남음(§4.5 TypeORM migration CLI 도입).

---

## 1. Raw SQL 방식의 문제점

직접 SQL 문자열을 작성하는 현재 방식에는 아래와 같은 한계가 있다.

| 문제 | 설명 |
|------|------|
| **유지보수** | 테이블/컬럼 변경 시 여러 서비스에서 동일한 SQL을 수동으로 찾아 수정해야 함. |
| **타입 안전성** | `$1, $2` 파라미터와 결과 `rows`를 수동으로 타입 단언해야 하며, 스키마와 코드 불일치를 컴파일 단계에서 잡기 어려움. |
| **스키마 드리프트** | DB 스키마와 코드가 어긋나기 쉽고, 문서(DB_SCHEMA_FULL.sql)와 실제 쿼리가 달라질 수 있음. |
| **마이그레이션** | 스키마 변경 시 SQL 파일을 수동으로 작성·실행해야 하며, 버전 관리·롤백이 체계화되지 않음. |
| **가독성·재사용** | 긴 INSERT/UPDATE/SELECT가 서비스에 흩어져 있어, 조인·조건이 반복되고 재사용이 어렵다. |
| **오타·실수** | 컬럼명·테이블명 오타가 런타임에만 드러나며, 파라미터 순서 실수 가능성이 있음. |

TypeORM을 도입하면 **Entity 기반 모델링**, **Repository 패턴**, **마이그레이션 CLI**로 위 문제를 줄일 수 있다.

---

## 2. 참고 문서

- **스키마 참고:** `docs/DB_SCHEMA_FULL.sql` — 테이블·컬럼·제약·Enum 정의
- **아키텍처:** `docs/architecture/DATABASE_SCHEMA.md`, `docs/architecture/ARCHITECTURE.md`
- **현재 DB 레이어:** TypeORM 전용. `server/src/database/entities/`, `TypeOrmModule.forRoot` (pg.service·database.module 제거됨)
- **Prisma 제거 요약:** `docs/PRISMA_REMOVAL.md`, `docs/PRISMA_REMOVAL_TODO.md`

---

## 3. TypeORM 전환 원칙

1. **Entity 우선** — `DB_SCHEMA_FULL.sql` 및 기존 Enum을 기준으로 Entity 정의. 한 번에 전체가 아닌 **모듈 단위**로 전환.
2. **Repository 주입** — 서비스에서는 `@InjectRepository(Entity)` 또는 `DataSource`(EntityManager) 사용. `PgService.query()` 호출을 TypeORM API로 교체.
3. **마이그레이션** — 스키마 변경은 TypeORM migration 생성/실행으로 관리 (`typeorm migration:generate`, `migration:run`).
4. **호환 유지** — (전환 완료) 모든 모듈이 TypeORM만 사용. `PgService` 제거됨.

---

## 4. 작업 순서 (TODO)

### 4.1 환경 설정

- [x] `server` 패키지에 `typeorm`, `@nestjs/typeorm` 추가 (`server/package.json`)
- [x] `app.module.ts`에 `TypeOrmModule.forRootAsync(...)` 설정 (DATABASE_URL, schema: 'oddscast', entities: [User, Favorite])
- [x] `docs/guides/TYPEORM_SETUP.md` 작성 (로컬 DB 연결, 마이그레이션 실행 방법)

**실행:** 프로젝트 루트에서 `pnpm install` 후 `pnpm --filter server build` 로 빌드 확인.

### 4.2 Entity 정의

- [x] `server/src/database/entities/` 디렉터리 생성
- [x] Enum: `db-enums.ts`의 `UserRole`, `FavoriteType`, `FavoritePriority` 등 Entity에서 사용
- [x] 핵심 Entity 2개 정의: **User** (`user.entity.ts`), **Favorite** (`favorite.entity.ts`)
- [x] 나머지 Entity: Race, RaceEntry, Prediction, RaceResult, ReferralCode, ReferralClaim (모듈 전환 시 추가); TrainerResult, JockeyResult 등 Kra 전환 시 추가
- [x] 관계: `Favorite` → `User` (`@ManyToOne`, `@JoinColumn`)

### 4.3 모듈별 전환

아래 순서는 의존성이 적은 것부터 진행하는 것을 권장한다.

- [x] **auth / users** — User Entity, Repository; 로그인/회원 관련 쿼리를 TypeORM으로 교체
- [x] **favorites** — Favorite Entity; `FavoritesService` 전부 `find`, `findOne`, `save`, `delete`, `findAndCount`, QueryBuilder 사용으로 전환 완료
- [x] **referrals** — ReferralCode, ReferralClaim Entity; `ReferralsService` 전환
- [x] **races** — Race, RaceEntry Entity; `RacesService` 전환
- [x] **results** — RaceResult Entity; `ResultsService` 전환
- [x] **predictions** — Prediction Entity; `PredictionsService` 전환 (race/raceResult 관계; trainer_results 등 raw 유지)
- [x] **kra** — KraService TypeORM Repository/QueryBuilder 사용
- [x] **payments / subscription / billing** — Entity 및 PaymentsService·SubscriptionBillingScheduler TypeORM 전환
- [x] **admin / config** — AdminService 추가, admin.controller 전부 AdminService(TypeORM) 위임

### 4.4 PgService

- [x] 모든 서비스는 TypeORM만 사용.
- [x] DatabaseModule 및 PgService 제거 완료. DB 접근은 TypeORM 전용.

### 4.5 스키마·마이그레이션

- **현재:** 스키마는 `docs/DB_SCHEMA_FULL.sql` 수동 적용. `synchronize: false`.
- [x] docs/guides/TYPEORM_SETUP.md §5에 CI/배포 시 마이그레이션 실행 방법 명시 (수동 SQL 및 TypeORM migration 사용 시)
- [x] TypeORM migration CLI 도입: `server/src/database/data-source.ts`, `migrations/` 디렉터리, `pnpm run migration:run` / `migration:generate --name=Name`

---

## 5. 적용 패턴 요약

| 현재 (raw SQL) | TypeORM 전환 예시 |
|----------------|-------------------|
| `this.db.query('SELECT * FROM users WHERE id = $1', [id])` | `this.userRepo.findOne({ where: { id } })` 또는 `this.userRepo.findOneBy({ id })` |
| `this.db.query('INSERT INTO favorites (...) VALUES ($1,...) RETURNING *', params)` | `this.favRepo.save(this.favRepo.create({ ... }))` |
| `this.db.query('UPDATE races SET ... WHERE id = $1', [...])` | `this.raceRepo.update(id, { ... })` 또는 `this.raceRepo.save(entity)` |
| `this.db.query('SELECT ... FROM predictions p INNER JOIN races r ...')` | `this.predRepo.find({ relations: ['race'] })` 또는 QueryBuilder |
| 복잡한 조건/집계 | `createQueryBuilder()` + `where`, `orderBy`, `getMany()` / `getRawOne()` |

---

## 6. 주의사항

- **트랜잭션:** 여러 테이블을 한 트랜잭션으로 묶는 로직은 `DataSource.transaction()` 또는 `EntityManager`로 처리.
- **JSON/JSONB:** Entity에서 `type: 'jsonb'` 또는 `transformer`로 직렬화/역직렬화 유지.
- **BigInt:** Prisma 제거 시점에 사용하던 `chaksunT` 등 BigInt 컬럼은 TypeORM에서도 `bigint` 타입으로 매핑.
- **테스트:** 기존에 `PgService`를 목으로 두던 테스트는 `getRepositoryToken(Entity)` 또는 MockRepository로 교체.

---

## 7. 마이그레이션 완료 체크리스트 (server)

| 모듈 | DB 접근 방식 | 비고 |
|------|--------------|------|
| auth | TypeORM (User, Repository + DataSource.transaction) | 완료 |
| users | TypeORM (User Repository) | 완료 |
| favorites | TypeORM (Favorite Repository) | 완료 |
| referrals | TypeORM (ReferralCode, ReferralClaim Repository) | 완료 |
| races | TypeORM (Race, RaceEntry Repository/QueryBuilder) | 완료 |
| results | TypeORM (RaceResult Repository/QueryBuilder) | 완료 |
| predictions | TypeORM (Prediction, Race, RaceEntry, RaceResult, TrainerResult Repository/QueryBuilder) | 완료 |
| predictions.scheduler | TypeORM (Race, Prediction, RaceResult QueryBuilder) | 완료 |
| kra | TypeORM (Race, RaceEntry, RaceResult, Training, JockeyResult, TrainerResult, KraSyncLog Repository) | 완료 |
| admin | TypeORM (AdminService: Bet, Subscription, User, Race 등 Repository) | 완료 |
| config | TypeORM (GlobalConfig Repository) | 완료 |
| payments | TypeORM (Subscription, SubscriptionPlan, BillingHistory, PredictionTicket Repository) | 완료 |
| subscriptions | TypeORM (SubscriptionPlan, Subscription Repository + DataSource.transaction) | 완료 |
| subscription-billing.scheduler | TypeORM (Subscription Repository/QueryBuilder) | 완료 |
| notifications | TypeORM (Notification, PushToken, UserNotificationPreference Repository) | 완료 |
| single-purchases | TypeORM (SinglePurchase Repository) | 완료 |
| points | TypeORM (PointTransaction, PointConfig 등 Repository + DataSource.transaction) | 완료 |
| prediction-tickets | TypeORM (PredictionTicket Repository + DataSource.transaction) | 완료 |
| bets | TypeORM (Bet Repository) | 완료 |
| picks | TypeORM (UserPick Repository) | 완료 |
| horses / jockeys / trainers | TypeORM (각 Repository) | 완료 |
| analysis | TypeORM (Race, RaceEntry 등 Repository) | 완료 |
| weekly-preview | TypeORM (WeeklyPreview Repository) | 완료 |
| rankings | TypeORM (User Repository) | 완료 |
| fortune | TypeORM (UserDailyFortune Repository) | 완료 |
| activity-logs | TypeORM (AdminActivityLog, UserActivityLog Repository) | 완료 |

- **PgService / DatabaseModule:** 제거됨. `server/src` 내 참조 0건.
- **스키마:** `docs/DB_SCHEMA_FULL.sql` 수동 적용. TypeORM `synchronize: false`.

이 문서를 마이그레이션 진행 시 체크리스트로 사용하고, 완료된 항목은 `[x]`로 표시한다.
