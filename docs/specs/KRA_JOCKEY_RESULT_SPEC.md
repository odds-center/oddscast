# 🐎 한국마사회 기수통산전적비교 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 기수통산전적비교
- **서비스 설명**: 서울, 부산, 제주 경마장에서 활동 중인 기수들의 통산 전적(1착/2착/3착 횟수, 승률,
  복승률, 상금 등)을 조회하는 서비스입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/jktresult`
- **Endpoint**: `/getjktresult`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요
- **데이터 갱신 주기**: 일 1회

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키 |
| **numOfRows**  | 한 페이지 결과 수 | 옵션 (0)  | Number | 10          | 한 페이지에 출력할 결과 수     |
| **pageNo**     | 페이지 번호       | 옵션 (0)  | Number | 1           | 조회할 페이지 번호             |
| **meet**       | 경마장번호        | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부경         |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

| 항목명 (Key)    | 항목명 (국문)  | 설명                                                    |
| :-------------- | :------------- | :------------------------------------------------------ |
| **meet**        | 경마장         | 해당 기수가 소속된 경마장 코드 (1:서울, 2:제주, 3:부경) |
| **jkNo**        | 기수번호       | 기수 고유 식별 번호 (예: 080103)                        |
| **jkName**      | 기수명         | 기수 이름 (예: 박태종)                                  |
| **rcCntT**      | 통산총출전횟수 | 기수의 총 경주 출전 횟수 (경험치 지표)                  |
| **ord1CntT**    | 통산1착횟수    | 통산 1등 횟수                                           |
| **ord2CntT**    | 통산2착횟수    | 통산 2등 횟수                                           |
| **ord3CntT**    | 통산3착횟수    | 통산 3등 횟수                                           |
| **winRateTsum** | 승률           | 1등 할 확률 (%)                                         |
| **quRateTsum**  | 복승률         | 2등 안에 들어올 확률 (%) (승부예측 핵심 지표)           |
| **chaksunT**    | 착순상금       | 기수가 획득한 총 상금 액수                              |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
http://apis.data.go.kr/B551015/jktresult/getjktresult?ServiceKey=[인증키]&meet=1&pageNo=1&numOfRows=10&_type=json
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
                <meet>1</meet>
                <jkNo>080103</jkNo>
                <jkName>박태종</jkName>
                <rcCntT>14777</rcCntT>
                <ord1CntT>2150</ord1CntT>
                <ord2CntT>1988</ord2CntT>
                <ord3CntT>1678</ord3CntT>
                <winRateTsum>14.5</winRateTsum>
                <quRateTsum>28.0</quRateTsum>
                <chaksunT>0</chaksunT>
            </item>
        </items>
    </body>
</response>
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
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 활용기간 만료                      |
| **32** | UNREGISTERED_IP_ERROR                 | 등록되지 않은 IP                   |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |
