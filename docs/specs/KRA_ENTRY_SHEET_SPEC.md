# 🐎 한국마사회 출전표 상세정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 출전표 상세정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장에서 시행 예정인 경주의 출전 경주마 정보(기수명,
  기수번호, 경주요일 등)를 조회하는 서비스입니다.
- **데이터 제공 시점**: 경주 **2~3일 전**부터 제공. 미래 일정은 API72_2 경주계획표(`racePlan_2`)로 선조회.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API26_2`
- **Endpoint**: `/entrySheet_2`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키 |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | Number | 10          | 한 페이지에 출력할 결과 수     |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 조회할 페이지 번호             |
| **meet**       | 시행경마장        | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부산경남     |
| **rc_date**    | 경주일            | 옵션 (0)  | Number | 20220903    | YYYYMMDD 형식                  |
| **rc_month**   | 경주월            | 옵션 (0)  | Number | 202209      | YYYYMM 형식                    |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

| 항목명 (Key) | 항목명 (국문)  | 설명                          |
| :----------- | :------------- | :---------------------------- |
| **meet**     | 시행경마장명   | 시행 경마장 이름 (예: 서울)   |
| **rcDate**   | 경주일자       | 경주가 열리는 날짜 (YYYYMMDD) |
| **rcDay**    | 경주요일       | 경주 요일 (예: 토요일)        |
| **rcNo**     | 경주번호       | 해당 일자의 경주 번호         |
| **chulNo**   | 마번(출주번호) | 출전하는 말의 번호            |
| **hrName**   | 마명           | 경주마의 이름                 |
| **hrNameEn** | 영문마명       | 경주마의 영문 이름            |
| **hrNo**     | 마번(고유번호) | 경주마의 고유 등록 번호       |
| **prd**      | 산지           | 말의 생산지 (예: 한국)        |
| **sex**      | 성별           | 말의 성별 (암/수/거)          |
| **age**      | 연령           | 말의 나이                     |
| **wgBudam**  | 부담중량       | 말이 짊어지는 무게 (kg)       |
| **rating**   | 레이팅         | 경주마의 등급 포인트          |
| **jkName**   | 기수명         | 기수의 이름                   |
| **jkNameEn** | 영문기수이름   | 기수의 영문 이름              |
| **jkNo**     | 기수번호       | 기수 고유 번호                |
| **trName**   | 조교사명       | 조교사의 이름                 |
| **trNo**     | 조교사번호     | 조교사 고유 번호              |
| **owName**   | 마주명         | 마주의 이름                   |
| **owNo**     | 마주번호       | 마주 고유 번호                |
| **rcDist**   | 경주거리       | 경주 거리 (m)                 |
| **dusu**     | 두수           | 총 출전 두수                  |
| **rank**     | 등급조건       | 경주 등급 (예: 국6등급)       |
| **stTime**   | 출발시각       | 경주 시작 시간                |
| **budam**    | 부담구분       | 부담 중량 방식 (예: 별정A)    |
| **rcName**   | 경주명         | 경주 이름 (예: 일반)          |
| **chaksun1** | 1착상금        | 1등 상금                      |
| **chaksunT** | 통산수득상금   | 해당 말의 총 획득 상금        |
| **rcCntT**   | 통산출주횟수   | 총 출전 횟수                  |
| **ord1CntT** | 통산1위횟수    | 총 1위 횟수                   |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
http://apis.data.go.kr/B551015/API26_2/entrySheet_2?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date=20220903&rc_month=202209&_type=json
```

**Response (XML 예시 -> JSON으로 변환됨)**

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
            "hrName": "인생의감동",
            "jkName": "조한별",
            "meet": "서울",
            "rcDate": "20220903",
            "rcNo": "1"
          }
        ]
      }
    }
  }
}
```

---

## 6. 에러 코드 (Error Codes)

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
