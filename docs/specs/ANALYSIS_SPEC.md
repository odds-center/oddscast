# 📊 경마 분석 알고리즘 명세서 v2

> `server/scripts/analysis.py` 및 `PredictionsService`의 분석 로직을 총괄 정의합니다.
> [KRA_ANALYSIS_STRATEGY.md](KRA_ANALYSIS_STRATEGY.md), [BUSINESS_LOGIC.md](../architecture/BUSINESS_LOGIC.md)와 연동.

---

## 1. 개요

### 1.1 분석 파이프라인

```
Race + RaceEntry (DB)
     ↓ enrichEntriesWithRecentRanks, enrichEntriesWithFallHistory, enrichEntriesWithTrainerResults
     ↓ enrichEntriesWithSectionalTag
     ↓
Python analysis.py
     ├── calculate_score  → 말별 score, sub(6요소), risk, winProb, tags, cascadeFallRisk
     └── analyze_jockey   → 기수별 jockeyScore, weightRatio, topPickByJockey
     ↓
NestJS constructPrompt
     ↓ finalScore(말+기수 통합), winProb(softmax), compact entries
     ↓
Gemini API → Prediction.scores
```

### 1.2 v2 핵심 변경점

| 항목 | v1 | v2 |
|------|-----|-----|
| 하위 점수 스케일 | 불균형 (0-100, -2~15, 0~5 혼재) | **모두 0~100 정규화** |
| 가중치 | 0.45/0.35 + 잔여 보너스 | **6요소 합=1.0 (경마 연구 기반)** |
| 누락 변수 | 레이팅·기세·경험·조교사·각질 | **+컨디션(마체중·연령·부담중량·성별), 거리적합도** |
| 낙마 리스크 | 별도 출력만 | **감점 적용 (고위험 -12%, 중위험 -6%)** |
| 승률 확률 | 없음 | **softmax 기반 winProb(%)** |
| Gemini 토큰 | ~3000+ 토큰 | **~1200 토큰 (~60% 절감)** |

### 1.3 출력 구조

**Python `calculate_score` 반환**

```json
{
  "scores": [
    {
      "hrNo": "1", "chulNo": "1", "hrName": "골든에이스",
      "score": 84.26,
      "sub": {"rat": 94.98, "frm": 88.71, "cnd": 80.0, "exp": 66.85, "trn": 82.4, "suit": 62.0},
      "risk": 10.0,
      "winProb": 39.4,
      "recentRanks": [1, 2, 3, 4, 5],
      "tags": ["R상위82", "기세↑", "베테랑55전9승", "컨디션◎"],
      "reason": "R상위82, 최근1위→2위→3위→4위→5위, 기세↑, 베테랑55전9승, 컨디션◎"
    }
  ],
  "cascadeFallRisk": 0.0
}
```

---

## 2. 말 기준 가중치 (W_HORSE)

경마 예측 학술 연구(Racing Post / Timeform) 기반 배분. **합 = 1.0**.

| 요소 | 가중치 | 근거 |
|------|--------|------|
| **rating** (레이팅) | 0.33 | KRA 공식 능력치, 가장 신뢰도 높은 지표 |
| **form** (폼/기세) | 0.26 | 최근 성적 + 추이, 현재 컨디션 반영 |
| **condition** (컨디션) | 0.14 | 마체중 변화·연령·부담중량·성별 |
| **experience** (경험) | 0.10 | 출전 횟수 + 승률 |
| **suitability** (적합도) | 0.10 | 거리·각질·주로상태 매칭 |
| **trainer** (조교사) | 0.07 | 조교사 승률/복승률 |

---

## 3. Sub-score 함수 (모두 0~100)

### 3.1 레이팅 (_rating_score)

```
sigmoid 상대비교(55%) + 로그 절대구간(45%)

상대: 100 / (1 + exp(-12 × (rating/max_rating - 0.75)))
절대: 10 + 90 × (ln(rating - 35) / ln(60))
```

- `max_rating`: 같은 경주 내 최고 레이팅 (상대 비교 기준)
- sigmoid: 75% 지점(max_rating의 0.75배)에서 50점, 이 위/아래로 급격한 분리
- KRA 레이팅 50~90 범위에서 ~25~95점 분포

### 3.2 폼/기세 (_form_score)

| 항목 | 값 |
|------|-----|
| **입력** | 최근 5경기 착순 (recentRanks) |
| **가중치** | [0.40, 0.25, 0.18, 0.10, 0.07] |
| **순위→점수** | 1=100, 2=85, 3=72, 4=60, 5=50, 6=40, 7=32, 8+=25 |
| **기세 추이** | 최근 2경기 vs 이전 2경기 비교 → -6~+8 가감 |
| **레이팅 추이** | ratingHistory 대비 현재 rating: +3이상 +4, -3이하 -3 |
| **데이터 없음** | 45.0 (중하 추정) |

### 3.3 컨디션 (_condition_score) ⭐ 신규

| 요인 | 가감 | 근거 |
|------|------|------|
| 마체중 변화 ≤2kg | +15 | 안정적 → 최적 컨디션 |
| 마체중 변화 ≤4kg | +8 | 소폭 변화 |
| 마체중 변화 ≤8kg | -5 | 중간 변화 |
| 마체중 변화 ≤12kg | -12 | 큰 변화 (주의) |
| 마체중 변화 >12kg | -20 | 극단적 (위험) |
| 연령 4세 | +12 | 전성기 |
| 연령 5세 | +10 | 전성기 |
| 연령 3세 | +5 | 성장 가능성 |
| 연령 6세 | -3 | 초기 하락 |
| 연령 7세+ | -8 | 노쇠 |
| 부담중량 >55kg | -(초과kg × 2.5) | 무거울수록 불리 |
| 부담중량 <53kg | +(부족kg × 1.5, max 8) | 가벼울수록 유리 |
| 성별 거세(거) | +3 | 거세마 안정적 기질 |

기본값: 55점 (중립)

### 3.4 경험 (_experience_score) ⭐ 개선

```
출전 횟수 점수 (0~50): min(50, 10 × ln(1 + runs/5))  # 로그 스케일
승률 점수 (0~50): 20%+ → 50, 15%+ → 42, 10%+ → 33, 5%+ → 22, 2%+ → 12, 기타 → 5
신인 (10전 미만): (합산) × 0.6
데이터 없음: 20점
```

### 3.5 조교사 (_trainer_score) ⭐ 개선

```
기본 30점 + 승률 보너스(max 35) + 복승률 보너스(max 25)
승률 보너스: winRate × 2.0 (승률 10% → +20, 15% → +30)
복승률 보너스: quRate × 0.7 (복승률 30% → +21)
데이터 없음: 40점 (평균 추정)
```

### 3.6 적합도 (_suitability_score) ⭐ 신규

| 말 유형 | 거리 | 가감 | 주로불량 추가 |
|---------|------|------|-------------|
| 선행마 | ≤1200m | +20 | -8 (미끄러짐) |
| 선행마 | ≤1400m | +12 | -8 |
| 선행마 | ≥1800m | -10 | -8 |
| 추입마 | ≥1800m | +18 | +5 (상대적 이점) |
| 추입마 | ≥1600m | +10 | +5 |
| 추입마 | <1200m | -12 | +5 |
| 중간마 | - | +5 | - |

기본값: 50점 (태그 없음/미분류)

---

## 4. 복합 점수 산출

```
composite = Σ(sub_score × W_HORSE[factor])    # 6요소 가중합

# 낙마 리스크 감점 (multiplicative)
if fallRisk >= 50:  composite *= 0.88   # -12%
elif fallRisk >= 30: composite *= 0.94  # -6%
elif fallRisk >= 20: composite *= 0.97  # -3%

# 1착상금 저평가 보정
composite += min(3, chaksun1 / 15000)
```

### 4.1 승률 확률 (softmax)

```
T = 15 (temperature)
P(i) = exp((score_i - max_score) / T) / Σ exp((score_j - max_score) / T) × 100%
```

### 4.2 NestJS 통합 점수 (constructPrompt)

```
finalScore = horseScore × wH + jockeyScore × wJ
winProb = softmax(finalScores, T=15)
```

---

## 5. 낙마·연쇄 낙마 리스크

### 5.1 낙마 리스크 (fallRiskScore / risk, 0~100)

| 요인 | 가산 |
|------|------|
| 말 과거 낙마 1회 | +20 |
| 말 과거 낙마 2회+ | +35 |
| 기수 과거 낙마 1회 | +15 |
| 기수 과거 낙마 2회+ | +25 |
| 신인 기수 (rcCntT<100) | +10 |
| 장구 (가면·눈가리개·망사눈·혀끈) | +8 |
| 폐출혈 이력 | +12 |

### 5.2 연쇄 낙마 (cascadeFallRisk, 0~100)

| 조건 | 공식 |
|------|------|
| 선행마 max fallRisk ≥ 50 | 30 + closer_ratio × 40 |
| 선행마 max fallRisk ≥ 30 | 15 + closer_ratio × 25 |
| 선행마 max fallRisk ≥ 20 & closer_ratio ≥ 0.3 | 10 |

---

## 6. 기수 점수 (calculate_jockey_score)

```
experienceScore (0~1):
  - rcCntT ≥ 1000: 1.0
  - 100 ≤ rcCntT < 1000: 0.5 + (rcCntT - 100) / 1800
  - rcCntT < 100: (0.3 + rcCntT/200) × 0.85

jockeyScore = min(80, winRate×0.5 + quRate×0.5) + experienceScore×20
```

### 6.1 말 vs 기수 가중치 (get_weight_ratio)

| 상황 | 말 | 기수 | 판별 조건 |
|------|-----|------|-----------|
| **혼전** | 50% | 50% | 기록 0.5초 이내 또는 상위 5마리 레이팅 10점 이내 |
| **특수** | 60% | 40% | weather≠맑음, track(습/추/불/중), rcDist≥1800 |
| **일반** | 70% | 30% | 그 외 |

---

## 7. Gemini 프롬프트 (v2: 토큰 최적화)

### 7.1 compact 입력

| 필드 | 설명 | 출처 |
|------|------|------|
| n | chulNo (출주번호) | Python |
| h | hrName (마명) | Python |
| j | jkName (기수명) | RaceEntry |
| fs | finalScore (말+기수 통합) | NestJS 산출 |
| hs | horseScore (말 점수) | Python score |
| js | jockeyScore (기수 점수) | analyze_jockey |
| wp | winProb (승률%) | NestJS softmax |
| sub | [rat, frm, cnd, exp, trn, suit] | Python sub-scores |
| r | rating (raw) | RaceEntry |
| rk | recentRanks | Python |
| risk | fallRiskScore (15+ 시) | Python |
| t | tags 배열 | Python |

### 7.2 제거된 필드 (토큰 절감)

Python이 이미 처리한 raw 데이터를 Gemini에 중복 전송하지 않음:
- chaksun1/T → experience score에 반영
- equipment, bleedingInfo → fall risk에 반영
- fallHistoryHorse/Jockey → fall risk에 반영
- rcCntT, ord1CntT → experience score에 반영
- trainerWinRate/QuRate → trainer score에 반영
- horseWeight → condition score에 반영
- ratingHistory → form score에 반영
- trainingSummary, wgBudam, sex, age, prd, jkNo, trName

### 7.3 프롬프트 규칙 (축약)

- reason/strengths/weaknesses: sub 6요소 + js(기수) + risk 수치 근거
- risk 30+ → weaknesses에 낙마위험 언급
- cascade 20+ → analysis에 연쇄낙마 가능성
- 7승식 모두 출력, hrNo = n값

---

## 8. NestJS 데이터 보강 (PredictionsService)

| 함수 | 용도 |
|------|------|
| `enrichEntriesWithRecentRanks` | RaceResult에서 말별 최근 5경기 착순 조회 |
| `enrichEntriesWithFallHistory` | RaceResult.ordType=FALL에서 말/기수별 낙마 횟수 집계 |
| `enrichEntriesWithTrainerResults` | TrainerResult에서 조교사 승률/복승률 |
| `enrichEntriesWithSectionalTag` | sectionalStats/RaceResult 기반 선행마/추입마 태깅 |
| `getSectionalAnalysisByHorse` | RaceEntry.sectionalStats 또는 RaceResult.sectionalTimes |
| `computeWinProbabilities` | softmax 기반 승률 확률 산출 (finalScore 기반) |

---

## 9. 참고 문서

- [KRA_ANALYSIS_STRATEGY.md](KRA_ANALYSIS_STRATEGY.md) — 마칠기삼, 기수 점수, 가중치
- [KRA_API_ANALYSIS_SPEC.md](KRA_API_ANALYSIS_SPEC.md) — DB·API·분석 흐름
- [BUSINESS_LOGIC.md](../architecture/BUSINESS_LOGIC.md) — 예측 파이프라인
- [KRA_EQUIPMENT_BLEEDING_SPEC.md](KRA_EQUIPMENT_BLEEDING_SPEC.md) — 장구·폐출혈 (fall risk 입력)
