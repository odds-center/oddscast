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
| **점수에 배당 반영** | `constructPrompt`에서 해당 경주에 대한 `RaceResult.winOdds`가 있으면, 말별 finalScore를 **모델 점수 80% + 배당 암시확률 20%** 로 블렌딩. 배당 없는 말은 원점수 유지. |
| **배당 소스** | `loadRaceWithEntries`에서 해당 `raceId`의 `race_results`를 조회해 `winOdds`로 `oddsByHrNo` 구성 후 전달. (경주 전 예측 시에는 결과가 없어 배당 미반영.) |
| **승식 파생** | `deriveBetTypePredictionsFromHorseScores`: **score 기준 정렬**만 사용. 추천 순서는 점수(이미 배당이 반영된 경우 그 점수) 기준. |

---

## 3. 개선 여지

- **실시간(예상) 배당**: 경주 전 예상 배당 API 연동 시, `oddsByHrNo`에 실시간 배당을 넣어 주면 예측 생성 시점에도 점수에 배당이 반영됨.
- **가중치(ODDS_WEIGHT)**: 현재 0.2(20%). 설정/실험으로 조정 가능.
- **결과(확정) 배당**: 경주 종료 후 예측 재계산·검증 시 결과 테이블의 winOdds가 있으면 자동으로 점수에 반영됨.

---

## 4. 참조

- **승식 정의·적중 판정**: [POINT_PICK_SYSTEM.md](POINT_PICK_SYSTEM.md)
- **예측 파이프라인·scores 구조**: [BUSINESS_LOGIC.md](../architecture/BUSINESS_LOGIC.md) §1
- **승률·점수 산출**: [ANALYSIS_SPEC.md](../specs/ANALYSIS_SPEC.md)
- **확정배당 API**: [KRA_ODDS_SPEC.md](../specs/KRA_ODDS_SPEC.md)
- **경주 상세·배당 UI**: [RACE_DETAIL_UI_SPEC.md](RACE_DETAIL_UI_SPEC.md)
