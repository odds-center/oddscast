# 🐎 한국마사회 경주 구간별 성적 정보 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 경주 구간별 성적 정보
- **서비스 설명**: 서울, 부산경남, 제주 경마장에서 시행된 경주정보를 조회하는 서비스입니다. 상세구간통과기록,
  통과순위, 통과시간, 펄롱타임 등을 제공합니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **일일 트래픽**: 개발계정 10,000건

---

## 2. 기본 정보

- **Base URL**: `https://apis.data.go.kr/B551015/API6_1`
- **Endpoint**: `/raceDetailSectionRecord_1`
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
| **meet**       | 시행경마장구분    | 옵션 (0)  | Number | 1           | 1:서울, 2:제주, 3:부산         |
| **rc_year**    | 경주년            | 옵션 (0)  | Number | 2016        | YYYY 형식                      |
| **rc_month**   | 경주월            | 옵션 (0)  | Number | 201609      | YYYYMM 형식                    |
| **rc_date**    | 경주일            | 옵션 (0)  | Number | 20160907    | YYYYMMDD 형식                  |
| **rc_no**      | 경주번호          | 옵션 (0)  | Number | 1           | 경주 번호                      |
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
| **rcNo**     | 경주번호       | 경주 번호                     |
| **rcDist**   | 경주거리       | 경주 거리 (m)                 |

### B. 경주마 정보

| 항목명 (Key) | 항목명 (국문)  | 설명                     |
| :----------- | :------------- | :----------------------- |
| **hrName**   | 마명           | 경주마의 이름            |
| **hrNo**     | 마번           | 경주마의 고유 등록 번호   |
| **chulNo**   | 출전번호       | 출전 번호 (등번호)       |
| **ord**      | 순위           | 최종 순위                 |

### C. 구간별 성적 (AI 분석용 핵심)

| 항목명 (Key)     | 항목명 (국문)       | 설명                                       |
| :--------------- | :------------------ | :----------------------------------------- |
| **seS1fAccTime** | 서울S1F통과누적기록  | (서울) 초반 S1F(Start 1 Furlong) 통과 기록 |
| **seG3fAccTime** | 서울G3F통과누적기록 | (서울) 후반 G3F(Goal 3 Furlong) 통과 기록  |
| **seG1fAccTime** | 서울G1F통과누적기록 | (서울) 결승선 전 1펄롱 통과 기록           |
| **sjS1fOrd**     | S1F구간통과순위     | 초반 S1F 구간 순위 (선행력 판단 지표)      |
| **sjG3fOrd**     | G3F구간통과순위     | 후반 G3F 구간 순위 (추입력 판단 지표)      |
| **bu\_**...      | 부경 전용 구간 기록 | 부산경남 경마장 전용 필드                  |
| **je\_**...      | 제주 전용 구간 기록 | 제주 경마장 전용 필드                      |

_(참고: 경마장(서울/부경/제주)에 따라 구간 기록 필드명이 다릅니다. `se_`(서울), `bu_`(부산),
`je_`(제주) 접두사를 확인하세요.)_

### D. 구간별 상세 (통과시간, 펄롱타임)

| 항목명 (Key)   | 항목명 (국문) | 설명                     |
| :------------- | :------------ | :----------------------- |
| **s1fTime**    | S1F통과시간   | 초반 200m 구간 통과 시간  |
| **g3fTime**    | G3F통과시간   | 후반 G3F 구간 통과 시간   |
| **g1fTime**    | G1F통과시간   | 결승선 전 1펄롱 통과 시간 |
| **furlongTime**| 펄롱타임      | 펄롱별 소요 시간         |

---

## 5. 요청 예시 (Example)

**Request URL**

```http
https://apis.data.go.kr/B551015/API6_1/raceDetailSectionRecord_1?ServiceKey=[인증키]&pageNo=1&numOfRows=10&meet=1&rc_date=20160907&rc_month=201609&rc_year=2016&rc_no=1&_type=json
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
            "rcDate": "20160907",
            "rcNo": "1",
            "hrName": "인생의감동",
            "hrNo": "038291",
            "chulNo": "7",
            "ord": "1",
            "seS1fAccTime": "13.6",
            "seG3fAccTime": "36.6",
            "seG1fAccTime": "12.6",
            "sjS1fOrd": "1",
            "sjG3fOrd": "2"
          }
        ]
      }
    }
  }
}
```

---

## 6. 개발 시 주의사항 (Developer Notes)

1. **경마장별 필드명 접두사**  
   서울(`se_`, `sj_`), 부산경남(`bu_`, `bj_`), 제주(`je_`, `jj_`) 등 경마장별로 구간 필드명이 다릅니다.  
   `meet` 값에 따라 파싱 로직을 분기하세요.

2. **선행마/추입마 분류**  
   - `s1fTime` 또는 S1F 통과순위가 상위 20% → **선행마**  
   - `g3fTime` 또는 G3F 통과순위가 상위 → **추입마**  
   - SectionalRecord 모델에 `s1f_time`, `g1f_time` 저장 후 분석 로직에 활용

---

## 7. NestJS 연동 가이드 (Implementation)

### KraService 메서드 예시

```typescript
/**
 * 경주 구간별 성적 정보 가져오기
 * Endpoint: /API6_1/raceDetailSectionRecord_1
 * 활용: AI 분석용 각질 — 초반 S1F가 빠른 '선행마', 막판 G3F가 빠른 '추입마' 분류.
 */
async getSectionalRecord(params: {
  meet?: string;
  rc_date?: string;
  rc_month?: string;
  rc_year?: string;
  rc_no?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${this.baseUrl}/API6_1/raceDetailSectionRecord_1`;

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

### DB 매핑 (RaceResult.sectionalTimes)

| API 필드      | DB/엔티티 필드 |
| ------------- | ------------- |
| seS1fAccTime  | sectionalTimes.s1f |
| seG3fAccTime  | sectionalTimes.g3f |
| seG1fAccTime  | sectionalTimes.g1f |
| sjS1fOrd      | sectionalTimes.s1fOrd |
| sjG3fOrd      | sectionalTimes.g3fOrd |

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
| **S1F 구간 기록** | 초반 기록이 빠른 경우 → **선행마**로 태깅, 선행 승부 유리 판단         |
| **G3F 구간 기록** | 후반 G3F 구간이 빠른 경우 → **추입마**로 태깅, 막판 스퍼트 기대       |
| **구간 통과순위** | s1fOrd 상위 20% = 선행마, g3fOrd 상위 = 추입마                         |
