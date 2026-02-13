# 🐎 한국마사회 출전마 장구사용 및 폐출혈 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 출전마 장구사용 및 폐출혈 정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장에서 시행경주의 경주마 출전장구 및 폐출혈 발생 현황(폐
  출혈횟수, 폐 출혈일자, 진료사항 등)을 조회하는 서비스입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/API24_1`
- **Endpoint**: `/horseMedicalAndEquipment_1`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **인증키**: Encoding/Decoding 키 중 포털에서 제공되는 **Decoding** 키 사용 권장 (`==`로 끝나는 키)

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                                |
| :------------- | :---------------- | :-------: | :----- | :---------- | :---------------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키      |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | Number | 10          | 한 페이지에 출력할 결과 수          |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 조회할 페이지 번호                  |
| **meet**       | 시행경마장        | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부산경남 (생략 시 1:서울 기본값) |
| **rc_date**    | 경주일            | 옵션 (0)  | Number | 20220903    | YYYYMMDD 형식                       |
| **rc_month**   | 경주월            | 옵션 (0)  | Number | 202209      | YYYYMM 형식                         |
| **_type**      | 응답 형식         | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장)     |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.  
_(실제 필드명은 공공데이터포털 미리보기 또는 Swagger UI로 확인 후 보정 필요)_

### A. 경주 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 시행경마장명   | 시행 경마장 이름 (예: 서울)   |
| **rcDate**   | 경주일자       | 경주가 열리는 날짜 (YYYYMMDD) |
| **rcDay**    | 경주요일       | 경주 요일 (예: 토요일)        |
| **rcNo**     | 경주번호       | 해당 일자의 경주 번호         |

### B. 경주마 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **chulNo**   | 마번(출주번호) | 출전하는 말의 번호            |
| **hrName**   | 마명           | 경주마의 이름                 |
| **hrNo**     | 마번(고유번호) | 경주마의 고유 등록 번호       |

### C. 장구 사용 정보 (AI 분석용)

| 항목명 (Key) | 항목명 (국문) | 설명                                   |
| :----------- | :------------ | :------------------------------------- |
| **hrTool**   | 장구내역      | 착용 장구 (예: 가면, 눈가리개, 혀끈, 망사눈) |
| **equipment**| 출전장구      | 경주 당일 착용 장구 상세 (가면/눈가리개/혀끈 등) |
| **equipChange** | 장구변경  | 이번 경주 대비 장구 변경 여부 (신규 착용 등) |

### D. 폐출혈 및 진료 정보 (AI 분석용)

| 항목명 (Key)   | 항목명 (국문) | 설명                            |
| :------------- | :------------ | :------------------------------ |
| **bleCnt**     | 폐출혈횟수    | 폐출혈 발생 횟수                |
| **bleDate**    | 폐출혈일자    | 최근 폐출혈 발생 일자 (YYYYMMDD) |
| **medicalInfo**| 진료사항      | 진료 내역 및 특이사항           |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API24_1/horseMedicalAndEquipment_1?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date=20220903&rc_month=202209&_type=json
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
            "rcDay": "토요일",
            "rcNo": "1",
            "chulNo": "7",
            "hrName": "인생의감동",
            "hrNo": "038291",
            "hrTool": "눈가리개",
            "bleCnt": "0",
            "bleDate": "",
            "medicalInfo": ""
          }
        ]
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
 * 출전마 장구사용 및 폐출혈 정보 가져오기
 * Endpoint: /API24_1/horseMedicalAndEquipment_1
 * 활용: AI 분석용 장비/건강 변수 — "눈가리개를 처음 착용했다" → 집중력 향상 기대. 폐출혈 이력 시 감점.
 */
async getHorseMedicalAndEquipment(params: {
  meet?: string;
  rc_date?: string;
  rc_month?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API24_1/horseMedicalAndEquipment_1`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: this.serviceKey,
        meet: params.meet || '1',
        rc_date: params.rc_date,
        rc_month: params.rc_month,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 (RaceEntry.equipment)

- `equipment` 필드에 `hrTool` 또는 장구내역 문자열 저장
- 폐출혈 이력은 별도 `bleeding_history` 필드 또는 JSON에 저장 가능

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
| **99** | UNKNOWN_ERROR                         | 기타에러                           |

---

## 8. AI 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드       | AI 분석 활용 예시                                                |
| ----------------- | ---------------------------------------------------------------- |
| **장구 (가면, 눈가리개)** | "눈가리개를 처음 착용했다" → 집중력 향상 기대, 가산점 부여      |
| **폐출혈 이력**   | 폐출혈 이력 있음 → 호흡기 리스크 감점                           |
| **진료사항**      | 최근 진료 이력 → 컨디션 변수로 반영                              |
