# 🐎 한국마사회 말훈련내역 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 말훈련내역
- **서비스 설명**: 한국마사회의 말 훈련조교내용 및 훈련시간, 훈련종료 시간, 관리사 종류(조교사, 기수, 조교보,
  기수후보생, 관리원 등), 훈련종류 등을 제공하는 서비스입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/trcontihi`
- **Endpoint**: `/gettrcontihi`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)    | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터   | 설명                           |
| :-------------- | :---------------- | :-------: | :----- | :------------ | :----------------------------- |
| **serviceKey**  | 서비스키          | 필수 (1)  | String | -             | 공공데이터포털에서 받은 인증키 |
| **pageNo**      | 페이지 번호       | 필수 (1)  | Number | 1             | 조회할 페이지 번호             |
| **numOfRows**   | 한 페이지 결과 수 | 필수 (1)  | Number | 10            | 한 페이지에 출력할 결과 수     |
| **hrname**      | 마명              | 옵션 (0)  | String | 베니즈리틀딥  | 조회할 말의 이름              |
| **hrno**        | 마번              | 옵션 (0)  | String | 0015447       | 조회할 말의 고유 번호         |
| **tr_date_fr**  | 훈련일자 시작일   | 옵션 (0)  | String | 20040225      | YYYYMMDD 형식                  |
| **tr_date_to**  | 훈련일자 종료일   | 옵션 (0)  | String | 20040225      | YYYYMMDD 형식                  |
| **_type**       | 데이터 형식       | 옵션 (0)  | String | json          | json 또는 xml (JSON 사용 권장) |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.  
_(실제 필드명은 공공데이터포털 미리보기 또는 Swagger UI로 확인 후 보정 필요)_

### A. 경주마 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **hrName**   | 마명           | 경주마의 이름                 |
| **hrNo**     | 마번           | 경주마의 고유 등록 번호       |

### B. 훈련 일시 정보

| 항목명 (Key)     | 항목명 (국문)   | 설명                              |
| :--------------- | :-------------- | :-------------------------------- |
| **trDate**       | 훈련일자        | 훈련 수행 일자 (YYYYMMDD)         |
| **trTime**       | 훈련시간        | 훈련 시작 시간                    |
| **trEndTime**    | 훈련종료시간    | 훈련 종료 시간                    |
| **trDuration**   | 훈련소요시간    | 훈련에 소요된 시간 (초/분)        |

### C. 훈련 내용 및 관리사

| 항목명 (Key)   | 항목명 (국문)   | 설명                                                  |
| :------------- | :-------------- | :---------------------------------------------------- |
| **trContent**  | 훈련조교내용    | 훈련 내용 (조교상세)                                  |
| **trType**     | 훈련종류        | 훈련 유형 (예: 수영, 조교, 발마 등)                   |
| **managerType**| 관리사 종류     | 조교사, 기수, 조교보, 기수후보생, 관리원 등           |
| **managerName**| 관리사명        | 훈련을 지도한 관리사 이름                             |

### D. 기타

| 항목명 (Key)     | 항목명 (국문) | 설명                     |
| :--------------- | :------------ | :----------------------- |
| **place**        | 훈련장소      | 훈련 장소 (예: 서울)     |
| **weather**      | 날씨          | 훈련 당시 날씨           |
| **trackCondition** | 주로상태   | 주로 상태 (건조/포화 등) |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/trcontihi/gettrcontihi?serviceKey=[인증키]&pageNo=1&numOfRows=10&hrno=0015447&tr_date_fr=20231001&tr_date_to=20231015&_type=json
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
            "hrName": "베니즈리틀딥",
            "hrNo": "0015447",
            "trDate": "20231014",
            "trTime": "06:30",
            "trEndTime": "07:15",
            "trContent": "조교",
            "trType": "발마",
            "managerType": "조교사",
            "managerName": "홍길동"
          }
        ]
      }
    }
  }
}
```

---

## 6. 개발 시 주의사항 (Developer Notes)

1. **대상 말 필터링 (KRA_API_ANALYSIS_SPEC 권장)**  
   훈련 데이터는 양이 많습니다. **이번 주 출전하는 말**의 마번(hrno)을 리스트업한 뒤, 해당 말들의  
   **최근 2주 치** 훈련 데이터만 조회하는 로직이 필요합니다.

2. **날짜 범위 필수**  
   `tr_date_fr`, `tr_date_to`를 적절히 설정하여 불필요한 트래픽을 줄이세요.

3. **경기일 기준 분석**  
   경기일 기준 **최근 7일간**의 총 훈련 시간을 합산하여 `training_score`로 치환하는 분석 로직을  
   적용할 수 있습니다.

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 말훈련내역 가져오기
 * Endpoint: /trcontihi/gettrcontihi
 * 활용: AI 분석용 — 최근 일주일간 강도 높은 훈련 소화 여부. 훈련량 급증 시 승부 타이밍.
 */
async getHorseTrainingHistory(params: {
  hrno?: string;
  hrname?: string;
  tr_date_fr?: string;
  tr_date_to?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/trcontihi/gettrcontihi`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: this.serviceKey,
        hrno: params.hrno,
        hrname: params.hrname,
        tr_date_fr: params.tr_date_fr,
        tr_date_to: params.tr_date_to,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 (Training 모델)

| API 필드   | Prisma 필드   |
| ---------- | ------------- |
| trDate     | date          |
| place      | place         |
| weather    | weather       |
| trackCondition | trackCondition |
| trDuration / trTime | time |
| trType / trContent | intensity (또는 JSON) |

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
| **훈련일자/시간** | 경기일 기준 최근 7일간 총 훈련량 → `training_score` 계산               |
| **훈련강도/종류** | 강도 높은 훈련 소화 여부 → 승부 타이밍 판단                            |
| **훈련량 급증**   | 훈련량이 급증하면 → 승부 의지/컨디션 피크 기대                         |
