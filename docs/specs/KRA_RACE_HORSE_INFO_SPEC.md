# 🐎 한국마사회 경주마 상세정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주마 상세정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장의 **현역 경주마** 정보를 제공합니다. 시행경마장명, 마명, 마번, 출생지,
  성별, 생년월일, 등급, 조교사명, 마주명, 부마·모마 정보, 통산·최근1년 출주·착순 기록, 통산착순상금, 레이팅,
  최근거래가 등을 조회할 수 있어 **나이(성장세/노쇠화)** 및 **혈통 분석**의 기초 자료로 활용됩니다.
- **데이터 교환 표준**: JSON, XML
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건
- **참고**: `meet`(경마장구분)을 생략하면 **1(서울)**이 기본값으로 적용됩니다.

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API8_2`
- **Endpoint**: `/raceHorseInfo_2`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                                        |
| :------------- | :---------------- | :-------: | :----- | :---------- | :------------------------------------------ |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키              |
| **pageNo**     | 페이지 번호       | 필수 (1)  | String | 1           | 조회할 페이지 번호                          |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | String | 10          | 한 페이지에 출력할 결과 수                  |
| **hr_name**    | 마명              | 옵션 (0)  | String | -           | 경주마 이름 (검색 조건)                     |
| **hr_no**      | 마번              | 옵션 (0)  | String | -           | 경주마 고유 번호 (검색 조건)                |
| **meet**       | 시행경마장구분    | 옵션 (0)  | String | 1           | 1:서울, 2:제주, 3:부산 (생략 시 1:서울)     |
| **act_gubun**  | 현역경주마여부    | 옵션 (0)  | String | y           | `y`: 현역만, `y` 외: 은퇴마·현역마 모두    |
| **_type**      | 데이터 형식       | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장)              |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

### A. 기본 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 시행경마장명   | 소속 경마장 (예: 서울)       |
| **hrNo**     | 마번           | 경주마 고유 등록 번호        |
| **hrName**   | 마명           | 경주마 이름                  |
| **name**     | 마명(대체)     | 마명 (일부 API에서 동일)     |
| **sex**      | 성별           | 수/암/거                      |
| **birthday** | 생년월일       | 출생일 (YYYYMMDD)             |
| **rank**     | 등급           | 경주마 등급                   |

### B. 조교사·마주·혈통

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **trName**   | 조교사명       | 조교사 이름                   |
| **trNo**     | 조교사번호     | 조교사 고유 번호              |
| **owName**   | 마주명         | 마주 이름                     |
| **owNo**     | 마주번호       | 마주 고유 번호                |
| **faHrName** | 부마명         | 부마(아버지 말) 이름          |
| **faHrNo**   | 부마번         | 부마 고유 번호                |
| **moHrName** | 모마명         | 모마(어머니 말) 이름          |
| **moHrNo**   | 모마번         | 모마 고유 번호                |

### C. 통산·최근 성적 (AI 분석용)

| 항목명 (Key) | 항목명 (국문)       | 설명                          |
| :----------- | :------------------ | :---------------------------- |
| **rcCntT**   | 통산총출주회수      | 통산 총 출전 횟수            |
| **ord1CntT** | 통산1착회수         | 통산 1위 횟수                |
| **ord2CntT** | 통산2착회수         | 통산 2위 횟수                |
| **ord3CntT** | 통산3착회수         | 통산 3위 횟수                |
| **rcCntY**   | 최근1년총출주회수   | 최근 1년 총 출전 횟수        |
| **ord1CntY** | 최근1년1착회수      | 최근 1년 1위 횟수            |
| **ord2CntY** | 최근1년2착회수      | 최근 1년 2위 횟수            |
| **ord3CntY** | 최근1년3착회수      | 최근 1년 3위 횟수            |
| **chaksunT** | 통산착순상금        | 통산 착순 상금 (원)          |
| **rating**   | 레이팅              | 마사회 산정 레이팅 점수      |
| **hrLastAmt**| 최근거래가          | 최근 거래 금액 (원)          |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API8_2/raceHorseInfo_2?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&hr_no=018128&_type=json
```

**Response (JSON 예시)**

```json
{
  "header": {
    "resultCode": "00",
    "resultMsg": "NORMAL SERVICE."
  },
  "body": {
    "numOfRows": "10",
    "pageNo": "1",
    "totalCount": "1",
    "items": {
      "item": {
        "meet": "부산경남",
        "hrName": "군함",
        "hrNo": "018128",
        "name": "군함",
        "sex": "수",
        "birthday": "20160417",
        "rank": "A",
        "trName": "김형문",
        "trNo": "01234",
        "owName": "김마주",
        "owNo": "05678",
        "faHrName": "부마명",
        "faHrNo": "012345",
        "moHrName": "모마명",
        "moHrNo": "067890",
        "rcCntT": "45",
        "ord1CntT": "5",
        "ord2CntT": "8",
        "ord3CntT": "6",
        "rcCntY": "18",
        "ord1CntY": "2",
        "ord2CntY": "3",
        "ord3CntY": "2",
        "chaksunT": "285000000",
        "rating": "83",
        "hrLastAmt": "120000000"
      }
    }
  }
}
```

---

## 6. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 경주마 상세정보 가져오기
 * Endpoint: /API8_2/raceHorseInfo_2
 * 활용: AI 분석용 기본 스펙 — 나이(성장세/노쇠화), 혈통, 통산·최근 성적 분석
 */
async getRaceHorseInfo(params: {
  meet?: string;      // 1:서울, 2:제주, 3:부산
  hr_no?: string;     // 마번 (검색)
  hr_name?: string;   // 마명 (검색)
  act_gubun?: string; // y: 현역만 (기본)
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API8_2/raceHorseInfo_2`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: decodeURIComponent(this.serviceKey),
        meet: params.meet || '1',
        hr_no: params.hr_no,
        hr_name: params.hr_name,
        act_gubun: params.act_gubun || 'y',
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 제안

- **RaceEntry** 보강: `sex`, `age`, `origin`(출생지), `totalRuns`(rcCntT), `totalWins`(ord1CntT) 등 이미 존재
- **별도 HorseDetail 테이블**: 혈통(faHrNo, moHrNo), 최근1년(rcCntY, ord1CntY 등), 레이팅, 최근거래가 등 저장
- 출전표 동기화 시 마번(hrNo)으로 이 API를 호출해 레이팅·통산 성적 보강

---

## 7. 에러 코드 (Error Codes)

| 코드   | 메시지                                | 설명                               |
| ------ | ------------------------------------- | ---------------------------------- |
| **1**  | APPLICATION_ERROR                     | 어플리케이션 에러                  |
| **10** | INVALID_REQUEST_PARAMETER_ERROR       | 잘못된 요청 파라메터 에러          |
| **12** | NO_OPENAPI_SERVICE_ERROR              | 해당 오픈API서비스가 없거나 폐기됨 |
| **20** | SERVICE_ACCESS_DENIED_ERROR           | 서비스 접근거부                    |
| **22** | LIMITED_NUMBER_OF_SERVICE_REQUESTS... | 서비스 요청제한횟수 초과에러       |
| **30** | SERVICE_KEY_IS_NOT_REGISTERED_ERROR  | 등록되지 않은 서비스키             |
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |

---

## 8. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드      | AI 분석 활용 예시                                                    |
| ---------------- | -------------------------------------------------------------------- |
| **birthday, sex**| 나이·성별 → 성장세/노쇠화 판단                                       |
| **rcCntT, ord1CntT** | 통산 출전·1착 → 경험치, 승률 기반 점수 산출                    |
| **rcCntY, ord1CntY~ord3CntY** | 최근 1년 성적 → 기세(Momentum) 지표              |
| **rating**       | 마사회 공식 능력치, [KRA_RATING_SPEC](KRA_RATING_SPEC.md)와 교차 검증 |
| **chaksunT, hrLastAmt** | 시장 평가(거래가)·실적(착순상금) → 저평가/고평가 탐지      |
| **faHrName, moHrName** | 혈통 분석 기초 자료 (장거리·선행 적성 등)                 |
