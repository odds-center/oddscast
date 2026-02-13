# 데이터 적재 가이드

## 출전마가 보이지 않을 때

웹앱 경주 상세(`/races/[id]`)에서 **출전마 정보가 없습니다. KRA 출전표 적재 후 표시됩니다**가 뜨면:

1. **Admin 로그인** → **KRA 데이터** (`/kra`) 이동
2. 해당 경주 날짜 선택 후 **출전표 동기화** 버튼 클릭
3. 동기화 완료 후 웹앱에서 새로고침

출전마 데이터는 KRA 출전표 API(API26_2)에서 가져와 `race_entries` 테이블에 저장됨.

---

## 1. KRA API 동기화 (실제 경마 데이터)

### 사전 요구사항
- [공공데이터포털](https://www.data.go.kr/)에서 "한국마사회" API 활용신청
- `server/.env`에 `KRA_SERVICE_KEY` 설정 (인코딩된 키)

### 수동 동기화 (Admin)

**Admin 패널 → KRA 데이터 (`/kra`)** 페이지에서 버튼으로 실행 가능.

| API | 설명 |
|-----|------|
| `POST /api/admin/kra/sync/schedule?date=YYYYMMDD` | 출전표 적재 (경주 + 출전마) |
| `POST /api/admin/kra/sync/results?date=YYYYMMDD` | 경주 결과 적재 |
| `POST /api/admin/kra/sync/details?date=YYYYMMDD` | 상세 분석 데이터 |
| `POST /api/admin/kra/sync/jockeys?meet=1|2|3` | 기수 통산전적 |
| `POST /api/admin/kra/sync/all?date=YYYYMMDD` | 전체 적재 (출전표→결과→상세→기수) |
| `POST /api/admin/kra/sync/historical?dateFrom=YYYYMMDD&dateTo=YYYYMMDD` | 과거 데이터 일괄 적재 |
| `POST /api/admin/kra/seed-sample?date=YYYYMMDD` | 샘플 경주 데이터 (KRA 키 없음) |
| `GET /api/admin/kra/sync-logs` | 동기화 로그 조회 |

### 개선 사항 (적재 성공률 향상)
- 날짜 정규화: `YYYY-MM-DD` → `YYYYMMDD` 자동 변환
- KRA API 응답 키 정규화: `rc_no`/`rcNo`, `hr_name`/`hrName` 등 양쪽 지원
- `_type=json` 파라미터로 JSON 응답 우선 사용
- 키 미설정 시 500 대신 안내 메시지 반환

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
- `Null constraint violation`: DB 스키마가 Prisma와 다를 수 있음. Supabase Table Editor에서 `races` 테이블 구조 확인
- `DATABASE_URL 미설정`: `server/.env`에 `DATABASE_URL` 추가

---

## 3. DB 스키마 호환성

### stTime 컬럼 (선택)
DB에 `stTime` 컬럼이 없으면 `races` 테이블에 추가:

```sql
ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "stTime" VARCHAR(20);
```

Supabase SQL Editor 또는 `psql`로 실행 후, `schema.prisma`의 Race 모델에 `stTime String?` 필드를 다시 추가.

### Prisma ↔ DB 불일치 시
- Prisma: camelCase (raceName, rcDate 등)
- Supabase/일부 PostgreSQL: snake_case (race_name, rc_date 등) 사용 시 `@map` 적용
- 현재 프로젝트는 camelCase DB 기준
