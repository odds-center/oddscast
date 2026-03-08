# 승식별 예측·배당 연동 (Bet Type & Odds Alignment)

> **배당률을 "추천 대상"이 아니라 "점수 반영"에 사용**하는 원칙. 예측 점수가 배당 정보를 일부 반영해 해석이 쉽도록 함.
> 참조: [POINT_PICK_SYSTEM.md](POINT_PICK_SYSTEM.md), [ANALYSIS_SPEC.md](../specs/ANALYSIS_SPEC.md), [KRA_ODDS_SPEC.md](../specs/KRA_ODDS_SPEC.md)

---

## 1. 원칙

- **배당률에 따라 점수를 반영**: 어떤 말을 추천할지는 기존 점수/모델 기준 유지. 다만 **점수(finalScore / 승률)** 계산 시 배당이 있으면 시장(배당) 암시확률을 일부 반영해, 예측이 배당과 어긋나지 않게 함.
- **추천은 배당으로 바꾸지 않음**: "저배당 말을 추천해라"가 아니라, "점수에 배당을 반영해라"에 해당.

---

## 2. 현재 구현 (서버)

| 항목 | 설명 |
|------|------|
| **배당 소스** | `loadRaceWithEntries`에서 해당 `raceId`의 `race_results.winOdds`를 조회해 `oddsByHrNo` 구성. 경주 전 예측 시에는 결과가 없어 배당 미반영(빈 맵). |
| **DB 저장 반영** | `applyOddsBlendToHorseScores()`: Python 결과(`horseScoreResult`)에 기수 가중치(wH/wJ) 조합 후, `oddsByHrNo`가 있으면 **모델 80% + 배당 암시확률 20%** 블렌딩 → softmax winProb 재계산. `analysisData.horseScoreResult.winProb`에 저장. `oddsImplied`(%) 필드도 함께 저장. |
| **Gemini 컨텍스트 반영** | `constructPrompt()`: 동일한 80/20 블렌딩으로 `fs`(finalScore), `wp`(winProb)를 계산해 프롬프트에 전달. `applyOddsBlendToHorseScores()` 이후에 호출되므로 patched 결과를 입력으로 받음. |
| **ODDS_WEIGHT** | 0.2 (20%). `predictions.service.ts`에 상수로 정의. |
| **배당 없는 말** | `oddsByHrNo`에 없으면 원점수(모델만) 유지. |
| **승식 파생** | `deriveBetTypePredictionsFromHorseScores`: score 기준 정렬. 배당 블렌딩된 점수 기준으로 추천 순서 결정. |

---

## 3. 개선 여지

- **실시간(예상) 배당**: 경주 전 예상 배당 API 연동 시, `oddsByHrNo`에 실시간 배당을 넣어 주면 경주 전 예측에도 배당이 반영됨. KRA는 현재 확정배당(API160)만 제공 — 예상배당 API 없음.
- **가중치(ODDS_WEIGHT)**: 현재 0.2(20%). `GlobalConfig` 연동 시 Admin에서 실시간 조정 가능.
- **결과(확정) 배당**: 경주 종료 후 예측 재생성 시 결과 테이블의 winOdds가 있으면 자동으로 반영됨.

---

## 4. 참조

- **승식 정의·적중 판정**: [POINT_PICK_SYSTEM.md](POINT_PICK_SYSTEM.md)
- **예측 파이프라인·scores 구조**: [BUSINESS_LOGIC.md](../architecture/BUSINESS_LOGIC.md) §1
- **승률·점수 산출**: [ANALYSIS_SPEC.md](../specs/ANALYSIS_SPEC.md)
- **확정배당 API**: [KRA_ODDS_SPEC.md](../specs/KRA_ODDS_SPEC.md)
- **경주 상세·배당 UI**: [RACE_DETAIL_UI_SPEC.md](RACE_DETAIL_UI_SPEC.md)
