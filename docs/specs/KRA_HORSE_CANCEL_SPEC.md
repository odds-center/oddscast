# 🐎 한국마사회 경주마 출전취소 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주마 출전취소 정보
- **서비스 설명**: 한국마사회에서 제공하는 경주마 출전취소 정보를 조회하는 서비스입니다. 시행경마장구분, 경주일자,
  마명, 마번, 경주번호, 출주번호, 변경사유 등을 제공합니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/API9_1`
- **Endpoint**: `/raceHorseCancelInfo_1`
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
| **meet**       | 시행경마장구분    | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부산 (생략 시 1:서울 기본값) |
| **rc_year**    | 경주년            | 옵션 (0)  | Number | 2022        | YYYY 형식                      |
| **rc_month**   | 경주월            | 옵션 (0)  | Number | 202209      | YYYYMM 형식                    |
| **rc_date**    | 경주일            | 옵션 (0)  | Number | 20220925    | YYYYMMDD 형식                  |
| **rc_no**      | 경주번호          | 옵션 (0)  | Number | 3           | 경주 번호                      |
| **_type**      | 데이터 형식       | 옵션 (0)  | String | json        | json 또는 xml (JSON 사용 권장) |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.  
_(실제 필드명은 공공데이터포털 미리보기 또는 Swagger UI로 확인 후 보정 필요)_

### A. 경주 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 시행경마장구분 | 시행 경마장 (1:서울, 2:제주, 3:부산) |
| **rcDate**   | 경주일자       | 경주 날짜 (YYYYMMDD)          |
| **rcNo**     | 경주번호       | 경주 번호                     |

### B. 취소된 경주마 정보 (긴급 알림용)

| 항목명 (Key)   | 항목명 (국문)  | 설명                          |
| :------------- | :------------- | :---------------------------- |
| **hrName**    | 마명           | 취소된 경주마의 이름          |
| **hrNo**      | 마번           | 취소된 경주마의 고유 등록 번호 |
| **chulNo**    | 출주번호       | 취소된 말의 출전 번호         |
| **cancelReason** | 변경사유     | 출전 취소 사유 (부상, 질병 등) |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API9_1/raceHorseCancelInfo_1?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date=20220925&rc_month=202209&rc_year=2022&rc_no=3&_type=json
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
            "meet": "1",
            "rcDate": "20220925",
            "rcNo": "3",
            "hrName": "인생의감동",
            "hrNo": "0046350",
            "chulNo": "7",
            "cancelReason": "부상"
          }
        ]
      }
    }
  }
}
```

---

## 6. 개발 시 주의사항 (Developer Notes)

1. **경기 당일 실시간 조회**  
   경기 직전 갑자기 출전 취소된 말이 있을 수 있으므로, **경기 30분 전~시작 직전**에 주기적으로  
   조회하여 앱에서 해당 말을 제외 처리하는 로직이 필요합니다.

2. **출전표 업데이트**  
   취소된 `hrNo`/`chulNo`를 출전표(RaceEntry)에서 제외하거나 `CANCELLED` 상태로 표시하세요.

3. **빈 결과**  
   해당 일자·경주에 취소된 말이 없으면 `items`가 비어있거나 `item`이 없을 수 있습니다.

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 경주마 출전취소 정보 가져오기
 * Endpoint: /API9_1/raceHorseCancelInfo_1
 * 활용: 긴급 알림 — 경기 직전 갑자기 출전 취소된 말을 앱에서 제외 처리.
 */
async getRaceHorseCancelInfo(params: {
  meet?: string;
  rc_date?: string;
  rc_month?: string;
  rc_year?: string;
  rc_no?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API9_1/raceHorseCancelInfo_1`;

  const response = await firstValueFrom(
    this.httpService.get(url, {
      params: {
        serviceKey: this.serviceKey,
        meet: params.meet || '1',
        rc_date: params.rc_date,
        rc_month: params.rc_month,
        rc_year: params.rc_year,
        rc_no: params.rc_no,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json',
      },
    }),
  );

  return response.data;
}
```

### DB 매핑 (RaceEntry 상태)

| API 응답 | 처리 방식 |
| -------- | --------- |
| 취소된 hrNo/chulNo | 출전표에서 해당 RaceEntry 제외 또는 `status: CANCELLED` |
| cancelReason | 변경사유 로그 저장 (선택) |

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

## 9. 활용 전략 (KRA_API_ANALYSIS_SPEC 연계)

| 데이터 필드       | 활용 용도                                                      |
| ----------------- | -------------------------------------------------------------- |
| **hrNo**          | 취소된 마번으로 출전표에서 해당 말 제외                        |
| **chulNo**        | 출전번호로 UI에서 해당 번호 제거 또는 "취소" 표시               |
| **cancelReason**  | 취소 사유 표시 (부상, 질병 등) — 사용자 알림 메시지에 활용     |
