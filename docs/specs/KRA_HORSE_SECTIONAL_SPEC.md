# 🐎 한국마사회 마필 구간별 경주기록 OpenAPI 명세서

## 1. 서비스 개요

- **서비스명**: 한국마사회 마필 구간별 경주기록
- **서비스 설명**: 서울, 부산경남, 제주 경마장에서 시행된 경주의 마필별 구간 성적(S1F, 1C~4C, G3F, G1F 등) 정보를 조회하는 서비스입니다. **선행마/추입마/중간마** 분석의 핵심 데이터입니다.
- **데이터 교환 표준**: XML, JSON
- **인터페이스 방식**: REST (GET)
- **트래픽**: 개발계정 10,000건/일

---

## 2. 기본 정보

- **Base URL**: `http://apis.data.go.kr/B551015/API37_1`
- **Endpoint**: `/sectionRecord_1`
- **활용 신청**: 공공데이터포털 활용신청 후 ServiceKey 발급 필요

---

## 3. 요청 메시지 명세 (Request)

| 항목명 (Key)   | 항목명 (국문)     | 필수 여부 | 타입   | 샘플 데이터 | 설명                       |
| :------------- | :---------------- | :-------: | :----- | :---------- | :------------------------- |
| **ServiceKey** | 서비스키          | 필수      | String | -           | 공공데이터포털 인증키      |
| **meet**       | 시행경마장구분    | 옵션      | String | 1           | 1:서울, 2:제주, 3:부산경남 |
| **rc_date**    | 경주일            | 옵션      | String | 20240210    | YYYYMMDD                   |
| **hr_no**      | 마번              | 옵션      | String | -           | 특정 마필 검색             |
| **hr_name**    | 마명              | 옵션      | String | -           | 특정 마필 검색             |
| **rc_year**    | 경주년            | 옵션      | String | -           |                            |
| **rc_month**   | 경주월            | 옵션      | String | -           |                            |
| **numOfRows**  | 한 페이지 결과 수 | 옵션      | Number | 20          |                            |
| **pageNo**     | 페이지 번호       | 옵션      | Number | 1           |                            |
| **_type**      | 응답 형식         | 옵션      | String | json        | json 또는 xml              |

- 입력된 경주일을 포함한 이전 경주의 거리별 기록을 표출합니다.

---

## 4. 응답 메시지 명세 (Response)

| 항목명 (Key) | 항목명 (국문)        | 설명                              |
| :----------- | :------------------- | :-------------------------------- |
| **meet**     | 시행경마장           | 1:서울, 2:제주, 3:부산경남        |
| **hr_no**    | 마번                 | 경주마 고유 번호                  |
| **hr_name**  | 마명                 | 경주마 이름                       |
| **rc_date**  | 경주일               | YYYYMMDD                          |
| **S1F**      | 출발지기준 200m      | 최고/최저/평균 (필드명은 API 확인) |
| **1C~4C**    | 곡선주로 구간        | 각 구간별 최고/최저/평균          |
| **G3F**      | 도착지기준 600m      | 최고/최저/평균                    |
| **G1F**      | 도착지기준 200m      | 최고/최저/평균                    |

- 실제 필드명은 camelCase(s1fAvg, g1fAvg) 또는 snake_case(s1f_avg), 대문자(S1F_AVG) 등 API에 따라 다를 수 있음.

---

## 5. 실제 API 호출 샘플

`server/scripts/fetch-kra-sample.mjs`에서 `horseSectional` 엔드포인트 호출 후  
`kra-sample-responses/horseSectional-{rcDate}.json`에 저장됩니다.

**실행**: `KRA_SERVICE_KEY=xxx node scripts/fetch-kra-sample.mjs [YYYYMMDD]`

---

## 6. DB 매핑 (RaceEntry.sectionalStats)

| 저장 필드 | 타입   | 설명                        |
| :-------- | :----- | :-------------------------- |
| s1fAvg    | number | S1F 평균 (선행마 판정용)     |
| g1fAvg    | number | G1F 평균 (추입마 판정용)     |
| s1fMin    | number | S1F 최저 (옵션)              |
| s1fMax    | number | S1F 최고 (옵션)              |
| g1fMin    | number | G1F 최저 (옵션)              |
| g1fMax    | number | G1F 최고 (옵션)              |

- **태깅 규칙**: s1fAvg &lt; 13.5 → 선행마, g1fAvg &lt; 12.5 → 추입마, 그 외 → 중간마

---

## 7. NestJS 연동 가이드

- `KraService.fetchHorseSectionalRecords(date)`: 당일 출전마에 대해 API37_1 조회 후 `RaceEntry.sectionalStats` 저장
- `syncAnalysisData`: 레이팅 후 `fetchHorseSectionalRecords` 호출
- `getSectionalAnalysisByHorse`: sectionalStats 우선 사용, 없으면 RaceResult.sectionalTimes fallback
