-- ================================================================
-- OddsCast Prediction Accuracy Analysis Queries
-- Run against production DB to analyze AI prediction quality
-- ================================================================

SET search_path TO oddscast;

-- ----------------------------------------------------------------
-- 1. Overall accuracy summary
-- ----------------------------------------------------------------
SELECT
  COUNT(*) AS total_predictions,
  COUNT(accuracy) AS scored_predictions,
  ROUND(AVG(accuracy)::numeric, 2) AS avg_accuracy,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY accuracy)::numeric, 2) AS median_accuracy,
  SUM(CASE WHEN accuracy = 100 THEN 1 ELSE 0 END) AS perfect_3_of_3,
  SUM(CASE WHEN accuracy >= 66.67 THEN 1 ELSE 0 END) AS at_least_2_of_3,
  SUM(CASE WHEN accuracy >= 33.33 THEN 1 ELSE 0 END) AS at_least_1_of_3,
  SUM(CASE WHEN accuracy = 0 THEN 1 ELSE 0 END) AS zero_accuracy
FROM predictions
WHERE status = 'COMPLETED' AND accuracy IS NOT NULL;

-- ----------------------------------------------------------------
-- 2. Accuracy by meet (Seoul / Busan / Jeju)
-- ----------------------------------------------------------------
SELECT
  r.meet,
  COUNT(*) AS total,
  ROUND(AVG(p.accuracy)::numeric, 2) AS avg_accuracy,
  SUM(CASE WHEN p.accuracy >= 33.33 THEN 1 ELSE 0 END) AS hit_1plus,
  SUM(CASE WHEN p.accuracy = 100 THEN 1 ELSE 0 END) AS perfect
FROM predictions p
JOIN races r ON r.id = p."raceId"
WHERE p.status = 'COMPLETED' AND p.accuracy IS NOT NULL
GROUP BY r.meet
ORDER BY avg_accuracy DESC;

-- ----------------------------------------------------------------
-- 3. Accuracy by month (trend analysis)
-- ----------------------------------------------------------------
SELECT
  TO_CHAR(p."createdAt", 'YYYY-MM') AS month,
  COUNT(*) AS total,
  ROUND(AVG(p.accuracy)::numeric, 2) AS avg_accuracy,
  SUM(CASE WHEN p.accuracy >= 33.33 THEN 1 ELSE 0 END) AS hit_1plus,
  SUM(CASE WHEN p.accuracy = 100 THEN 1 ELSE 0 END) AS perfect
FROM predictions p
WHERE p.status = 'COMPLETED' AND p.accuracy IS NOT NULL
GROUP BY month
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- 4. Accuracy by distance bracket
-- ----------------------------------------------------------------
SELECT
  CASE
    WHEN r."rcDist"::int <= 1200 THEN 'Sprint (≤1200m)'
    WHEN r."rcDist"::int <= 1400 THEN 'Short (1300-1400m)'
    WHEN r."rcDist"::int <= 1600 THEN 'Mile (1500-1600m)'
    WHEN r."rcDist"::int <= 1800 THEN 'Middle (1700-1800m)'
    ELSE 'Long (1900m+)'
  END AS distance_bracket,
  COUNT(*) AS total,
  ROUND(AVG(p.accuracy)::numeric, 2) AS avg_accuracy
FROM predictions p
JOIN races r ON r.id = p."raceId"
WHERE p.status = 'COMPLETED' AND p.accuracy IS NOT NULL AND r."rcDist" IS NOT NULL
GROUP BY distance_bracket
ORDER BY avg_accuracy DESC;

-- ----------------------------------------------------------------
-- 5. Accuracy by race class (rank)
-- ----------------------------------------------------------------
SELECT
  r.rank AS race_class,
  COUNT(*) AS total,
  ROUND(AVG(p.accuracy)::numeric, 2) AS avg_accuracy
FROM predictions p
JOIN races r ON r.id = p."raceId"
WHERE p.status = 'COMPLETED' AND p.accuracy IS NOT NULL AND r.rank IS NOT NULL
GROUP BY r.rank
ORDER BY avg_accuracy DESC;

-- ----------------------------------------------------------------
-- 6. Per-horse predicted vs actual comparison (detailed)
-- ----------------------------------------------------------------
SELECT
  p."raceId",
  r.meet,
  r."rcDate",
  r."rcNo",
  hs.ordinality AS pred_rank,
  hs.value ->> 'hrNo' AS pred_hrNo,
  hs.value ->> 'hrName' AS pred_hrName,
  (hs.value ->> 'score')::float AS pred_score,
  (hs.value ->> 'winProb')::float AS pred_win_prob,
  rr."ordInt" AS actual_finish,
  rr."winOdds" AS actual_odds,
  CASE WHEN rr."ordInt" <= 3 THEN 'HIT' ELSE 'MISS' END AS hit_status
FROM predictions p
JOIN races r ON r.id = p."raceId"
CROSS JOIN LATERAL jsonb_array_elements(p.scores -> 'horseScores')
  WITH ORDINALITY AS hs(value, ordinality)
LEFT JOIN race_results rr
  ON rr."raceId" = p."raceId"
  AND rr."hrNo" = hs.value ->> 'hrNo'
WHERE p.status = 'COMPLETED'
  AND hs.ordinality <= 3  -- only top-3 predicted
ORDER BY p."raceId" DESC, hs.ordinality;

-- ----------------------------------------------------------------
-- 7. Win probability calibration (Brier score proxy)
--    Groups predicted winProb into buckets and compares to actual win rate
-- ----------------------------------------------------------------
SELECT
  CASE
    WHEN (hs.value ->> 'winProb')::float >= 40 THEN '40%+'
    WHEN (hs.value ->> 'winProb')::float >= 30 THEN '30-39%'
    WHEN (hs.value ->> 'winProb')::float >= 20 THEN '20-29%'
    WHEN (hs.value ->> 'winProb')::float >= 10 THEN '10-19%'
    ELSE '<10%'
  END AS prob_bucket,
  COUNT(*) AS total_horses,
  SUM(CASE WHEN rr."ordInt" = 1 THEN 1 ELSE 0 END) AS actual_wins,
  ROUND(
    (SUM(CASE WHEN rr."ordInt" = 1 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS actual_win_rate_pct,
  ROUND(AVG((hs.value ->> 'winProb')::float)::numeric, 2) AS avg_predicted_prob
FROM predictions p
CROSS JOIN LATERAL jsonb_array_elements(p.scores -> 'horseScores')
  WITH ORDINALITY AS hs(value, ordinality)
LEFT JOIN race_results rr
  ON rr."raceId" = p."raceId"
  AND rr."hrNo" = hs.value ->> 'hrNo'
WHERE p.status = 'COMPLETED'
  AND p.accuracy IS NOT NULL
  AND hs.value ->> 'winProb' IS NOT NULL
GROUP BY prob_bucket
ORDER BY avg_predicted_prob DESC;

-- ----------------------------------------------------------------
-- 8. Sub-score correlation with 1st place finish
--    Which scoring factor best predicts the actual winner?
-- ----------------------------------------------------------------
SELECT
  'rating' AS factor,
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'rat')::float END)::numeric, 2) AS avg_winner,
  ROUND(AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'rat')::float END)::numeric, 2) AS avg_non_placer,
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'rat')::float END)::numeric -
        AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'rat')::float END)::numeric, 2) AS gap
FROM predictions p
CROSS JOIN LATERAL jsonb_array_elements(p.scores -> 'horseScores') AS hs(value)
LEFT JOIN race_results rr ON rr."raceId" = p."raceId" AND rr."hrNo" = hs.value ->> 'hrNo'
WHERE p.status = 'COMPLETED' AND p.scores -> 'horseScores' IS NOT NULL
  AND hs.value -> 'sub' IS NOT NULL

UNION ALL SELECT 'form',
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'frm')::float END)::numeric, 2),
  ROUND(AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'frm')::float END)::numeric, 2),
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'frm')::float END)::numeric -
        AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'frm')::float END)::numeric, 2)
FROM predictions p
CROSS JOIN LATERAL jsonb_array_elements(p.scores -> 'horseScores') AS hs(value)
LEFT JOIN race_results rr ON rr."raceId" = p."raceId" AND rr."hrNo" = hs.value ->> 'hrNo'
WHERE p.status = 'COMPLETED' AND hs.value -> 'sub' IS NOT NULL

UNION ALL SELECT 'jockey',
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'jky')::float END)::numeric, 2),
  ROUND(AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'jky')::float END)::numeric, 2),
  ROUND(AVG(CASE WHEN rr."ordInt" = 1 THEN (hs.value -> 'sub' ->> 'jky')::float END)::numeric -
        AVG(CASE WHEN rr."ordInt" > 3 OR rr."ordInt" IS NULL THEN (hs.value -> 'sub' ->> 'jky')::float END)::numeric, 2)
FROM predictions p
CROSS JOIN LATERAL jsonb_array_elements(p.scores -> 'horseScores') AS hs(value)
LEFT JOIN race_results rr ON rr."raceId" = p."raceId" AND rr."hrNo" = hs.value ->> 'hrNo'
WHERE p.status = 'COMPLETED' AND hs.value -> 'sub' IS NOT NULL

ORDER BY gap DESC NULLS LAST;

-- ----------------------------------------------------------------
-- 9. Exact 1st place hit rate (stricter metric)
-- ----------------------------------------------------------------
SELECT
  COUNT(*) AS total_predictions,
  SUM(CASE
    WHEN (
      SELECT rr."hrNo" FROM race_results rr
      WHERE rr."raceId" = p."raceId" AND rr."ordInt" = 1
      LIMIT 1
    ) = (p.scores -> 'horseScores' -> 0 ->> 'hrNo')
    THEN 1 ELSE 0
  END) AS exact_1st_hits,
  ROUND(
    SUM(CASE
      WHEN (
        SELECT rr."hrNo" FROM race_results rr
        WHERE rr."raceId" = p."raceId" AND rr."ordInt" = 1
        LIMIT 1
      ) = (p.scores -> 'horseScores' -> 0 ->> 'hrNo')
      THEN 1 ELSE 0
    END)::numeric / NULLIF(COUNT(*), 0) * 100, 2
  ) AS exact_1st_rate_pct
FROM predictions p
WHERE p.status = 'COMPLETED' AND p.accuracy IS NOT NULL;
