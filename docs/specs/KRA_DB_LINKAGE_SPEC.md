# KRA API ↔ DB 연동 구조 (Race / RaceEntry 공통 키)

> **목적:** 각 KRA API에서 Race와 RaceEntry를 일관되게 연동하기 위한 공통 식별자 및 데이터 흐름 정리

---

## 1. 공통 DB 식별자

### Race (경주)

| DB 필드 | KRA API 공통 키 | 설명 |
|---------|-----------------|------|
| `meet` | `meet` | 시행경마장 (서울/제주/부산경남) |
| `rcDate` | `rcDate` / `rc_date` | 경주일 (YYYYMMDD) |
| `rcNo` | `rcNo` / `rc_no` | 경주번호 |

**Unique Constraint:** `[meet, rcDate, rcNo]` — 모든 KRA API가 이 3개 값으로 동일 경주를 식별

### RaceEntry (출전마)

| DB 필드 | KRA API 공통 키 | 설명 |
|---------|-----------------|------|
| `raceId` | — | Race.id (FK, Race 조회 후 사용) |
| `hrNo` | `hrNo` / `hr_no` | 마번(고유번호) |

**식별:** `(raceId, hrNo)` — 동일 경주 내 출전마 구분

### RaceResult (경주 결과)

| DB 필드 | KRA API 공통 키 | 설명 |
|---------|-----------------|------|
| `raceId` | — | Race.id |
| `hrNo` | `hrNo` / `hr_no` | 마번 |

---

## 2. KRA API별 역할

| API | Race | RaceEntry | RaceResult | 비고 |
|-----|------|-----------|------------|------|
| **entrySheet_2** (출전표) | ✅ 생성/갱신 | ✅ 생성/갱신 | — | **Race+Entry 동시 연동** |
| **raceResult_3** (경주결과) | ✅ 갱신(또는 생성) | — | ✅ 생성/갱신 | Entry 없이 Race만 만들 수 있음 ⚠️ |
| **trackInfo** (경주로정보) | ✅ 갱신 | — | — | weather, track |
| **raceHorseInfo** (경주마상세) | — | ✅ 갱신 | — | rcCntT, ord1CntT 등 |
| **horseWeight** (출전마체중) | — | ✅ 갱신 | — | horseWeight |
| **equipment/bleeding** | — | ✅ 갱신 | — | equipment, bleedingInfo |
| **horseCancel** (출전취소) | — | ✅ 갱신 | — | isScratched |
| **training** | — | — | — | trainings 테이블 |

---

## 3. 연동 원칙

### 3.1 Race 조회/생성

- 모든 API는 `meet + rcDate + rcNo` → `Race` 조회/생성 시 동일 패턴 사용
- **권장:** `getOrCreateRace(meet, rcDate, rcNo)` 같은 공통 유틸로 통합

### 3.2 RaceEntry 의존성

- **entrySheet_2**가 Race와 RaceEntry를 동시에 적재 (출전표 = 출전마 목록)
- **다른 API**는 `Race`가 이미 존재하고, `Race.entries`가 있어야 `hrNo`로 Entry 갱신 가능
- **문제 시나리오:** `raceResult_3`만 먼저 실행 시 Race는 있으나 Entry 없음 → 출전마 미표시

### 3.3 sync 순서

```
출전표(entrySheet) → 결과(raceResult) → 상세/훈련/기수
```

- **syncAll:** 출전표 먼저 → Race+Entry 적재 → 결과/상세는 기존 Race/Entry 갱신
- **syncHistoricalBackfill:** 결과 API만 호출(`createRaceIfMissing=true`) → Race만 생김, Entry 없음 ⚠️

---

## 4. Race 조회 공통 패턴 (경주말·기수 함께 로드)

경주(Race)를 조회할 때 **출전마(entries)**를 항상 함께 로드. entries에는 경주말(hrName), 기수(jkName), 조교사(trName) 등이 포함됨.

### 4.1 공통 Include 상수

| 상수 | 용도 | 포함 데이터 |
|------|------|-------------|
| `RACE_INCLUDE_ENTRIES` | 기본 | 경주 + 출전마(경주말·기수) |
| `RACE_INCLUDE_ENTRIES_ACTIVE` | 출전취소 제외 | 경주 + 출전마 (isScratched=false) |
| `RACE_INCLUDE_FULL` | 상세 조회 | 경주 + 출전마 + 결과 + 예측 |
| `RACE_INCLUDE_FOR_ANALYSIS` | AI 예측 | 경주 + 출전마 + 훈련 내역 |

**위치:** `server/src/common/prisma-includes.ts`

### 4.2 적용 대상

- **RacesService**: findAll, findOne, create, update, getSchedule, getRacesByDate
- **PredictionsService**: Gemini 예측 시 `RACE_INCLUDE_FOR_ANALYSIS` 사용

### 4.3 응답 구조

API 응답의 `race.entries` 배열에는 각 출전마별로 다음 정보가 포함됨:

- `hrNo`, `hrName` — 마번, 마명 (경주말)
- `jkNo`, `jkName` — 기수번호, 기수명 (경마선수)
- `trNo`, `trName` — 조교사번호, 조교사명
- `wgBudam` — 부담중량
- `chulNo` — 출전번호
- 기타: age, sex, rating, chaksun1 등

---

## 5. 개선 제안

### 5.1 공통 Race 유틸

```ts
// kra.service.ts 또는 별도 kra-race.util.ts
async getOrCreateRace(meet: string, rcDate: string, rcNo: string): Promise<Race | null> {
  return this.prisma.race.upsert({
    where: { meet_rcDate_rcNo: { meet, rcDate, rcNo } },
    create: { meet, rcDate, rcNo, status: 'SCHEDULED' },
    update: {},
  });
}
```

### 5.2 fetchRaceResults에서 Entry 보강

- `createRaceIfMissing=true`로 Race를 생성한 경우, **동일 item의 hrNo/hrName/jkName 등으로 RaceEntry도 생성**
- 또는: 과거 백필 시 entrySheet API도 호출하도록 syncHistoricalBackfill 수정

### 5.3 API 응답 필드명 통일

- KRA 응답이 camelCase / snake_case 혼재 (`rcNo` vs `rc_no`)
- `v(key)`, `vs(key)` 헬퍼로 양쪽 지원 중 — 각 API에서 동일 패턴 적용

---

## 6. 참고

- [KRA_ENTRY_SHEET_SPEC.md](./KRA_ENTRY_SHEET_SPEC.md) — 출전표 응답 필드
- [KRA_RACE_RESULT_SPEC.md](./KRA_RACE_RESULT_SPEC.md) — 경주결과 응답 필드
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) — Prisma 스키마
- [KRA_API_ANALYSIS_SPEC.md](./KRA_API_ANALYSIS_SPEC.md) — API→DB 매핑 요약
