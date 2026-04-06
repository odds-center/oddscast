# Horse Racing Analysis Factors

> **Last updated:** 2026-04-06 (v5: added track_condition_history factor)
> **Source file:** `server/scripts/analysis.py` (W_HORSE dict)
> **Validation script:** `server/scripts/validate_weights.py`

This document describes all 16 factors used in OddsCast's Python-based horse analysis engine.
Each factor is normalized to 0–100 before applying the weighted sum. The final composite score
drives both the ranking and Gemini prompt context.

---

## Factor Summary Table

| # | Key  | Factor Name               | Weight | Description                                          | Data Source                            | Win Correlation |
|---|------|---------------------------|--------|------------------------------------------------------|----------------------------------------|-----------------|
| 1 | rat  | rating                    | 0.17   | KRA official rating (sigmoid relative + log absolute blend) | race_entries.rating / ratingHistory | TBD             |
| 2 | frm  | form                      | 0.18   | Recent 5-race finish positions (weighted avg) + momentum trend + rating trend | race_results.ordInt / race_entries.recentRanks | TBD |
| 3 | cnd  | condition                 | 0.06   | Horse weight delta + age + burden weight + sex adjustment | race_entries.horseWeight, age, wgBudam, sex | TBD |
| 4 | exp  | experience                | 0.04   | Total starts (log scale) + career win rate          | race_entries.rcCntT, ord1CntT          | TBD             |
| 5 | suit | suitability               | 0.05   | Running style (front/closer) × distance × track state fit | race_entries.sectionalStats (sectionalTag) | TBD |
| 6 | trn  | trainer                   | 0.06   | Trainer career win rate + place rate at this venue  | trainer_results.winRateTsum, quRateTsum | TBD           |
| 7 | jky  | jockey                    | 0.13   | Meet-specific jockey win/place rate (career fallback if no meet data) | jockey_results.winRateTsum, quRateTsum | TBD |
| 8 | rest | rest                      | 0.04   | Days since last race (optimal window: 21–42 days)   | race_results.rcDate (computed)         | TBD             |
| 9 | dist | distance                  | 0.05   | Historical win/place rate at current race distance bracket | race_results (filtered by distance) | TBD           |
|10 | cls  | class_change              | 0.05   | Grade change direction: down=advantage, up=disadvantage | race_entries.grade / race_results.rcGrade | TBD      |
|11 | trng | training_readiness        | 0.03   | Training session count, intensity ratio, recency (days before race) | trainings table                  | TBD             |
|12 | sdf  | same_day_fatigue          | 0.02   | Number of races already run today (multi-race fatigue) | race_results.rcDate + meet filter   | TBD             |
|13 | gate | gate_bias                 | 0.05   | Starting gate position bias (inner advantage at short tracks / sprint distances) | race_entries.chulNo + meet + distance | TBD |
|14 | fsz  | field_size                | 0.02   | Field size impact: small fields favor class, large fields add chaos | Computed from entry count         | TBD             |
|15 | pace | pace_scenario             | 0.02   | Front-runner count ratio → predicts overpace (helps closers) or control pace (helps leaders) | race_entries.sectionalTag     | TBD |
|16 | tch  | track_condition_history   | 0.03   | Per-horse win/place rate on current track condition (wet vs dry) | race_results JOIN races (rcTrackCondition, track) | TBD |

**W_HORSE sum: 1.00** (verified)

Win Correlation column = point-biserial r vs is_win. Run `validate_weights.py` to populate.

---

## Factor Weights History

| Version | Change Summary |
|---------|---------------|
| v1      | Initial 6 factors (rating, form, condition, experience, trainer, suitability) |
| v2      | Added jockey (meet-specific), rest, distance, class_change |
| v3      | Added training_readiness (0.03), same_day_fatigue (0.02) |
| v4      | Added gate_bias (0.05), field_size (0.02), pace_scenario (0.02). Rebalanced: form 0.20→0.18, condition 0.09→0.07, jockey 0.11→0.13, class_change 0.03→0.05 |
| **v5**  | **Added track_condition_history (0.03). Rebalanced: condition 0.07→0.06, suitability 0.06→0.05, experience 0.05→0.04** |

---

## Factor Details

### 1. rating (rat) — Weight: 0.17

KRA's official performance rating. Blends sigmoid relative comparison within the field
(55% weight) with a log-absolute bracket (45% weight) to capture both field-relative
strength and absolute class level.

- **Range:** 0–100
- **High score:** Horse has the highest rating in the field and an absolute rating above ~80
- **Default (no data):** 25.0 (significant disadvantage)
- **Key fields:** `race_entries.rating`, `race_entries.ratingHistory`

---

### 2. form (frm) — Weight: 0.18

Recent form across the last 5 races. Recency-weighted (most recent race = 40% weight).
Adds a momentum bonus (+8 max) if recent finishes improved vs prior races, and a rating
trend bonus/penalty based on ratingHistory delta.

- **High score:** Won or placed in recent 2–3 races, improving trajectory
- **Default (no data):** 45.0
- **Key fields:** `race_entries.recentRanks`, computed from `race_results.ordInt`

---

### 3. condition (cnd) — Weight: 0.06

Physical condition proxy:
- Horse weight delta from last race (`horseWeight` format: `"480(+2)"`)
- Age bracket: 4–5 year olds peak, 7+ penalized
- Burden weight vs 55kg baseline
- Gelding bonus (+3)

- **High score:** Stable weight (±2kg), optimal age (4), light burden weight
- **Key fields:** `race_entries.horseWeight`, `age`, `wgBudam`, `sex`

---

### 4. experience (exp) — Weight: 0.04

Career experience using log-scale starts count (plateau at ~50 starts) plus career win
rate bucketed into tiers. Horses with fewer than 10 starts get a 40% confidence discount.

- **High score:** Veteran with 30+ starts and ≥15% career win rate
- **Key fields:** `race_entries.rcCntT`, `ord1CntT`

---

### 5. suitability (suit) — Weight: 0.05

Running style × race distance × track state compatibility:
- Front-runner (선행): advantage at ≤1200m, penalty at ≥1800m
- Closer (추입): advantage at ≥1800m, penalty at ≤1200m
- Wet track (습/불/중): front-runners lose 8pts, closers gain 5pts

- **Key fields:** Computed `sectionalTag` from `race_entries.sectionalStats`

---

### 6. trainer (trn) — Weight: 0.06

Trainer performance at the current meet using `trainer_results`. Win rate contributes up
to 35pts, place rate up to 25pts. Falls back to career-wide aggregate if no meet-specific
row exists.

- **Key fields:** `trainer_results.winRateTsum`, `quRateTsum` (via `trainerWinRate`, `trainerQuRate` in entry)

---

### 7. jockey (jky) — Weight: 0.13

Jockey performance — **highest single predictor weight** after rating+form. Uses
meet-specific win/place rate (primary) with a 10% discount applied when only career-wide
aggregate is available. Rookie discount (85%) for <100 meets at venue.

- **Key fields:** `jockey_results.winRateTsum`, `quRateTsum`, `rcCntT` (via entry enrichment)

---

### 8. rest (rest) — Weight: 0.04

Days since last race:
- 21–42 days: optimal (75pts)
- 14–21 or 43–60: acceptable (60pts)
- 7–14: fatigue risk (35pts)
- <7: very fatigued (25pts)
- >90: rustiness (20pts)

- **Key fields:** Computed from `race_results.rcDate` vs current `race.rcDate`

---

### 9. distance (dist) — Weight: 0.05

Historical performance at the current race distance bracket (e.g. 1200–1400m, 1600m+).
Win rate contributes up to 50pts, place rate up to 50pts. Confidence-adjusted for <5 starts.

- **Key fields:** Computed from `race_results` filtered by distance bracket (via `distWinRate`, `distPlaceRate`, `distRaceCount` enrichment)

---

### 10. class_change (cls) — Weight: 0.05

Grade change from most recent race:
- Drop 2+ levels: 75pts (big advantage)
- Drop 1 level: 65pts
- Same grade: 50pts (neutral)
- Rise 1 level: 35pts
- Rise 2+ levels: 25pts (big disadvantage)

- **Key fields:** `race_entries.grade` vs prior `race_results.rcGrade` (via `classChange`, `classChangeLevel` enrichment)

---

### 11. training_readiness (trng) — Weight: 0.03

Structured training metrics from the `trainings` table:
- Session count in last 14 days (optimal: 3–6)
- High-intensity session ratio (optimal: 0.3–0.6)
- Days since last training (optimal: 2–5 days = taper)

- **Key fields:** `trainings` table (via `trainingMetrics` enrichment)

---

### 12. same_day_fatigue (sdf) — Weight: 0.02

Penalty for horses that have already raced earlier on the same card:
- 1st race of day: 50pts (neutral)
- 2nd race: 30pts
- 3rd race: 20pts
- 4th+ race: 10pts
- Partial recovery bonus for longer gaps between races

- **Key fields:** Computed count of same-day, same-meet results (via `sameDayRacesBefore` enrichment)

---

### 13. gate_bias (gate) — Weight: 0.05

Starting gate position bias by venue:
- Busan/Jeju (tight tracks): inner gates 1–3 get +18pts
- Seoul sprint (<1300m): inner gates +12pts
- Seoul middle/long: inner gates +6pts
- Outer gates (10+): progressive penalty, worse in larger fields

- **Key fields:** `race_entries.chulNo`, `race.meet`, `race.rcDist`

---

### 14. field_size (fsz) — Weight: 0.02

Field size context:
- Small (≤6): top-rated horses dominate (+15 if rating ≥85% of field max)
- Large (≥12): chaos effect (-8 general), only proven winners (+10) cope
- Front-runners penalized in very large fields (traffic)

- **Key fields:** Computed from `len(entries)` + `race_entries.rating`

---

### 15. pace_scenario (pace) — Weight: 0.02

Front-runner density prediction:
- Few front-runners (≤2): they control pace → front-runners benefit (+15)
- Many front-runners (≥4): overpace likely → closers benefit (+15)
- Long distance (≥1600m): overpace penalty amplified

- **Key fields:** Computed from `sectionalTag` distribution across all entries

---

### 16. track_condition_history (tch) — Weight: 0.03 *(added v5)*

Per-horse historical win/place rate broken down by track condition (wet vs dry).
Captures horses that consistently outperform on off-track surfaces, independent of
their running style (which is already captured by `suitability`).

**Track condition classification:**
- Wet: 불(불량), 습(습윤), 중(중간) — off-track surfaces
- Dry: 양호(firm/good) — standard surface

**Scoring logic:**
1. Primary: exact current condition match (win rate × 2.0 + place rate × 0.5, capped)
2. Fallback: wet aggregate (if current is wet) or dry aggregate (if current is dry)
3. Confidence adjustment: <5 starts → 55% score + 45% neutral regression
4. Minimum 3 starts required; neutral 50 returned if no qualifying data

- **Key fields:** `race_results.rcTrackCondition` (or `races.track` fallback), `ordInt`
- **Data populated by:** `enrichEntriesWithTrackConditionHistory()` in `predictions.service.ts`
- **Input to Python:** `entry.trackConditionHistory` dict

---

## Running the Validation Script

### Prerequisites

```bash
pip install psycopg2-binary pandas numpy scipy
```

### Execution

```bash
# From repo root
cd server/scripts
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=oddscast \
  python3 validate_weights.py
```

### Output

- Console table with Spearman ρ and point-biserial r for each factor
- `server/scripts/weight_analysis_results.json` with full results + suggested weights

### Interpreting Results

| Metric | Meaning |
|--------|---------|
| Spearman ρ | Correlation between factor score and finish rank (positive = higher score → better finish) |
| Win r_pb | Point-biserial correlation between factor score and win (1st place) binary |
| CurW | Current weight in `W_HORSE` |
| SugW | Suggested weight proportional to \|Win r_pb\| |

**Important:** Suggested weights require manual review before applying. Consider:
1. Statistical significance (p-value < 0.05 recommended)
2. Sample size (N ≥ 50 per factor minimum; ≥ 500 preferred)
3. Domain logic — a low correlation may reflect data sparsity, not low importance
4. Walk-forward validation: train on past 6 months, evaluate on most recent month

### Current Limitation

The `race_analysis_cache` table currently stores `analyze_jockey` results (from
`AnalysisService.analyzeJockey`), which contains `entriesWithScores` with `jockeyScore` /
`horseScore` / `combinedScore` but **not** the 16 individual sub-scores from `calculate_score`.

To enable full 16-factor validation, update `predictions.service.ts` to also save a
`'scores'` cache entry (analysisType = `'scores'`) containing the raw Python
`calculate_score` output for each race. This would allow `validate_weights.py` to extract
all `sub` keys (rat, frm, cnd, ..., tch) for correlation analysis.

---

## Applying Updated Weights

1. Run `validate_weights.py` and review `weight_analysis_results.json`
2. Update `W_HORSE` dict in `server/scripts/analysis.py`
3. Verify `sum(W_HORSE.values()) == 1.0` (Python assertion can be added to the script)
4. Update the weight column in this document
5. Rebuild and test predictions via admin panel AI generation
6. Monitor prediction accuracy in admin `/predictions` dashboard

---

## LightGBM Blend (Optional)

When `server/scripts/model.pkl` exists, the composite score is blended:

```
final_score = rule_score × 0.60 + model_score × 0.40
```

The model is trained on the same 16 sub-scores and captures non-linear interactions
(e.g. high rating + bad form vs low rating + great form). The model is NOT included in
the repository and must be trained separately using historical data.

Feature key order for the model: `["rat", "frm", "cnd", "exp", "suit", "trn", "jky", "rest", "dist", "cls", "trng", "sdf", "gate", "fsz", "pace", "tch"]`
