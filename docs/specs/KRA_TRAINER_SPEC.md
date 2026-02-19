# 🐎 한국마사회 조교사 상세정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 조교사 상세정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장에 소속된 조교사에 대한 상세 정보(생년월일, 데뷔일자, 통산 출주/1·2·3위/승률/복승률/연승률, 최근1년 동일 지표)를 조회하는 서비스입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **인터페이스 방식**: 일 1회 갱신 예상

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API19_1`
- **Endpoint**: `/trainerInfo_1`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **트래픽**: 개발계정 10,000건/일

---

## 3. 요청 메시지 명세 (Request)

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                        |
| :------------- | :---------------- | :-------: | :----- | :---------- | :-------------------------- |
| **ServiceKey** | 서비스키          | 필수      | String | -           | 공공데이터포털 인증키       |
| **meet**       | 시행경마장구분    | 옵션      | String | 1           | 1:서울, 2:제주, 3:부산경남  |
| **tr_name**    | 조교사명         | 옵션      | String | -           | 특정 조교사 검색            |
| **tr_no**      | 조교사번호       | 옵션      | String | -           | 특정 조교사 검색            |
| **numOfRows**  | 한 페이지 결과 수 | 옵션      | Number | 20          | 한 페이지 출력 결과 수      |
| **pageNo**     | 페이지 번호       | 옵션      | Number | 1           | 조회할 페이지               |
| **_type**      | 응답 형식         | 옵션      | String | json        | json 또는 xml               |

---

## 4. 응답 메시지 명세 (Response)

| 항목명 (Key)    | 항목명 (국문)   | 설명                          |
| :-------------- | :-------------- | :---------------------------- |
| **meet**        | 시행경마장      | 1:서울, 2:제주, 3:부산경남    |
| **trNo**        | 조교사번호     | 조교사 고유 식별 번호         |
| **trName**      | 조교사명       | 조교사 이름                   |
| **rcCntT**      | 통산총출전횟수 | 총 경주 출전 횟수             |
| **ord1CntT**    | 통산1착횟수    | 통산 1등 횟수                 |
| **ord2CntT**    | 통산2착횟수    | 통산 2등 횟수                 |
| **ord3CntT**    | 통산3착횟수    | 통산 3등 횟수                 |
| **winRateTsum** | 통산승률       | 1등 확률 (%)                  |
| **quRateTsum**  | 통산복승률     | 2등 안 진입 확률 (%)          |
| **plRateTsum**  | 통산연승률     | 1·2위 둘 다 확률 (%)          |
| **rcCntY**      | 최근1년 출주   | 최근 1년 출주 횟수             |
| **ord1CntY**    | 최근1년 1착    | 최근 1년 1등 횟수              |
| **ord2CntY**    | 최근1년 2착    | 최근 1년 2등 횟수              |
| **ord3CntY**    | 최근1년 3착    | 최근 1년 3등 횟수              |
| **winRateY**    | 최근1년 승률   | 최근 1년 승률 (%)              |
| **quRateY**     | 최근1년 복승률 | 최근 1년 복승률 (%)            |
| **plRateY**     | 최근1년 연승률 | 최근 1년 연승률 (%)            |

---

## 5. 실제 API 호출 샘플

`server/scripts/fetch-kra-sample.mjs`에서 `trainerInfo` 엔드포인트 호출 후  
`kra-sample-responses/trainerInfo-{rcDate}.json`에 저장됩니다.

**실행**: `KRA_SERVICE_KEY=xxx node scripts/fetch-kra-sample.mjs [YYYYMMDD]`

### response.body.items.item 구조

- `item`이 단일 객체일 경우 `body.items.item`는 배열이 아님. KraService에서 `Array.isArray(raw) ? raw : [raw]`로 정규화.

---

## 6. DB 매핑 (TrainerResult)

| API 필드       | DB 필드     | 타입   |
| :------------- | :---------- | :----- |
| meet           | meet        | String |
| trNo           | trNo        | String |
| trName         | trName      | String |
| rcCntT         | rcCntT      | Int    |
| ord1CntT       | ord1CntT    | Int    |
| ord2CntT       | ord2CntT    | Int    |
| ord3CntT       | ord3CntT    | Int    |
| winRateTsum    | winRateTsum | Float  |
| quRateTsum     | quRateTsum  | Float  |
| plRateTsum     | plRateTsum  | Float? |
| rcCntY~plRateY | rcCntY 등   | Int?/Float? |

- **unique**: `[meet, trNo]`
- **동기화**: `syncAnalysisData`에서 출전취소 후·레이팅 전에 `fetchTrainerInfo()` 호출

---

## 7. NestJS 연동 가이드

- `KraService.fetchTrainerInfo(meet?: string)`: meet별 페이지네이션 조회 후 `TrainerResult` upsert
- `buildEntrySummary`: 출전마에 `trainerWinRate`, `trainerQuRate` 포함 (TrainerResult 조회)
- `enrichEntriesWithTrainerResults`: 예측 생성 시 trNo 기준으로 조교사 통계 보강
