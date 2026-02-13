# 🐎 한국마사회 경주성적정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주성적정보
- **서비스 설명**: 시행 경마장, 경주일자, 경주번호 등을 기준으로 경주 결과 및 상세 기록(순위,
  경주기록, 구간별 기록, 상금 등)을 조회하는 서비스입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API214_1`
- **Endpoint**: `/RaceDetailResult`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요

---

## 3. 요청 메시지 명세 (Request)

API 호출 시 필요한 파라미터입니다.

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                           |
| :------------- | :---------------- | :-------: | :----- | :---------- | :----------------------------- |
| **ServiceKey** | 서비스키          | 필수 (1)  | String | -           | 공공데이터포털에서 받은 인증키 |
| **numOfRows**  | 한 페이지 결과 수 | 필수 (1)  | Number | 10          | 한 페이지에 출력할 결과 수     |
| **pageNo**     | 페이지 번호       | 필수 (1)  | Number | 1           | 조회할 페이지 번호             |
| **meet**       | 시행경마장        | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부경         |
| **rc_year**    | 경주년도          | 옵션 (0)  | Number | 2022        | YYYY 형식                      |
| **rc_month**   | 경주년월          | 옵션 (0)  | Number | 202202      | YYYYMM 형식                    |
| **rc_date**    | 경주일자          | 옵션 (0)  | Number | 20220220    | YYYYMMDD 형식                  |
| **rc_no**      | 경주번호          | 옵션 (0)  | Number | 1           | 경주 번호                      |

---

## 4. 응답 메시지 명세 (Response)

API 호출 성공 시 반환되는 데이터 필드입니다.

### A. 공통 정보

| 항목명 (Key) | 항목명 (국문) | 설명                                |
| :----------- | :------------ | :---------------------------------- |
| **meet**     | 경마장명      | 시행 경마장 이름 (서울/제주/부경)   |
| **rcDate**   | 경주일자      | 경주 날짜 (YYYYMMDD)                |
| **rcDay**    | 경주요일      | 경주 요일 (예: 일요일)              |
| **rcNo**     | 경주번호      | 경주 번호                           |
| **rcName**   | 경주명        | 경주 이름 (예: 일반, 대상경주명)    |
| **rcDist**   | 경주거리      | 경주 거리 (m)                       |
| **rank**     | 등급조건      | 경주 등급 (예: 국6등급)             |
| **weather**  | 날씨          | 당시 날씨 (예: 맑음)                |
| **track**    | 주로상태      | 주로 상태 및 함수율 (예: 건조 (2%)) |

### B. 경주마/기수/조교사 정보

| 항목명 (Key) | 항목명 (국문) | 설명                          |
| :----------- | :------------ | :---------------------------- |
| **ord**      | 순위          | 최종 순위                     |
| **hrName**   | 마명          | 말 이름                       |
| **hrNo**     | 마번          | 말 고유 번호                  |
| **chulNo**   | 출전번호      | 출전 번호 (등번호)            |
| **age**      | 연령          | 말 나이                       |
| **sex**      | 성별          | 말 성별 (수/암/거)            |
| **jkName**   | 기수명        | 기수 이름                     |
| **jkNo**     | 기수번호      | 기수 고유 번호                |
| **trName**   | 조교사명      | 조교사 이름                   |
| **owName**   | 마주명        | 마주 이름                     |
| **wgBudam**  | 부담중량      | 말이 짊어진 무게 (kg)         |
| **wgHr**     | 마체감량      | 말 체중 및 증감 (예: 502(-2)) |
| **hrTool**   | 장구내역      | 착용 장구 (예: 망사눈, 혀끈)  |

### C. 기록 및 배당 정보 (승부예측 핵심 데이터)

| 항목명 (Key)     | 항목명 (국문)       | 설명                                       |
| :--------------- | :------------------ | :----------------------------------------- |
| **rcTime**       | 경주기록            | 최종 주파 기록 (초)                        |
| **diffUnit**     | 착차                | 1위와의 거리 차이                          |
| **winOdds**      | 단승식배당율        | 단승식(1등 적중) 배당률                    |
| **plcOdds**      | 복승식배당율        | 복승식(1,2등 적중) 배당률                  |
| **seS1fAccTime** | 서울S1F통과누적기록 | (서울) 초반 S1F(Start 1 Furlong) 통과 기록 |
| **seG3fAccTime** | 서울G3F통과누적기록 | (서울) 후반 G3F(Goal 3 Furlong) 통과 기록  |
| **seG1fAccTime** | 서울G1F통과누적기록 | (서울) 결승선 전 1펄롱 통과 기록           |
| **sjS1fOrd**     | S1F구간통과순위     | 초반 S1F 구간 순위 (선행력 판단 지표)      |
| **sjG3fOrd**     | G3F구간통과순위     | 후반 G3F 구간 순위 (추입력 판단 지표)      |
| **bu\_**...      | 부경...             | 부산경남 경마장 전용 구간 기록 필드        |
| **je\_**...      | 제주...             | 제주 경마장 전용 구간 기록 필드            |

_(참고: 경마장(서울/부경/제주)에 따라 구간 기록 필드명이 다릅니다. `se_`(서울), `bu_`(부산),
`je_`(제주) 접두사를 확인하세요.)_

---

## 5. 요청 예시 (Example)

**Request URL**

```http
http://apis.data.go.kr/B551015/API214_1/RaceDetailResult?ServiceKey=[인증키]&numOfRows=10&pageNo=1&rc_date=20220220&rc_no=1&_type=json
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
                <hrName>은혜</hrName>
                <ord>1</ord>
                <rcTime>75.9</rcTime>
                <winOdds>4.6</winOdds>
                <track>건조 (2%)</track>
                <seS1fAccTime>13.6</seS1fAccTime> <seG3fAccTime>36.6</seG3fAccTime> </item>
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
| **31** | DEADLINE_HAS_EXPIRED_ERROR            | 기한만료된 서비스키                |
| **99** | UNKNOWN_ERROR                         | 기타에러                           |
