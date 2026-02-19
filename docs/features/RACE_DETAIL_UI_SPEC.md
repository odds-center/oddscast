# 경마 승부예측 서비스 UI/UX 데이터 명세서

> `코리아레이스 종합지 2026.pdf`를 기준으로, 경주 상세 화면(Race Detail) 및 분석 데이터의 UI 구성을 정의합니다.

---

## 1. 개요 (Overview)

이 문서는 실제 경마 예상지에서 익숙한 데이터 표현 방식을 따라, 사용자가 직관적으로 이해할 수 있는 UI 구성을 정의합니다.

- **참고**: 코리아레이스 종합지, KRA API 필드
- **대상 화면**: 경주 상세 페이지 (`/races/[id]`)

---

## 2. 화면별 데이터 구성

### 2.1. 경주 헤더 (Race Header)

사용자가 경주를 선택했을 때 최상단에 노출되는 카드 형태 요약 정보.

| 필드명 (Field) | DTO/DB | 데이터 예시 | 설명 |
|----------------|--------|-------------|------|
| Location | rcDay + meetName | 일요 서울 | 시행 경마장 및 요일 |
| RaceNo | rcNo | 제 9 경주 | 경주 번호 |
| **rcDate** | rcDate | 2025-02-19 | 경주 날짜 |
| Time | stTime | 17:25 | 출발 시각 |
| Distance | rcDist | 1800M | 경주 거리 |
| Grade | rank | 3등급 | 경주 등급 (Class) |
| **rcPrize** | rcPrize | 1착 8,000만원 | 1착 상금 |
| Type | budam (entry 기준) | 핸디캡 일반 | 경주 방식 |
| Condition | rcCondition | 연령오픈 / 성별오픈 | 출전 조건 |
| Weather | weather | 맑음 | 날씨 (선택) |
| Track | track | 건조 (2%) | 주로 상태 (선택) |

**UI 표현**: 카드 형태, 상단 Location+경주번호, rcDate·rcPrize 아이콘(Calendar, Award), 하단 거리·등급·조건 그리드.

---

### 2.2. 출전마 리스트 (Horse Entry Table)

핵심 판단 데이터. 리스트/테이블 뷰로 제공.

| No (게이트) | 마명 | 기수/조교사 | 마령/산지 | 부담중량 | 레이팅 | 통산 |
|-------------|------|-------------|-----------|----------|--------|------|
| DTO | chulNo, hrNo | hrName | jkName, trName | age, sex, prd | wgBudam, horseWeight | rating | rcCntT, ord1CntT |
| 예시 | 1 | 탄성의반석 | 마이아 / 정호익 | 미4수 | 56.0 (+2.0) | 62 | 20전 3승 |

**마령/산지 포맷**: `prd(산지) + age(연령) + sex(성별)`

- 산지: 한국→한, 미국→미
- 성별: 암, 수, 거
- 예: `한4수`, `미3암`, `미5거`

**부담중량 증감**:

- `horseWeight` 형식: `"502(-2)"` (마체중 502kg, 전 대비 -2kg)
- 부담중량 옆에 `(+2.0)` / `(-1.0)`으로 증감 표시
- 양수: 빨간색, 음수: 파란색

**UI 포인트**:

- 게이트 번호에 KRA 게이트 색상 적용
- S1F(초반), G1F(후반)는 KRA 추가 API 확보 시 스피드 바로 표현

---

### 2.3. 예상 기호 (Prediction Symbol)

전문가/AI 예측 순위를 기호로 표시.

| 기호 | 의미 | 순위 | 표시 |
|------|------|------|------|
| ◎ | 강력추천 (우수) | 1순위 | 배지/아이콘 |
| ○ | 추천 (양호) | 2순위 | 배지/아이콘 |
| △ | 복병 | 3순위 | 배지/아이콘 |
| ※ | 주의 | 4순위 | 배지/아이콘 |
| ★ | 인기 | - | 배지/아이콘 |

**AI 예측 연동**: `horseScores` 순서대로 1~4순위에 ◎○△※ 매핑.

---

### 2.4. 게이트 색상 (KRA 기준)

| 번호 | 색상 | hex |
|------|------|-----|
| 1 | 흰 | #ffffff |
| 2 | 노 | #facc15 |
| 3 | 빨 | #ef4444 |
| 4 | 검 | #171717 |
| 5 | 파 | #3b82f6 |
| 6 | 초 | #22c55e |
| 7 | 주 | #a855f7 |
| 8 | 분홍 | #ec4899 |
| 9 | 회 | #a3a3a3 |
| 10 | 청 | #0ea5e9 |
| 11~14 | 연초, 주황, 연파, 연노 | - |

밝은 색(흰, 노 등)은 어두운 텍스트, 나머지는 흰색 텍스트 사용.

---

## 3. 탭 구조 (Tab Layout)

모바일 환경을 고려해 정보를 탭으로 분리.

| 탭 | 내용 |
|----|------|
| 기본정보 | 출전마 테이블, 출전마 선택 |
| 기록정보 | 경주 결과, 배당, 기수·말 통합 분석 |
| 예상정보 | AI 예상, 예측권 사용 |

---

### 2.5. 경주 결과 테이블 (Result Table)

경주 종료 후 표시되는 결과 테이블. `GET /races/:id/results` 또는 Race 상세 include results.

| 컬럼 | DTO | 설명 |
|------|-----|------|
| 순위 | ord | 도착 순위 |
| 기번 | chulNo | 게이트 번호 |
| 마번 | hrNo | 마번호 |
| 마명 | hrName | 마명 |
| 기수 | jkName | 기수명 |
| 조교사 | trName | 조교사명 |
| **착차** | diffUnit | 1위 대비 기록차 (예: 1.0, 0.5, 3/4) |
| **단승** | winOdds | 단승 배당율 |
| **복승** | plcOdds | 복승 배당율 |
| ordType | ordType | 낙마(DISQ)/실격(EQ)/기권(WDR) 등 |

**모바일**: 일부 컬럼(착차, 단승·복승)은 공간에 따라 숨김 가능.

---

### 2.6. 배당 섹션 (Dividends)

배당 정보는 카드 그리드 형태, 접기/펼치기 지원.

---

## 4. 시각적 계층 (Design Guidelines)

### 4.1. 중요도

| 레벨 | 대상 |
|------|------|
| Primary | 마번, 마명, AI 예상 순위 |
| Secondary | 기수, 조교사, 부담중량 |
| Tertiary | 과거 기록, 산지, 레이팅 |

### 4.2. 밀도

- 경마 정보는 데이터 밀도가 높음
- 모바일: 탭/가로 스크롤로 기본정보 / 기록정보 / 예상정보 분리
- 기본 폰트 16px, px는 짝수 사용 (가독성 고려)

---

## 5. 컴포넌트 매핑

| 명세 항목 | 컴포넌트 |
|-----------|----------|
| 경주 헤더 | `webapp/components/race/RaceHeaderCard.tsx` |
| 출전마 테이블 | `webapp/components/race/HorseEntryTable.tsx` |
| 예상 기호 | `webapp/components/race/PredictionSymbol.tsx` |
| 탭 + 상세 | `webapp/pages/races/[id].tsx` |

---

## 6. API / DTO 매핑

- Race: `RaceDto`, `RaceDetailDto` (`shared/types/dto/race.dto.ts`)
- Entry: `RaceEntryDto` (chulNo, hrNo, hrName, jkName, trName, wgBudam, age, sex, prd, rating, horseWeight, rcCntT, ord1CntT)
- **RaceResult**: `RaceResultDto` (ord, chulNo, hrNo, hrName, jkName, trName, wgBudam, wgHr, rcTime, diffUnit, winOdds, plcOdds, ordType)
- 예측: `horseScores` 배열의 순서로 ◎○△※ 매핑
