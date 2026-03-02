# 경주 상태(종료/예정) 및 KRA 연동 정책

> **종료·예정 표시는 DB의 `race.status`만 사용한다. 날짜/시각으로 추론하지 않는다.**

---

## 1. 정책 요약

| 표시 | 의미 | 결정 기준 |
|------|------|------------|
| **예정** | 경주가 아직 진행 전 | `race.status` = SCHEDULED (또는 IN_PROGRESS) |
| **진행** | 시작 시각은 지났으나 결과 미적재 | SCHEDULED/IN_PROGRESS + UI에서 시작 시각 경과 시 "진행" 라벨 표시 가능 |
| **종료** | 결과가 적재됨 | `race.status` = **COMPLETED** (KRA 결과 API 적재 시에만 설정) |

- **COMPLETED는 KRA 결과가 실제로 DB에 저장된 경주에만 설정된다.**
- 과거 날짜라도 결과를 아직 받지 않은 경주는 COMPLETED로 바꾸지 않는다 (날짜 기반 자동 COMPLETED 처리 없음).

---

## 2. 서버 동작

### 2.1 COMPLETED 설정 시점

- **KRA 결과 API** (`fetchRaceResults` 등)에서 **경주별 결과(row)를 DB에 저장할 때**, 해당 `raceId`에 대해 `race.status`를 `COMPLETED`로 업데이트한다.
- 그 외 크론/배치에서 “날짜가 지났으니 COMPLETED로 일괄 변경”하는 로직은 **사용하지 않는다.**

### 2.2 API 응답에서의 status 보정

- **경주 목록/상세/일자별 API**: DB의 `race.status`를 그대로 쓰되, **착순(ordInt/ordType)이 있는 결과 행이 1건 이상인 경주만 COMPLETED**로 보정한다. 결과 행만 있고 착순이 없으면 SCHEDULED로 보정. "결과 있음" = `race_results`에 `ordInt IS NOT NULL OR ordType IS NOT NULL`인 행이 1건 이상.  
  → 클라이언트는 “종료” 여부를 이 보정된 `status`만으로 판단하면 된다.

### 2.3 경주 결과 API (getRaceResult)

- **COMPLETED인 경주만** 결과를 반환한다.  
- “시작 시각이 지났다”는 이유만으로 결과를 주지 않는다. (결과는 KRA 적재 후에만 존재)

### 2.4 KRA 결과 적재 Cron (경주 종료 시점 기준)

- **syncResultsWhenRacesEnded**: 매 5분(금/토/일 10:00–20:59 KST) 실행. 오늘/어제 경주 중 종료 시각(rcDate+stTime+20분)이 지난 경주가 있고 status가 아직 COMPLETED가 아닌 rcDate만 대상으로 fetchRaceResults(rcDate) 호출. 같은 rcDate는 10분 쿨다운.
- **syncRealtimeResults**: 15분 주기 폴백. 당일 전체 결과 재적재로 누락 보완.

### 2.5 배치 스케줄 테이블 (batch_schedules)

- **경기(계획) 적재 시** 해당 일자(rcDate)에 대해 **경주 결과 조회 작업**을 DB에 등록한다. `scheduledAt` = 해당 일자의 마지막 경주 종료 시각(시작+20분, stTime 없으면 23:59 KST).
- **Cron (매 5분)**: `processDueBatchSchedules` — `status = PENDING` 이고 `scheduledAt <= now` 인 작업을 실행하고, 완료 시 `COMPLETED` 또는 실패 시 `FAILED` 로 갱신.
- **작업 예정/완료 구분**: Admin 또는 `GET /api/kra/batch-schedules` 로 조회. `status`: PENDING(예정), RUNNING, COMPLETED(완료), FAILED, CANCELLED.
- 테이블: `batch_schedules` (jobType, targetRcDate, scheduledAt, status, startedAt, completedAt, errorMessage 등). 패치: `docs/db/patches/batch_schedules.sql`.

---

## 3. 클라이언트(WebApp/Admin) 동작

- **표시용 종료**: 경주 종료 시각(rcDate+stTime+20분, stTime 없으면 해당일 23:59 KST)이 지나면 **무조건 "종료"**로 표시. `getDisplayRaceStatus`는 `isRaceActuallyEnded`가 true이면 COMPLETED 반환. (이미 끝난 경기는 예정이 아닌 종료로 표시.)
- **결과·배당 노출**: 서버가 COMPLETED(실제 결과 적재됨)이고 `isRaceActuallyEnded`일 때만 결과/배당 블록 노출.
- **종료 여부 (API 필터 등)**: `race.status === 'COMPLETED'` (또는 API가 내려준 `status`/`raceStatus`)만 사용한다.
- **`isPastRaceDate` / `isPastRaceDateTime`**  
  - “이 경주가 종료인가?”를 판단하는 데에는 **사용하지 않는다.**  
  - 필요 시 “진행 중” 라벨 표시(시작 시각 경과)나 “N분 후” 카운트다운 등 **표시용**으로만 사용할 수 있다.

---

## 4. 관련 문서

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — 시스템·데이터 흐름
- [API_SPECIFICATION.md](../architecture/API_SPECIFICATION.md) — 경주/결과 API
- [DATA_LOADING.md](../DATA_LOADING.md) — KRA 적재 흐름 (해당 시 문서 존재 시)
- [KRA_RACE_PLAN_SPEC.md](../specs/KRA_RACE_PLAN_SPEC.md) — KRA API 명세

---

## 5. 체크리스트 (구현/리뷰 시)

- [ ] 서버: COMPLETED 설정은 **결과 저장 경로**에서만 수행되는가?
- [ ] 서버: “날짜 지남 → COMPLETED 일괄 변경” 로직이 없는가?
- [ ] WebApp/Admin: “종료” 표시가 **status만**으로 결정되는가? (날짜 기반 fallback 제거)
- [ ] 경주 결과 API: COMPLETED가 아닌 경주에 대해 결과를 반환하지 않는가?
