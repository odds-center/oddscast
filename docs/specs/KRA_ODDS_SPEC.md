# 🐎 한국마사회 확정배당율 통합 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 확정배당율 통합 정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장에서 시행된 경주의 단승식, 복승식, 연승식, 쌍승식, 삼복승, 삼쌍승식 등
  승식별 확정 배당률 정보를 조회하는 서비스입니다. **실시간 승부 예측 시 대중의 베팅 흐름(Smart Money)**을 파악하는 핵심 지표입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **데이터 갱신 주기**: 수시 (경기 종료 직후 업데이트)

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API160`
- **Endpoint**: `/integratedInfo`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                                |
| :------------- | :---------------- | :-------: | :----- | :---------- | :---------------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키      |
| **numOfRows**  | 페이지 당 건수    | 필수 (1)  | Number | 10          | 페이지 당 표출될 건수               |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 요청할 페이지 번호                  |
| **pool**       | 승식구분          | 옵션 (0)  | String | WIN         | 승식 코드 (하단 가이드 참조)        |
| **rc_date**    | 경주일            | 옵션 (0)  | Number | 20190504    | YYYYMMDD 형식                       |
| **rc_month**   | 경주월            | 옵션 (0)  | Number | 201905      | YYYYMM 형식                         |
| **rc_no**      | 경주번호          | 옵션 (0)  | Number | 1           | 경주 번호                           |
| **meet**       | 시행경마장구분    | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부경 (생략 시 전체) |
| **_type**      | 응답 형식         | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장)      |

### 💡 승식 코드 (Pool Code) 가이드

| 코드   | 승식         | 설명                                      |
| :----- | :----------- | :---------------------------------------- |
| **WIN**  | 단승식       | 1등 적중                                  |
| **PLC**  | 연승식       | 3등 내 적중                               |
| **QNL**  | 복승식       | 1, 2등 순서 상관없이 적중                 |
| **EXA**  | 쌍승식       | 1, 2등 순서대로 적중                      |
| **QPL**  | 복연승식     | 3등 내 2두 적중                           |
| **TLA**  | 삼복승식     | 1, 2, 3등 순서 상관없이 적중              |
| **TRI**  | 삼쌍승식     | 1, 2, 3등 순서대로 적중                   |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

| 항목명 (Key)  | 항목명 (국문)      | 설명                                      |
| :------------ | :----------------- | :---------------------------------------- |
| **meet**      | 시행경마장명       | 시행 경마장 이름 (예: 서울)               |
| **rcDate**    | 경주일자           | 경주 날짜 (YYYYMMDD)                       |
| **rcNo**      | 경주번호           | 경주 번호                                 |
| **pool**      | 승식               | 배당률의 종류 (예: 단승식, 연승식)        |
| **chulNo**    | 1착마출주번호      | 1등 말 출전번호 (단승식의 경우 이 번호만 유효) |
| **chulNo2**   | 2착마출주번호      | 2등 말 출전번호 (복승·쌍승식 등에서 사용) |
| **chulNo3**   | 3착마출주번호      | 3등 말 출전번호 (삼복승·삼쌍승식 등에서 사용) |
| **odds**      | 확정배당율         | 최종 배당률 (예: 2.0 = 2배)               |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API160/integratedInfo?ServiceKey=[인증키]&numOfRows=10&pageNo=1&pool=WIN&meet=1&rc_date=20190601&_type=json
```

**Response (JSON 예시)**

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
            "rcDate": "20190601",
            "rcNo": "1",
            "pool": "단승식",
            "chulNo": "7",
            "chulNo2": "0",
            "chulNo3": "0",
            "odds": "2.0"
          }
        ]
      }
    }
  }
}
```

**Response (XML 예시)**

```xml
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL SERVICE.</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <meet>서울</meet>
        <rcDate>20190601</rcDate>
        <rcNo>1</rcNo>
        <pool>단승식</pool>
        <chulNo>7</chulNo>
        <chulNo2>0</chulNo2>
        <chulNo3>0</chulNo3>
        <odds>2.0</odds>
      </item>
    </items>
  </body>
</response>
```

---

## 6. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 확정배당율 통합 정보 가져오기
 * Endpoint: /API160/integratedInfo
 * 활용: 실시간 배당 표시, Smart Money 분석 — 대중 베팅 흐름 파악
 */
async getConfirmedOdds(params: {
  meet?: string;      // 1:서울, 2:제주, 3:부경
  rc_date?: string;   // YYYYMMDD
  rc_month?: string;  // YYYYMM
  rc_no?: number;     // 경주번호
  pool?: string;      // WIN, PLC, QNL, EXA, QPL, TLA, TRI
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API160/integratedInfo`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: decodeURIComponent(this.serviceKey),
        meet: params.meet || '1',
        rc_date: params.rc_date,
        rc_month: params.rc_month,
        rc_no: params.rc_no,
        pool: params.pool || 'WIN',
        numOfRows: params.numOfRows || 100,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 제안

- **RaceResult** 또는 별도 **Odds** 테이블: `chulNo`, `chulNo2`, `chulNo3`, `odds`, `pool` 저장
- 경기 당일 30분 전~경기 종료 후까지 **1분 단위 갱신** 권장 (KRA_API_ANALYSIS_SPEC Group C)

---

## 7. 에러 코드 (Error Codes)

| 코드   | 메시지                                | 설명                               |
| ------ | ------------------------------------- | ---------------------------------- |
| **1**  | APPLICATION_ERROR                     | 어플리케이션 에러                  |
| **10** | INVALID_REQUEST_PARAMETER_ERROR       | 잘못된 요청 파라메터 에러          |
| **12** | NO_OPENAPI_SERVICE_ERROR              | 해당 오픈API서비스가 없거나 폐기됨 |
| **20** | SERVICE_ACCESS_DENIED_ERROR           | 서비스 접근거부                    |
| **22** | LIMITED_NUMBER_OF_SERVICE_REQUESTS... | 서비스 요청제한횟수 초과에러       |
| **30** | SERVICE_KEY_IS_NOT_REGISTERED_ERROR   | 등록되지 않은 서비스키             |
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **99** | UNKNOWN_ERROR                         | 기타에러                            |

---

## 8. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드  | AI 분석 활용 예시                                                |
| ------------ | ---------------------------------------------------------------- |
| **단승식 배당** | 1착마 예상 vs 실제 배당 비교 → "저평가/고평가" 말 포착          |
| **복승식 배당** | 2착 이내 조합별 배당 → 대중 선호도와 AI 예측 괴리 분석         |
| **Smart Money** | 배당 급락 = 대중 집중 → 역발상 또는 동행 전략 참고 지표       |
| **쌍승식 배당** | 1-2착 순서 예측 검증, 고배당 조합 리스크 평가                 |

### 실시간 배당 갱신 전략

- 경기 30분 전부터 **1분 단위** API 호출
- `확정배당율 통합 정보`와 `확정배당율종합` API 교차 검증 권장
- 배당 변동 임계치(예: ±10%) 도달 시 AI 예측 재검토 트리거로 활용
