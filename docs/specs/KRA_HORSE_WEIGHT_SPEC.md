# 🐎 한국마사회 출전마 체중 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 출전마 체중 정보
- **서비스 설명**: 한국마사회에서 제공하는 출전마 체중 정보를 조회하는 서비스입니다. 마명, 마체중, 증감정보,
  최종출전일 등을 제공합니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/API25_1`
- **Endpoint**: `/entryHorseWeightInfo_1`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키 |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 조회할 페이지 번호             |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | Number | 10          | 한 페이지에 출력할 결과 수     |
| **meet**       | 경마장번호        | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부산경남 (생략 시 1:서울 기본값) |
| **hr_name**    | 마명              | 옵션 (0)  | String | 인생의감동  | 조회할 말의 이름              |
| **hr_no**      | 마번(고유번호)    | 옵션 (0)  | String | 0046350     | 조회할 말의 고유 번호         |
| **rc_date**    | 경주일            | 옵션 (0)  | String | 20220903    | YYYYMMDD 형식                  |
| **rc_month**   | 경주월            | 옵션 (0)  | String | 202209      | YYYYMM 형식                    |
| **_type**      | 데이터 형식       | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장) |

**주의:** 경주월, 경주일 등 날짜 변수를 모두 누락한 경우, 경주일자 기준 **최근 한 달간**의 정보가 표출됩니다.

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.  
_(실제 필드명은 공공데이터포털 미리보기 또는 Swagger UI로 확인 후 보정 필요)_

### A. 경주 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 경마장명       | 시행 경마장 이름 (서울/제주/부경) |
| **rcDate**   | 경주일자       | 경주 날짜 (YYYYMMDD)          |
| **rcNo**     | 경주번호       | 경주 번호                     |

### B. 경주마 및 체중 정보 (AI 분석용 핵심)

| 항목명 (Key) | 항목명 (국문)  | 설명                              |
| :----------- | :------------- | :-------------------------------- |
| **hrName**   | 마명           | 경주마의 이름                     |
| **hrNo**     | 마번           | 경주마의 고유 등록 번호           |
| **chulNo**   | 출전번호       | 출전 번호 (등번호)               |
| **wgHr**     | 마체중         | 당일 경주 시 체중 (kg)            |
| **wgDiff**   | 증감정보       | 전번 대비 체중 증감 (kg, 예: -2 또는 +3) |
| **lastRcDate** | 최종출전일    | 최근 출전 일자 (YYYYMMDD)         |

### C. 체중 형식 예시

- **wgHr**: `502` 또는 `502(-2)` 형식 — 체중 + 괄호 안 증감
- **wgDiff**: `-2`, `+3`, `0` — 전번 대비 증감값

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API25_1/entryHorseWeightInfo_1?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date=20220903&rc_month=202209&_type=json
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
            "rcDate": "20220903",
            "rcNo": "1",
            "hrName": "인생의감동",
            "hrNo": "0046350",
            "chulNo": "7",
            "wgHr": "502(-2)",
            "wgDiff": "-2",
            "lastRcDate": "20220828"
          }
        ]
      }
    }
  }
}
```

---

## 6. 개발 시 주의사항 (Developer Notes)

1. **날짜 변수 누락 시**  
   경주월, 경주일을 모두 누락하면 **최근 한 달** 데이터가 반환됩니다. 특정 경주만 조회하려면  
   `rc_date`, `rc_month`를 명시하세요.

2. **체중 증감 해석**  
   - `-15kg` 이상 급감 → 컨디션 난조로 판단, AI 분석 시 감점 요인  
   - 적정 범위 내 증감 → 정상 컨디션

3. **출전표 연동**  
   출전표(출전마 목록) 조회 후, 해당 마번(`hr_no`)별로 체중 정보를 가져와  
   `RaceEntry` 또는 별도 컬럼에 매핑하는 흐름을 권장합니다.

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 출전마 체중 정보 가져오기
 * Endpoint: /API25_1/entryHorseWeightInfo_1
 * 활용: AI 분석용 컨디션 — "체중이 -15kg 급격히 빠졌다" → 컨디션 난조로 감점 요인 적용.
 */
async getEntryHorseWeightInfo(params: {
  meet?: string;
  rc_date?: string;
  rc_month?: string;
  hr_name?: string;
  hr_no?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API25_1/entryHorseWeightInfo_1`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: this.serviceKey,
        meet: params.meet || '1',
        rc_date: params.rc_date,
        rc_month: params.rc_month,
        hr_name: params.hr_name,
        hr_no: params.hr_no,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑

| API 필드   | DB/엔티티 필드 |
| ---------- | ------------- |
| wgHr       | RaceResult.wgHr (e.g. `502(-2)`) |
| wgDiff     | 별도 weightDiff 파싱 또는 JSON   |
| hrNo       | RaceEntry.hrNo                 |

---

## 8. 에러 코드 (Error Codes)

| 코드   | 메시지                                | 설명                               |
| ------ | ------------------------------------- | ---------------------------------- |
| **1**  | APPLICATION_ERROR                     | 어플리케이션 에러                  |
| **10** | INVALID_REQUEST_PARAMETER_ERROR       | 잘못된 요청 파라메터 에러          |
| **12** | NO_OPENAPI_SERVICE_ERROR               | 해당 오픈API서비스가 없거나 폐기됨 |
| **20** | SERVICE_ACCESS_DENIED_ERROR           | 서비스 접근거부                    |
| **22** | LIMITED_NUMBER_OF_SERVICE_REQUESTS... | 서비스 요청제한횟수 초과에러       |
| **30** | SERVICE_KEY_IS_NOT_REGISTERED_ERROR   | 등록되지 않은 서비스키             |
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |

---

## 9. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드       | AI 분석 활용 예시                                                      |
| ----------------- | ---------------------------------------------------------------------- |
| **마체중**        | 당일 경주 시 체중 (kg)                                                 |
| **체중 증감**     | 전번 대비 -15kg 이상 급감 → 컨디션 난조로 판단, 감점 요인 적용         |
| **적정 범위**     | 적정 범위 내 증감 → 정상 컨디션, 유지 또는 소폭 가산                   |
