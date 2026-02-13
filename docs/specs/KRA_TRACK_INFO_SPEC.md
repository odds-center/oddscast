# 🐎 한국마사회 경주로정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주로정보
- **서비스 설명**: 한국마사회에서 제공하는 경주로정보를 조회하는 서비스입니다. 상대습도, 경마장명, 경주일자,
  경주번호, 염도, 기온, 주로상태, 함수율, 날씨, 풍향 등을 제공합니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/API189_1`
- **Endpoint**: `/Track_1`
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
| **meet**       | 경마장번호        | 옵션 (0)  | Number | 3           | 1:서울, 2:제주, 3:부경         |
| **rc_date_fr** | 경주일자_FROM     | 옵션 (0)  | String | 20150101    | YYYYMMDD 형식                  |
| **rc_date_to** | 경주일자_TO       | 옵션 (0)  | String | 20201231    | YYYYMMDD 형식                  |
| **_type**      | 데이터 형식       | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장) |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.  
_(실제 필드명은 공공데이터포털 미리보기 또는 Swagger UI로 확인 후 보정 필요)_

### A. 경주 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 경마장명       | 시행 경마장 이름 (서울/제주/부경) |
| **rcDate**   | 경주일자       | 경주 날짜 (YYYYMMDD)          |
| **rcNo**     | 경주번호       | 해당 일자의 경주 번호         |

### B. 경주로 환경 (AI 분석용 핵심)

| 항목명 (Key)     | 항목명 (국문) | 설명                              |
| :--------------- | :------------ | :-------------------------------- |
| **track**        | 주로상태      | 주로 상태 (건조/포화 등)          |
| **moisture**     | 함수율        | 함수율 (%) — 습기/비 영향 지표   |
| **weather**      | 날씨          | 당시 날씨 (맑음/흐림/비 등)      |

### C. 기상 정보

| 항목명 (Key) | 항목명 (국문) | 설명                     |
| :----------- | :------------ | :----------------------- |
| **humidity** | 상대습도      | 상대습도 (%)             |
| **temp**     | 기온          | 기온 (°C)                |
| **windDir**  | 풍향          | 풍향 정보                |
| **windSpeed**| 풍속          | 풍속 (m/s 등)            |

### D. 기타

| 항목명 (Key) | 항목명 (국문) | 설명                     |
| :----------- | :------------ | :----------------------- |
| **salinity** | 염도          | 토양 염도 등             |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API189_1/Track_1?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date_fr=20231001&rc_date_to=20231015&_type=json
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
            "rcDate": "20231014",
            "rcNo": "1",
            "track": "건조 (2%)",
            "moisture": "2",
            "weather": "맑음",
            "humidity": "65",
            "temp": "22",
            "windDir": "북동"
          }
        ]
      }
    }
  }
}
```

---

## 6. 개발 시 주의사항 (Developer Notes)

1. **경기일 기준 조회**  
   경기 당일 또는 경기 전날 `rc_date_fr` / `rc_date_to`를 적절히 설정하여 당일 경주로 정보를 조회하세요.

2. **환경 변수 활용**  
   함수율(`moisture`)과 주로상태(`track`)는 AI 분석에서 **선행마/추입마** 판단에 핵심 변수입니다.  
   비가 와서 함수율이 높으면 주로가 빠르게 변해 선행마에 유리할 수 있습니다.

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 경주로정보 가져오기
 * Endpoint: /API189_1/Track_1
 * 활용: AI 분석용 환경 변수 — "오늘은 비가 와서(함수율 15%) 주로가 빠르다" → 선행마 가산점 부여.
 */
async getTrackInfo(params: {
  meet?: string;
  rc_date_fr?: string;
  rc_date_to?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API189_1/Track_1`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: this.serviceKey,
        meet: params.meet || '1',
        rc_date_fr: params.rc_date_fr,
        rc_date_to: params.rc_date_to,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 (Race 모델)

| API 필드   | Prisma 필드   |
| ---------- | ------------- |
| meet       | meet, meetName |
| rcDate     | rcDate        |
| rcNo       | rcNo          |
| weather    | weather       |
| track / moisture | trackState (또는 JSON `track_moisture`) |

---

## 8. 에러 코드 (Error Codes)

| 코드   | 메시지                                | 설명                               |
| ------ | ------------------------------------- | ---------------------------------- |
| **1**  | APPLICATION_ERROR                     | 어플리케이션 에러                  |
| **10** | INVALID_REQUEST_PARAMETER_ERROR       | 잘못된 요청 파라메터 에러          |
| **12** | NO_OPENAPI_SERVICE_ERROR              | 해당 오픈API서비스가 없거나 폐기됨 |
| **20** | SERVICE_ACCESS_DENIED_ERROR           | 서비스 접근거부                    |
| **22** | LIMITED_NUMBER_OF_SERVICE_REQUESTS... | 서비스 요청제한횟수 초과에러       |
| **30** | SERVICE_KEY_IS_NOT_REGISTERED_ERROR   | 등록되지 않은 서비스키             |
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |

---

## 9. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드       | AI 분석 활용 예시                                                      |
| ----------------- | ---------------------------------------------------------------------- |
| **함수율(%)**     | 비가 와서 함수율이 높으면 주로가 빠르게 변함 → 선행마 가산점 부여       |
| **주로상태**      | 건조/포화/중량 등으로 경주 스타일 예측                                 |
| **날씨**          | 날씨에 따른 컨디션·기록 변동 예측                                       |
