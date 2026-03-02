# 데이터 적재 가이드

**Last updated:** 2026-03-02

---

## 경마 시행일 데이터 출처 (공공데이터)

**경마 시행일/일정 데이터는 공공데이터로 제공됩니다.**

| 출처 | API/데이터셋 | 용도 |
|------|--------------|------|
| [공공데이터포털 – 한국마사회 경주계획표](https://www.data.go.kr/data/15056499/openapi.do) | **API72_2** `racePlan_2` | 서울·부산경남·제주 시행 예정 경주계획 (년·월·일 조회) |
| [공공데이터포털 – 한국마사회 대상경주 연간계획](https://www.data.go.kr/data/15059482/openapi.do) | 연간계획 API | 연간 시행계획 (연도 단위 조회 시 활용 가능) |
| [공공데이터포털 – 한국마사회 AI학습용 경주계획](https://www.data.go.kr/data/15143802/openapi.do) | AI학습용 경주계획 | 경마장·경주일자·경주번호 등 상세 |

- **활용 방법**: [공공데이터포털](https://www.data.go.kr/) 로그인 → "한국마사회" 검색 → 해당 API 활용신청 → ServiceKey 발급 후 `server/.env`의 `KRA_SERVICE_KEY`에 설정.
- **본 프로젝트**: 시행일 화면(`/races/schedule`)은 위 **API72_2 경주계획표**를 Admin/Cron으로 동기화해 DB에 적재한 `Race` 데이터를 집계해 표시합니다. 즉, 공공데이터 → 서버 DB → 달력 UI 순입니다.
- **영천** 등 추가 경마장 코드는 KRA 공개 범위에 따라 API72_2 파라미터(`meet`) 또는 별도 연간계획 API 명세를 확인하면 됩니다.

---

## 출전마가 보이지 않을 때

웹앱 경주 상세(`/races/[id]`)에서 **출전마 정보가 없습니다. KRA 출전표 적재 후 표시됩니다**가 뜨면:

1. **Admin 로그인** → **KRA 데이터** (`/kra`) 이동
2. 해당 경주 날짜 선택 후 **출전표 동기화** 버튼 클릭
3. 동기화 완료 후 웹앱에서 새로고침

출전마 데이터는 KRA 출전표 API(API26_2)에서 가져와 `race_entries` 테이블에 저장됨.

> **참고:** 경기 종료 후(`status=COMPLETED`)에는 출전마 섹션이 숨겨지고 경주 결과 테이블만 표시됩니다.

---

## 1. KRA API 동기화 (실제 경마 데이터)

### 사전 요구사항
- [공공데이터포털](https://www.data.go.kr/)에서 "한국마사회" API 활용신청
- `server/.env`에 `KRA_SERVICE_KEY` 설정 (인코딩된 키)

### 수동 동기화 (Admin)

**Admin 패널 → KRA 데이터 (`/kra`)** 페이지에서 버튼으로 실행 가능.

| API | 설명 |
|-----|------|
| `POST /api/admin/kra/sync/schedule` | 미래 스케줄 전체 적재 (오늘~1년 내 금·토·일, 경주계획표+출전표) |
| `POST /api/admin/kra/sync/schedule?year=YYYY` | 해당 연도 전체(1~12월) 경주계획표만 적재 (예: 2026년 시행일 달력용, API72_2 월별 12회 호출) |
| `POST /api/admin/kra/sync/schedule?date=YYYYMMDD` | 해당 날짜 적재 (경주계획표→출전표) |
| `POST /api/admin/kra/sync/results` | 과거 1년 결과 적재 (금·토·일) |
| `POST /api/admin/kra/sync/results?date=YYYYMMDD` | 해당 날짜 경주 결과만 적재 |
| `POST /api/admin/kra/sync/details?date=YYYYMMDD` | 상세 분석 데이터 |
| `POST /api/admin/kra/sync/jockeys?meet=1|2|3` | 기수 통산전적 |
| `POST /api/admin/kra/sync/all?date=YYYYMMDD` | 전체 적재 (경주계획표→출전표→결과→상세→기수) |
| `POST /api/admin/kra/sync/historical?dateFrom=YYYYMMDD&dateTo=YYYYMMDD` | 과거 데이터 일괄 적재 |
| `POST /api/admin/kra/seed-sample?date=YYYYMMDD` | 샘플 경주 데이터 (KRA 키 없음) |
| `GET /api/admin/kra/sync-logs` | 동기화 로그 조회 |

### 경주 종료 판단 및 배치 스케줄 (batch_schedules)

- **1경기 종료 시점**: 한국마사회 기준 발주 후 약 2~3분 내 결선, 결과 API 반영까지 여유를 두어 **발주 시각 + 10분**을 "경주 종료"로 판단 (`RACE_END_BUFFER_MINUTES = 10`).
- **경기 적재 시**: 경주계획표/출전표 적재 후 `scheduleResultFetchForRcDate(rcDate)` 호출. 해당 날짜의 **각 경주**에 대해 (stTime + 10분) 시각에 `batch_schedules`에 `KRA_RESULT_FETCH` job을 등록. 동일 (targetRcDate, scheduledAt)은 중복 등록하지 않음.
- **배치 실행**: `processDueBatchSchedulesCron`이 5분마다 실행되어 `scheduledAt <= now`인 PENDING job을 처리. job 1건당 해당 `targetRcDate` 전체 결과를 KRA에서 가져와 저장하고, 결과가 있는 경주는 `Race.status = COMPLETED`로 갱신.
- 따라서 11:00 경주는 11:10에 배치가 돌아 결과 적재 후 경주 목록에서 "종료"로 표시됨.

### Cron 스케줄 (자동 동기화)

| Cron | 시각 | 동작 |
|------|------|------|
| `processDueBatchSchedulesCron` | 5분마다 | `batch_schedules`의 PENDING job 중 due 실행 → KRA 결과 수집 |
| `syncFutureRacePlans` | 매주 월 03:00 | API72_2 경주계획표 → 오늘~1년 내 금·토·일 Race 적재 |
| `syncWeeklySchedule` | 수·목 18:00 | 금·토·일 경주계획표+출전표 선적재 |
| `syncRaceDayMorning` | 금·토·일 08:00 | 당일 출전표+상세정보 |
| `syncResultsWhenRacesEnded` | 금·토·일 10~20시 5분 간격 | 경주 종료 시각 지난 날짜 결과 수집 (배치 미실행 시 보완) |
| `syncRealtimeResults` | 금·토·일 10:30~19:00 (30분 간격) | 결과·상세 갱신 |
| `syncPreviousDayResults` | 매일 06:00 | 전날(금·토·일) 결과 사후 동기화 |

### KRA API 2종 (경주계획표 vs 출전표)

| API | 엔드포인트 | 용도 | 데이터 시점 |
|-----|------------|------|-------------|
| **API72_2** | `racePlan_2` | 경주계획표 (시행예정 경주 정보) | 미래 일정 포함 (년·월·일 전체 조회 가능) |
| **API26_2** | `entrySheet_2` | 출전표 (출전마 상세) | 경주 2~3일 전부터 제공 |

- **미래 스케줄**: API72_2로 Race 레코드 선생성 → API26_2로 출전마 추가(출전표 열린 날짜에만)
- **상세 명세**: [`KRA_RACE_PLAN_SPEC.md`](specs/KRA_RACE_PLAN_SPEC.md), [`KRA_ENTRY_SHEET_SPEC.md`](specs/KRA_ENTRY_SHEET_SPEC.md)

### 개선 사항 (적재 성공률 향상)
- **날짜 정규화**: `YYYY-MM-DD` / `YYYYMMDD` 자동 변환, 빈값·잘못된 값 시 오늘 날짜 fallback
- **KRA API 응답 파싱 통일**: `body.items`(배열), `body.items.item`(배열/단일), 단일 객체(경주 1건) 모두 처리 (`parseKraBodyItems`)
- **API resultCode 검사**: `resultCode !== '00'` 시 해당 meet/날짜 스킵 후 로그·KraSyncLog 기록 (경주계획표·출전표·결과 동일 적용)
- **응답 키 정규화**: `rc_no`/`rcNo`, `hr_name`/`hrName` 등 양쪽 지원
- `_type=json` 파라미터로 JSON 응답 우선 사용
- 키 미설정 시 500 대신 안내 메시지 반환
- 출전표 처리 시 Race upsert 후 조회 실패 시 경고 로그 후 해당 항목만 스킵 (전체 실패 방지)

---

## 2. 샘플 데이터 (KRA 키 없이 개발용)

```bash
cd server
pnpm run seed:sample-races [YYYYMMDD]
# 예: pnpm run seed:sample-races 20250214
```

- 기본: 오늘 또는 최근 금/토/일
- 서울/부산 각 6경주, 경주당 8마리 출전마

### 오류 시
- `Null constraint violation`: DB 스키마가 DDL/엔티티와 다를 수 있음. Supabase Table Editor에서 `races` 테이블 구조 확인
- `DATABASE_URL 미설정`: `server/.env`에 `DATABASE_URL` 추가

---

## 3. DB 스키마 호환성

### stTime 컬럼 (선택)
DB에 `stTime` 컬럼이 없으면 `races` 테이블에 추가:

```sql
ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "stTime" VARCHAR(20);
```

Supabase SQL Editor 또는 `psql`로 실행 후, TypeORM `Race` 엔티티(`server/src/database/entities/race.entity.ts`)에 `stTime` 필드가 있는지 확인.

### TypeORM ↔ DB 불일치 시
- 엔티티: camelCase (raceName, rcDate 등)
- DB가 snake_case (race_name, rc_date 등) 사용 시 엔티티에 `@Column({ name: 'race_name' })` 등 매핑 적용
- 현재 프로젝트는 camelCase DB 기준 (`docs/db/schema.sql`)
