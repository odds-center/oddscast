# Prisma 제거 작업 계획 (TODO)

> **상태:** Prisma 제거 완료. **TypeORM 전환 완료.** DB 접근은 TypeORM(Entity/Repository/QueryBuilder) 전용. PgService·DatabaseModule 제거됨.  
> **참고:** `docs/PRISMA_REMOVAL.md`, `docs/TYPEORM_MIGRATION.md`, `docs/DB_SCHEMA_FULL.sql`

---

## 진행 원칙

1. **순서대로 진행** — 아래 TODO를 위에서부터 체크하며 작업.
2. **한 파일 단위** — 한 파일의 `this.prisma` 호출을 모두 `this.db.query(...)` 로 바꾼 뒤 빌드 확인.
3. **패턴** — `this.prisma.model.findMany/create/update/upsert/deleteMany` → `this.db.query('SELECT/INSERT/UPDATE/...', [params])` 로 치환.

---

## 완료된 항목 (참고용)

- [x] Prisma 패키지·폴더 제거, PgService·DatabaseModule 추가
- [x] auth, config, users, rankings, prediction-tickets, horses, jockeys, trainers
- [x] admin.controller, payments.service, subscription-billing.scheduler
- [x] referrals.service, predictions.scheduler, races.service, results.service
- [x] kra.controller, kra.service 일부 (syncOrphanedRaceResults, logKraSync, upsertRaceAndEntry, fetchRaceResults 내 race/entry/result, updateMany+findMany, fetchRaceEntries, fetchRacePlanSchedule 2곳)

---

## TODO: 남은 작업 (순서대로 진행)

### 1. kra.service.ts — 완료

- [x] fetchHorseDetails, fetchTrainingData, jockeyResult/trainerResult upsert, syncAnalysisData, fetchTrackInfo, fetchRaceHorseRatings, fetchHorseSectionalRecords, fetchHorseWeight, fetchEquipmentBleeding, fetchHorseCancel, seedSampleRaces — 전부 `this.db.query`(raw SQL)로 전환 완료.
- [x] 파일 내 `this.prisma` 0건.

### 2. predictions.service.ts — 완료

- [x] constructor `PgService` 사용, 모든 `this.prisma.*` → `this.db.query` 전환.
- [x] `loadRaceWithEntries` 헬퍼 추가, getDashboard/ getAnalyticsDashboard/ getAccuracyHistory/ generatePostRaceSummary/ getAccuracyStats/ getPreview/ getByRace/ getByRaceHistory/ findAllForAdmin/ generateBatchWithProgress/ getMatrix/ getCommentary/ getHitRecords/ generatePrediction/ enrichEntriesWithRecentRanks/ enrichEntriesWithFallHistory/ enrichEntriesWithTrainerResults/ getSectionalAnalysisByHorse 등 전부 raw SQL로 이전.
- [x] 빌드 성공, `this.prisma` 0건.

### 3. favorites.service.spec.ts — 완료

- [x] PrismaService 제거, PgService 목(`mockPgService.query`) 사용.
- [x] `providers: [{ provide: PgService, useValue: mockPgService }]`, spec 4개 통과.

---

### 4. 최종 점검

- [x] **전역 검색**  
  - `server/src`: PrismaService / this.prisma / from '../prisma/' 0건.
  - `server/scripts/seed-sample-races.mjs`: Prisma 제거 완료 → `pg`만 사용.

- [x] **빌드**  
  - `pnpm --filter server build` 성공.

- [x] **문서 갱신**  
  - `docs/PRISMA_REMOVAL.md` “다음 단계”에 TypeORM 완료 반영.

---

## 작업 시 참고

| Prisma 호출           | Raw SQL 대체 예시 |
|-----------------------|-------------------|
| `findUnique({ where: { id } })` | `SELECT * FROM table WHERE id = $1` |
| `findFirst({ where: {...} })`   | `SELECT * FROM table WHERE ... LIMIT 1` |
| `findMany({ where, orderBy, take, skip })` | `SELECT ... WHERE ... ORDER BY ... LIMIT $n OFFSET $m` |
| `create({ data })`    | `INSERT INTO table (...) VALUES (...) RETURNING *` |
| `update({ where, data })` | `UPDATE table SET ... WHERE id = $1` |
| `upsert({ where, create, update })` | `INSERT ... ON CONFLICT (...) DO UPDATE SET ...` |
| `deleteMany({ where })` | `DELETE FROM table WHERE ...` |
| `count({ where })`    | `SELECT COUNT(*)::text AS count FROM table WHERE ...` |

- 컬럼명: Prisma camelCase → DB는 `"camelCase"` (따옴표) 또는 snake_case는 스키마 확인.  
- JSON 필드: `data::jsonb` 또는 `$1::jsonb` 사용.

이 문서를 TODO 체크리스트로 사용해 위에서부터 순서대로 진행하면 됩니다.
