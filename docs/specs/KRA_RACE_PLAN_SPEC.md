# 🐎 한국마사회 경주계획표 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주계획표
- **서비스 설명**: 서울, 부산경남, 제주 경마공원에서 시행 예정인 경주계획표 자료를 제공합니다.
- **데이터 제공 시점**: **미래 일정 포함** 전체 조회 가능. (출전표 API26_2는 경주 2~3일 전부터만 제공)
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)

**제공 자료**: 시행경마장명, 경주일자, 발주예정시각, 경주번호, 경주차수, 경주거리, 등급조건, 부담구분, 경주명, 레이팅하한조건, 레이팅상한조건, 연령조건, 1착상금, 2착상금, 3착상금, 4착상금, 5착상금, 1착부가상금, 2착부가상금, 3착부가상금

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API72_2`
- **Endpoint**: `/racePlan_2`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요

---

## 3. 요청 메시지 명세 (Request)

요청 파라미터로 시행경마장구분(meet), 경주년도(rc_year), 경주년월(rc_month), 경주일자(rc_date)를 이용하여 자료를 조회할 수 있습니다.

> **참고**: 경주년도·경주년월·경주일자 등을 모두 누락한 경우에는 경주일자 기준 **최근 한 달간**의 정보가 표출됩니다.  
> **연도 전체 조회**: 명세상 `rc_year`만 넣었을 때 연도 전체가 한 번에 반환되는지는 미정. **확실한 방법**은 `rc_year` + `rc_month`(YYYYMM)로 **1~12월 각각 호출**하는 것. (예: 2026년 전체 → rc_year=2026, rc_month=202601 … 202612, meet 생략 시 해당 월 전 경마장 데이터 한 번에 조회.)

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수      | String | -           | 공공데이터포털에서 받은 인증키 |
| **pageNo**     | 페이지 번호       | 필수      | Number | 1           | 조회할 페이지 번호             |
| **numOfRows**  | 한 페이지 결과 수 | 필수      | Number | 10          | 한 페이지에 출력할 결과 수     |
| **meet**       | 시행경마장구분    | 옵션      | Number | 1           | 1:서울, 2:제주, 3:부산경남     |
| **rc_year**    | 경주년도          | 옵션      | String | 2025        | YYYY 형식                      |
| **rc_month**   | 경주년월          | 옵션      | String | 202502      | YYYYMM 형식                    |
| **rc_date**    | 경주일자          | 옵션      | String | 20250219    | YYYYMMDD 형식                  |
| **_type**      | 출력 형식         | 옵션      | String | json        | json 또는 xml                  |

### 시행경마장 코드 (meet)

| 코드 | 경마장명   |
| :--: | :--------- |
| 1    | 서울       |
| 2    | 제주       |
| 3    | 부산경남   |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

| 항목명 (Key)    | 항목명 (국문)  | 설명                          |
| :-------------- | :------------- | :---------------------------- |
| **meet**        | 시행경마장명   | 시행 경마장 이름 (예: 서울)   |
| **rcDate**      | 경주일자       | 경주가 열리는 날짜 (YYYYMMDD) |
| **rcDay**       | 경주요일       | 경주 요일 (예: 일요일)        |
| **rcNo**        | 경주번호       | 해당 일자의 경주 번호         |
| **rcName**      | 경주명         | 경주 이름                     |
| **rcDist**      | 경주거리       | 경주 거리 (m)                 |
| **rank**        | 등급조건       | 경주 등급 (예: 국6등급)       |
| **rcGrade**     | 부담구분       | 부담 중량 방식                |
| **rcStartTime** | 발주예정시각   | 경주 시작 예정 시간           |
| **rcPrize**     | 1착상금        | 1등 상금                      |
| **chaksun1**    | 1착상금        | 1등 상금 (대체 필드)          |
| **rcCondition** | 경주조건       | 출전 조건                     |
| **rcAge**       | 연령조건       | 출전 연령 조건                |
| **weather**     | 날씨           | 예상 날씨                     |
| **track**       | 주로상태       | 주로 상태                     |

> **참고**: 응답 키는 camelCase(rcNo, rcName) 또는 snake_case(rc_no, rc_name) 형태로 올 수 있습니다. 구현 시 양쪽 모두 처리 권장.

---

## 5. 요청 예시 (Example)

**Request URL**

```http
http://apis.data.go.kr/B551015/API72_2/racePlan_2?serviceKey=[인증키]&meet=1&rc_year=2025&rc_month=202502&rc_date=20250219&numOfRows=500&pageNo=1&_type=json
```

**Response 예시**

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL SERVICE."
    },
    "body": {
      "items": {
        "item": [
          {
            "meet": "서울",
            "rcDate": "20250219",
            "rcNo": "1",
            "rcName": "일반",
            "rcDist": "1200",
            "rank": "국6등급",
            "rcStartTime": "10:30",
            "rcPrize": "80000000"
          }
        ]
      }
    }
  }
}
```

> `body.items`가 배열 형태로 직접 반환되는 API 버전도 있으므로, `Array.isArray(body.items)`와 `body.items.item` 모두 처리해야 합니다.

---

## 6. 서버 연동 (Golden Race)

### 사용처

- `server/src/kra/kra.service.ts` — `fetchRacePlanSchedule(date)` (일자별), `fetchRacePlanScheduleByYearMonth(year, month)` (연·월별), `fetchRacePlanScheduleForYear(year)` (연도 전체, 월별 12회 호출)
- `syncUpcomingSchedules()` — 오늘~1년 내 금·토·일 전체 Race 적재
- `syncScheduleForDate(date)` — Admin 지정 날짜 적재
- **Admin** `POST /api/admin/kra/sync/schedule?year=2026` — 해당 연도(1~12월) 경주계획표만 적재 (시행일 달력용)
- Cron `syncFutureRacePlans` — 매주 월 03:00
- Cron `syncWeeklySchedule` — 수·목 18:00 (주말 선적재)

### 적재 순서

1. **API72_2** 경주계획표 → Race 레코드 생성/갱신 (미래 일정 포함)
2. **API26_2** 출전표 → 출전마(RaceEntry) 추가 (경주 2~3일 전부터)

---

## 7. 관련 문서

- [`KRA_ENTRY_SHEET_SPEC.md`](./KRA_ENTRY_SHEET_SPEC.md) — 출전표 API (API26_2)
- [`DATA_LOADING.md`](../DATA_LOADING.md) — KRA 데이터 적재 가이드
