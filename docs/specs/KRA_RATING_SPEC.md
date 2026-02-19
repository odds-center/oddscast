# 🐎 한국마사회 경주마 레이팅 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주마 레이팅 정보 (RACE HORSE RATING STATUS)
- **서비스 설명**: 한국마사회에서 산정한 경주마의 레이팅 정보(경마장명, 마번, 마명, 최근 레이팅 내역 등)를 조회하는
  서비스입니다. 레이팅은 경주마의 능력을 수치화한 점수로, **핸디캡 경주**에서 부담 중량을 결정하거나 **말의 객관적 전력**을
  평가하는 핵심 지표이며, 승부 예측 시 **능력치 비교의 척도**로 활용됩니다.
- **데이터 교환 표준**: XML (문서상 JSON 미지원으로 표기됨. `_type=json` 적용 가능 시 사용)
- **인터페이스 방식**: REST (GET)
- **데이터 갱신 주기**: 수시

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API77`
- **Endpoint**: `/raceHorseRating`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.  
_(문서상 경마장·마번 등 별도 검색 조건 파라미터는 명시되어 있지 않습니다. 전체 리스트를 페이징하여 가져오는 방식일 수 있습니다.)_

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키 |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | Number | 10          | 한 페이지에 출력할 결과 수     |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 조회할 페이지 번호             |
| **_type**      | 응답 형식         | 옵션 (0)  | String | json        | json 또는 xml (지원 시 JSON 권장) |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

| 항목명 (Key) | 항목명 (국문)  | 설명                                        |
| :----------- | :------------- | :------------------------------------------ |
| **meet**     | 경마장         | 소속 경마장 (예: 서울, 부산경남, 제주)      |
| **hrNo**     | 마번           | 경주마 고유 번호 (예: 018128)               |
| **hrName**   | 마명           | 경주마 이름 (예: 군함)                      |
| **rating1** | 레이팅1        | 최근 레이팅 점수 (가장 최신)                |
| **rating2** | 레이팅2        | 이전 레이팅 점수 2                          |
| **rating3** | 레이팅3        | 이전 레이팅 점수 3                          |
| **rating4** | 레이팅4        | 이전 레이팅 점수 4                          |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API77/raceHorseRating?ServiceKey=[인증키]&numOfRows=10&pageNo=2&_type=json
```

**Response (XML 예시)**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="true"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL SERVICE.</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <meet>부산경남</meet>
        <hrNo>018128</hrNo>
        <hrName>군함</hrName>
        <rating1>83</rating1>
        <rating2>103</rating2>
        <rating3>82</rating3>
        <rating4>81</rating4>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>6601</totalCount>
  </body>
</response>
```

**Response (JSON 예시 — 지원 시)**

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
            "meet": "부산경남",
            "hrNo": "018128",
            "hrName": "군함",
            "rating1": "83",
            "rating2": "103",
            "rating3": "82",
            "rating4": "81"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 6601
    }
  }
}
```

---

## 6. 실제 응답 샘플 (API 호출 검증)

`server/scripts/fetch-kra-sample.mjs`에서 `raceHorseRating` 엔드포인트 호출 후  
`kra-sample-responses/raceHorseRating-{rcDate}.json`에 저장됩니다.

**실행**: `KRA_SERVICE_KEY=xxx node scripts/fetch-kra-sample.mjs [YYYYMMDD]`

### meet 값 형식

- **숫자 코드**: `"1"`(서울), `"2"`(제주), `"3"`(부산경남) — 공식 명세상 샘플이 숫자로 올 수 있음
- **한글**: `"서울"`, `"제주"`, `"부산경남"` — 둘 다 지원되며 KraService에서 통일 처리

### response.body.items.item 구조

| 필드     | 타입   | 예시값      | 설명                        |
| -------- | ------ | ----------- | --------------------------- |
| meet     | string | "1" 또는 "서울" | 경마장 코드 또는 한글명     |
| hrNo     | string | "018128"    | 경주마 고유 번호            |
| hrName   | string | "군함"      | 경주마 이름                 |
| rating1  | string | "83"        | 최신 레이팅 (최우선 사용)   |
| rating2  | string | "103"       | 이전 레이팅 2               |
| rating3  | string | "82"        | 이전 레이팅 3               |
| rating4  | string | "81"        | 이전 레이팅 4               |

- `item`이 단일 객체일 경우 `body.items.item`는 배열이 아님. KraService에서 `Array.isArray(raw) ? raw : [raw]`로 정규화.

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 경주마 레이팅 정보 가져오기
 * Endpoint: /API77/raceHorseRating
 * 활용: AI 분석용 능력치 — 레이팅 기반 말 전력 평가, 핸디캡 분석
 */
async getRaceHorseRating(params: {
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API77/raceHorseRating`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: decodeURIComponent(this.serviceKey),
        numOfRows: params.numOfRows || 100,
        pageNo: params.pageNo || 1,
        _type: 'json', // XML만 지원 시 제거
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 (RaceEntry.rating)

- **RaceEntry.rating**: 출전표 연동 시 해당 경주 기준 레이팅. 이 API의 `rating1`(최신)을 마번(hrNo)으로 매칭하여 보강 가능.
- 레이팅 이력(rating1~4)을 별도 캐시하면 **레이팅 추이(상승/하락)** 분석에 활용.

---

## 8. 에러 코드 (Error Codes)

| 코드   | 메시지                                | 설명                               |
| ------ | ------------------------------------- | ---------------------------------- |
| **1**  | APPLICATION_ERROR                     | 어플리케이션 에러                  |
| **10** | INVALID_REQUEST_PARAMETER_ERROR       | 잘못된 요청 파라메터 에러          |
| **12** | NO_OPENAPI_SERVICE_ERROR              | 해당 오픈API서비스가 없거나 폐기됨 |
| **20** | SERVICE_ACCESS_DENIED_ERROR           | 서비스 접근거부                    |
| **22** | LIMITED_NUMBER_OF_SERVICE_REQUESTS... | 서비스 요청제한횟수 초과에러       |
| **30** | SERVICE_KEY_IS_NOT_REGISTERED_ERROR  | 등록되지 않은 서비스키             |
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **32** | UNREGISTERED_IP_ERROR                 | 등록되지 않은 IP                   |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |

---

## 9. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드      | AI 분석 활용 예시                                                    |
| ---------------- | -------------------------------------------------------------------- |
| **rating1 (최신)** | 출전마 능력치 비교, Python `calculate_score`의 레이팅 기반 점수 산출 |
| **rating2~4**    | 레이팅 추이(상승/하락) 분석 → 기세(Momentum) 보조 지표               |
| **마사회 공식**  | 배당률과의 괴리 분석 → "저평가된 말" 포착 (KRA_API_ANALYSIS_SPEC Group B) |

### 레이팅 해석 가이드

- **상승 추이**: rating1 > rating2 → 최근 경기에서 기량 상승, 가산점 고려
- **하락 추이**: rating1 < rating2 → 컨디션 저하·부상 등 리스크 감점
- **고정 구간**: rating1 ≈ rating2 ≈ rating3 → 안정적 성적, 예측 신뢰도 상승
