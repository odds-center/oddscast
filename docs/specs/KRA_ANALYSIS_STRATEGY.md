# 📊 KRA API 기반 통계 및 분석 전략

## 1. 개요

본 문서는 한국마사회(KRA) 공공데이터 API를 활용한 경마 승부예측 서비스의 **통계·분석 전략**을 정리합니다.  
말의 능력과 기수의 역량을 어떻게 데이터로 분석하고, 가중치를 어떻게 배분할지에 관한 가이드입니다.

---

## 2. 마칠기삼(馬七騎三)

> **"말이 7이고 기수가 3이다"** — 경마계의 대표 격언

일반적으로 **말의 능력**이 승패에 더 큰 영향을 미칩니다. 그러나 **"기수가 더 중요하다"**고 느껴지는 순간이 있습니다.

- **비슷한 능력을 가진 말들이 뛸 때** — 우승 후보들의 기록 차이가 0.5초 이내
- **변수가 많은 경주** — 비 오는 날, 장거리, 혼전 경주

이런 상황에서는 **기수의 역량이 승패를 완전히 뒤바꿀 수 있습니다.**

---

## 3. 기수가 중요한 이유 (데이터 분석 포인트)

기수는 단순히 말 위에 얹혀가는 사람이 아닙니다. 아래 3가지 요인을 데이터로 반영해야 합니다.

| 요인 | 설명 | 데이터 소스 |
|------|------|-------------|
| **작전 전개 (Positioning)** | 초반에 무리할지, 뒤에서 체력을 아꼈다가 막판에 터트릴지 결정 | [기수통산전적비교](KRA_JOCKEY_RESULT_SPEC.md) — **승률/복승률** |
| **나쁜 버릇 제어** | 말이 딴청을 피우거나 안쪽으로 기대는 등 나쁜 버릇 제어 | **통산총출전횟수(경험치)** — rcCntT가 높은 베테랑 기수 유리 |
| **부담 중량** | 기수의 몸무게 + 장구 무게 = 부담 중량. 체중 관리로 말의 짐을 덜어주는 것도 능력 | [출전표](KRA_ENTRY_SHEET_SPEC.md) — wgBudam |

---

## 4. 기수 점수 산출 공식

`한국마사회 기수통산전적비교` API([KRA_JOCKEY_RESULT_SPEC.md](KRA_JOCKEY_RESULT_SPEC.md))를 활용하여 기수 능력을 수치화합니다.

### 4.1 핵심 지표

| API 필드 | 국문명 | 해석 |
|----------|--------|------|
| **winRateTsum** | 승률 | 1등 할 확률 (%) — **결정력** |
| **quRateTsum** | 복승률 | 2등 안에 들어올 확률 (%) — **안정감** |
| **rcCntT** | 통산총출전횟수 | 총 경주 출전 횟수 — **경험치, 위기 대처 능력** |

### 4.2 기수 점수 공식 (제안)

```
jockeyScore = (winRateTsum × 0.4) + (quRateTsum × 0.4) + (experienceScore × 0.2)
```

- **experienceScore**: `rcCntT` 기반 정규화 (예: 100회 미만 = 0.5, 1000회 이상 = 1.0)

### 4.3 신인 기수 감점

- **rcCntT < 100**: 신인 기수 — 감점 요인으로 적용 (예: jockeyScore × 0.9)

---

## 5. 말 vs 기수 가중치 배분 전략

상황에 따라 **말과 기수의 가중치**를 다르게 두는 **동적 알고리즘**을 권장합니다.

| 상황 | 말 가중치 | 기수 가중치 | 설명 |
|------|----------|-------------|------|
| **일반** | 70% | 30% | 말의 기본 기록이 압도적일 때 기수 영향 감소 |
| **혼전 경주** | 50% | 50% | 우승 후보들의 기록 차이가 0.5초 이내 → 기수 기량이 승부 결정 |
| **특수 상황** | 60% | 40% | 비 오는 날, 장거리 등 변수 많을 때 베테랑 기수(경험치) 중요 |

### 5.1 상황 판별 로직 (예시)

```
혼전 경주 판별:
  - 상위 3~5마리의 rcTime(경주기록) 차이가 0.5초 이내 → 혼전

특수 상황 판별:
  - weather != "맑음" 또는 rcDist >= 1800 → 특수 상황
```

---

## 6. 2단계 필터링 플로우

> **"말의 능력이 비슷할 때는 선수가 승부를 결정짓는다"**

### Step 1: 1차 필터링 (말 기준)

| API | 용도 |
|-----|------|
| [경주성적정보](KRA_RACE_RESULT_SPEC.md) | 말의 과거 기록(rcTime, 구간별 기록) 분석 |
| [구간별 성적](KRA_SECTIONAL_RECORD_SPEC.md) | S1F/G3F로 선행마·추입마 분류 |
| [출전마 체중](KRA_HORSE_WEIGHT_SPEC.md) | 체중 증감으로 컨디션 판단 |

→ **우승 후보군 3~5마리** 추출

### Step 2: 2차 필터링 (기수 기준)

| API | 용도 |
|-----|------|
| [기수통산전적비교](KRA_JOCKEY_RESULT_SPEC.md) | 추려진 후보들의 기수 점수(jockeyScore) 산출 |

→ 후보들 중 **jockeyScore가 가장 높은 기수가 탄 말**을 **"AI 강력 추천"**으로 표시

---

## 7. 관련 API 명세 링크

| API | 명세 문서 |
|-----|-----------|
| 출전표 상세정보 | [KRA_ENTRY_SHEET_SPEC.md](KRA_ENTRY_SHEET_SPEC.md) |
| 경주성적정보 | [KRA_RACE_RESULT_SPEC.md](KRA_RACE_RESULT_SPEC.md) |
| 기수통산전적비교 | [KRA_JOCKEY_RESULT_SPEC.md](KRA_JOCKEY_RESULT_SPEC.md) |
| 출전마 체중 정보 | [KRA_HORSE_WEIGHT_SPEC.md](KRA_HORSE_WEIGHT_SPEC.md) |
| 경주 구간별 성적 | [KRA_SECTIONAL_RECORD_SPEC.md](KRA_SECTIONAL_RECORD_SPEC.md) |
| 경주로정보 | [KRA_TRACK_INFO_SPEC.md](KRA_TRACK_INFO_SPEC.md) |
| 말훈련내역 | [KRA_TRAINING_SPEC.md](KRA_TRAINING_SPEC.md) |
| 출전마 장구/폐출혈 | [KRA_EQUIPMENT_BLEEDING_SPEC.md](KRA_EQUIPMENT_BLEEDING_SPEC.md) |
| 경주마 출전취소 | [KRA_HORSE_CANCEL_SPEC.md](KRA_HORSE_CANCEL_SPEC.md) |

---

## 8. Python 분석 로직 예시 (의사코드)

```python
def calculate_jockey_score(jockey: dict) -> float:
    win_rate = float(jockey.get("winRateTsum", 0))
    qu_rate = float(jockey.get("quRateTsum", 0))
    rc_cnt = int(jockey.get("rcCntT", 0))

    exp_score = 1.0 if rc_cnt >= 1000 else (0.5 + rc_cnt / 2000)  # 100회 미만 시 0.55
    if rc_cnt < 100:
        exp_score *= 0.9  # 신인 감점

    return (win_rate * 0.4 + qu_rate * 0.4 + exp_score * 20) / 2  # 스케일 조정

def get_weight_ratio(race: dict, horses: list):
    # 혼전: 상위 5마리 기록 차이 0.5초 이내
    times = sorted([h["rcTime"] for h in horses if h.get("rcTime")])[:5]
    is_close = len(times) >= 2 and (max(times) - min(times)) <= 0.5

    # 특수: 비/장거리
    is_special = race.get("weather") != "맑음" or int(race.get("rcDist", 0)) >= 1800

    if is_close:
        return 0.5, 0.5  # 말 50%, 기수 50%
    if is_special:
        return 0.6, 0.4  # 말 60%, 기수 40%
    return 0.7, 0.3     # 말 70%, 기수 30%
```

---

## 9. 요약

1. **마칠기삼** — 기본적으로 말 7, 기수 3. 단, 비슷한 말들이 겨룰 때는 기수가 승부를 좌우.
2. **기수 점수** — `winRateTsum`, `quRateTsum`, `rcCntT`로 산출. 신인(100회 미만)은 감점.
3. **가중치** — 상황별 70/30, 50/50, 60/40 동적 적용.
4. **2단계 필터링** — 1차: 말 기록으로 후보 3~5마리 추출 → 2차: 기수 점수로 "AI 강력 추천" 선정.
