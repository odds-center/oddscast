"""
Factor Weight Validation Script for OddsCast KRA Horse Racing Analysis

This script connects to the production/local PostgreSQL database and evaluates
how well each of the 16 analysis factors correlates with actual race outcomes.

Usage:
    DATABASE_URL=postgresql://user:pass@host/db python3 validate_weights.py

Output:
    - Console table: ranked factor correlations
    - server/scripts/weight_analysis_results.json: full results

Requirements:
    pip install psycopg2-binary pandas numpy scipy

Methodology:
    1. Load last 6 months of completed races from race_analysis_cache
       (Python sub-scores per horse, stored as JSONB).
    2. Join to race_results to get actual finishing position (ordInt).
    3. For each factor sub-score:
       a. Spearman rank correlation vs ordInt (lower is better → negate ordInt)
       b. Point-biserial correlation with win binary (ordInt == 1)
    4. Rank factors by |correlation| with win outcome.
    5. Suggest new weights proportional to correlation strength.

Notes:
    - race_analysis_cache stores Python results as {'scores': [...], 'cascadeFallRisk': N}
      where each score entry has 'hrNo' and 'sub': {'rat', 'frm', 'cnd', ...}
    - Minimum 50 data points per factor required for meaningful correlation.
    - Weights are suggested, not automatically applied. Review before changing analysis.py.
"""

import os
import sys
import json
import math
from datetime import datetime, timedelta

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

try:
    import pandas as pd
    import numpy as np
    from scipy import stats
except ImportError:
    print("ERROR: pandas/numpy/scipy not installed. Run: pip install pandas numpy scipy", file=sys.stderr)
    sys.exit(1)


# ─── Configuration ───

# Factor shorthand keys (from Python analysis.py 'sub' dict) → display names
FACTOR_MAP = {
    'rat':  'rating',
    'frm':  'form',
    'cnd':  'condition',
    'exp':  'experience',
    'suit': 'suitability',
    'trn':  'trainer',
    'jky':  'jockey',
    'rest': 'rest',
    'dist': 'distance',
    'cls':  'class_change',
    'trng': 'training_readiness',
    'sdf':  'same_day_fatigue',
    'gate': 'gate_bias',
    'fsz':  'field_size',
    'pace': 'pace_scenario',
    'tch':  'track_condition_history',
}

# Current weights in analysis.py (W_HORSE dict)
CURRENT_WEIGHTS = {
    'rating':                  0.17,
    'form':                    0.18,
    'condition':               0.07,
    'experience':              0.05,
    'suitability':             0.06,
    'trainer':                 0.06,
    'jockey':                  0.13,
    'rest':                    0.04,
    'distance':                0.05,
    'class_change':            0.05,
    'training_readiness':      0.03,
    'same_day_fatigue':        0.02,
    'gate_bias':               0.05,
    'field_size':              0.02,
    'pace_scenario':           0.02,
    'track_condition_history': 0.00,  # Not yet implemented; weight TBD
}

# Lookback window for analysis
LOOKBACK_DAYS = 180
MIN_DATA_POINTS = 50  # Minimum horse-race observations for reliable correlation


def get_db_connection(database_url: str) -> psycopg2.extensions.connection:
    """Connect to PostgreSQL using DATABASE_URL."""
    return psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)


def load_cache_data(conn: psycopg2.extensions.connection) -> list[dict]:
    """
    Load Python analysis cache entries from the last LOOKBACK_DAYS days.
    Joins race_analysis_cache to race_results to get actual finishing positions.

    Returns a list of dicts, one per horse per race:
      {
        raceId, hrNo, ordInt (actual finish, None=DNF),
        sub: {rat, frm, cnd, exp, suit, trn, jky, rest, dist, cls, trng, sdf, gate, fsz, pace, tch},
        score (composite)
      }
    """
    cutoff = (datetime.now() - timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%d')

    query = """
        SELECT
            rac.id          AS "raceId",
            rac.track       AS "raceTrack",
            rac.rc_date     AS "rcDate",
            cache.result    AS "cacheResult",
            rr.hr_no        AS "hrNo",
            rr.ord_int      AS "ordInt",
            rr.ord_type     AS "ordType"
        FROM oddscast.race_analysis_cache cache
        INNER JOIN oddscast.races rac
            ON rac.id = cache.race_id
        LEFT JOIN oddscast.race_results rr
            ON rr.race_id = cache.race_id
        WHERE cache.analysis_type = 'jockey'
          AND rac.status = 'COMPLETED'
          AND rac.rc_date >= %(cutoff)s
        ORDER BY rac.rc_date DESC, rac.id, rr.ord_int ASC NULLS LAST
    """

    with conn.cursor() as cur:
        cur.execute(query, {'cutoff': cutoff.replace('-', '')})
        rows = cur.fetchall()

    return [dict(r) for r in rows]


def parse_cache_result(cache_result: dict | None) -> dict[str, dict]:
    """
    Parse a race_analysis_cache.result JSON blob.

    Expected structure:
        {
          "entriesWithScores": [
            { "hrNo": "...", "horseScore": N, "jockeyScore": N, "combinedScore": N },
            ...
          ]
        }

    Note: The jockey analysis cache stores entriesWithScores (from analyze_jockey).
    The main calculate_score result (with sub-scores) is NOT currently cached — it is
    generated on demand in the predictions flow. If the cache schema changes to store
    calculate_score output (with 'scores': [{sub: {...}}] structure), this parser will
    use the sub-scores directly.

    Returns: dict keyed by hrNo → {sub: {factor_key: score}, composite_score}
    """
    if not cache_result:
        return {}

    result_map: dict[str, dict] = {}

    # Handle calculate_score output format: {'scores': [{hrNo, sub, score, ...}]}
    if 'scores' in cache_result and isinstance(cache_result.get('scores'), list):
        for entry in cache_result['scores']:
            hr_no = str(entry.get('hrNo') or '')
            if not hr_no:
                continue
            sub = entry.get('sub') or {}
            result_map[hr_no] = {
                'sub': sub,
                'composite': float(entry.get('score') or 0),
            }
        return result_map

    # Handle analyze_jockey output format: {'entriesWithScores': [{hrNo, horseScore, ...}]}
    if 'entriesWithScores' in cache_result:
        for entry in cache_result.get('entriesWithScores') or []:
            hr_no = str(entry.get('hrNo') or '')
            if not hr_no:
                continue
            result_map[hr_no] = {
                'sub': {
                    'jky': float(entry.get('jockeyScore') or 0),
                },
                'composite': float(entry.get('combinedScore') or 0),
            }
        return result_map

    return result_map


def build_dataframe(raw_rows: list[dict]) -> pd.DataFrame:
    """
    Build a flat DataFrame from raw DB rows + parsed cache sub-scores.

    Each row = one horse in one race.
    Columns: raceId, hrNo, ordInt, is_win (bool), composite, rat, frm, cnd, ...
    """
    records = []

    # Group DB rows by raceId → cache result
    cache_by_race: dict[int, dict] = {}
    for row in raw_rows:
        race_id = int(row['raceId'])
        if race_id not in cache_by_race:
            cr = row.get('cacheResult')
            if isinstance(cr, str):
                try:
                    cr = json.loads(cr)
                except (json.JSONDecodeError, TypeError):
                    cr = {}
            cache_by_race[race_id] = parse_cache_result(cr or {})

    for row in raw_rows:
        hr_no = str(row.get('hrNo') or '')
        ord_int = row.get('ordInt')
        ord_type = str(row.get('ordType') or '')
        race_id = int(row['raceId'])

        # Skip DNF (FALL, DQ, WITHDRAWN) — ordInt is null but ordType is set
        if ord_int is None and ord_type in ('FALL', 'DQ', 'WITHDRAWN'):
            continue

        # Skip horses with no finishing position (unresolved)
        if ord_int is None:
            continue

        sub_data = cache_by_race.get(race_id, {}).get(hr_no, {})
        sub = sub_data.get('sub') or {}
        composite = sub_data.get('composite') or 0.0

        record: dict = {
            'raceId': race_id,
            'hrNo': hr_no,
            'ordInt': int(ord_int),
            'is_win': int(ord_int) == 1,
            'composite': float(composite),
        }

        # Add sub-scores for all known factor keys
        for key in FACTOR_MAP:
            record[key] = float(sub.get(key, float('nan')))

        records.append(record)

    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    # Normalize ordInt to a positive score (1st = best): finish_rank_score = -ordInt
    # High score → good finish (makes correlation direction intuitive: positive = better)
    df['rank_score'] = -df['ordInt']
    return df


def compute_correlations(df: pd.DataFrame) -> list[dict]:
    """
    For each factor, compute:
      1. Spearman rho vs rank_score (finish position proxy, higher = better finish)
      2. Point-biserial r vs is_win (binary 1st place outcome)

    Returns list of dicts sorted by |win_pbiserial| descending.
    """
    results = []

    for key, name in FACTOR_MAP.items():
        factor_col = df[key].dropna()
        valid_idx = df[key].notna()
        n = valid_idx.sum()

        if n < MIN_DATA_POINTS:
            results.append({
                'key': key,
                'name': name,
                'n': int(n),
                'spearman_rho': None,
                'spearman_p': None,
                'win_pbiserial': None,
                'win_pbiserial_p': None,
                'current_weight': CURRENT_WEIGHTS.get(name, 0.0),
                'note': f'Insufficient data (n={n}, min={MIN_DATA_POINTS})',
            })
            continue

        sub_df = df[valid_idx]

        # 1. Spearman rank correlation: factor score vs finish-rank proxy
        try:
            rho, p_rho = stats.spearmanr(sub_df[key], sub_df['rank_score'])
        except Exception:
            rho, p_rho = float('nan'), float('nan')

        # 2. Point-biserial: factor score vs binary win (0/1)
        try:
            pbr, p_pbr = stats.pointbiserialr(sub_df['is_win'].astype(float), sub_df[key])
        except Exception:
            pbr, p_pbr = float('nan'), float('nan')

        results.append({
            'key': key,
            'name': name,
            'n': int(n),
            'spearman_rho': round(float(rho), 4) if not math.isnan(rho) else None,
            'spearman_p': round(float(p_rho), 4) if not math.isnan(p_rho) else None,
            'win_pbiserial': round(float(pbr), 4) if not math.isnan(pbr) else None,
            'win_pbiserial_p': round(float(p_pbr), 4) if not math.isnan(p_pbr) else None,
            'current_weight': CURRENT_WEIGHTS.get(name, 0.0),
            'note': '',
        })

    # Sort by absolute win_pbiserial (strongest win predictor first)
    results.sort(
        key=lambda r: abs(r['win_pbiserial']) if r['win_pbiserial'] is not None else 0,
        reverse=True,
    )
    return results


def suggest_weights(correlations: list[dict]) -> dict[str, float]:
    """
    Suggest new W_HORSE weights proportional to absolute point-biserial correlation
    with win outcome. Factors without data retain their current weight.

    Total sum is normalized to 1.0. Minimum weight: 0.01 per factor.
    """
    # Extract valid correlations
    valid = [r for r in correlations if r['win_pbiserial'] is not None]
    missing = [r for r in correlations if r['win_pbiserial'] is None]

    if not valid:
        return CURRENT_WEIGHTS.copy()

    # Use absolute correlation as raw importance
    total_corr = sum(abs(r['win_pbiserial']) for r in valid)
    if total_corr == 0:
        return CURRENT_WEIGHTS.copy()

    # Allocate weights for factors with correlation data
    n_factors = len(FACTOR_MAP)
    weight_for_validated = 1.0 - (len(missing) * 0.01)  # Reserve 0.01 each for missing
    weight_for_validated = max(0.5, weight_for_validated)  # At least 50% to validated

    suggested: dict[str, float] = {}
    for r in valid:
        raw_w = abs(r['win_pbiserial']) / total_corr * weight_for_validated
        suggested[r['name']] = max(0.01, round(raw_w, 3))

    # Give missing factors a minimal weight (data gap, not zero importance)
    for r in missing:
        suggested[r['name']] = 0.01

    # Normalize to sum = 1.0
    total = sum(suggested.values())
    if total > 0:
        suggested = {k: round(v / total, 4) for k, v in suggested.items()}

    # Final renorm pass to handle rounding
    residual = 1.0 - sum(suggested.values())
    if abs(residual) > 0.0001:
        # Add residual to highest-weighted factor
        top = max(suggested, key=lambda k: suggested[k])
        suggested[top] = round(suggested[top] + residual, 4)

    return suggested


def print_table(correlations: list[dict], suggested: dict[str, float]) -> None:
    """Print a formatted ASCII table of factor correlations and suggested weights."""
    header = (
        f"{'Factor':<26} {'N':>6} {'Spearman ρ':>11} {'p':>7} "
        f"{'Win r_pb':>10} {'p':>7} {'CurW':>6} {'SugW':>6}  Note"
    )
    print("\n" + "=" * 95)
    print("FACTOR WEIGHT VALIDATION RESULTS")
    print(f"Lookback: last {LOOKBACK_DAYS} days | Min observations: {MIN_DATA_POINTS}")
    print("=" * 95)
    print(header)
    print("-" * 95)

    for r in correlations:
        rho_str = f"{r['spearman_rho']:>+.4f}" if r['spearman_rho'] is not None else "     N/A"
        p_rho_str = f"{r['spearman_p']:.4f}" if r['spearman_p'] is not None else "    N/A"
        pbr_str = f"{r['win_pbiserial']:>+.4f}" if r['win_pbiserial'] is not None else "     N/A"
        p_pbr_str = f"{r['win_pbiserial_p']:.4f}" if r['win_pbiserial_p'] is not None else "    N/A"
        cur_w = f"{r['current_weight']:.4f}"
        sug_w = f"{suggested.get(r['name'], 0.0):.4f}"
        note = r.get('note', '')

        print(
            f"{r['name']:<26} {r['n']:>6} {rho_str:>11} {p_rho_str:>7} "
            f"{pbr_str:>10} {p_pbr_str:>7} {cur_w:>6} {sug_w:>6}  {note}"
        )

    print("-" * 95)
    print("\nLegend:")
    print("  Spearman ρ  = correlation with finish rank (positive = higher score → better finish)")
    print("  Win r_pb    = point-biserial correlation with win (1st place) binary outcome")
    print("  CurW        = current weight in W_HORSE (analysis.py)")
    print("  SugW        = suggested weight proportional to |Win r_pb|")
    print("\nNote: Suggested weights require manual review before applying.")
    print("      Factors with N/A have insufficient data and retain 0.01 placeholder.\n")


def save_results(
    correlations: list[dict],
    suggested: dict[str, float],
    output_path: str,
    total_races: int,
    total_observations: int,
) -> None:
    """Save full results to JSON file."""
    output = {
        'generated_at': datetime.now().isoformat(),
        'lookback_days': LOOKBACK_DAYS,
        'min_data_points': MIN_DATA_POINTS,
        'total_races_analyzed': total_races,
        'total_horse_observations': total_observations,
        'correlations': correlations,
        'suggested_weights': suggested,
        'current_weights': CURRENT_WEIGHTS,
        'weight_diff': {
            name: round(suggested.get(name, 0.0) - CURRENT_WEIGHTS.get(name, 0.0), 4)
            for name in set(list(suggested.keys()) + list(CURRENT_WEIGHTS.keys()))
        },
        'instructions': (
            "To apply suggested weights: update W_HORSE dict in server/scripts/analysis.py. "
            "Ensure all weights sum to 1.0. Run walk-forward validation before production deployment."
        ),
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Results saved to: {output_path}")


def main() -> None:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.", file=sys.stderr)
        print("Usage: DATABASE_URL=postgresql://... python3 validate_weights.py", file=sys.stderr)
        sys.exit(1)

    # Resolve output path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'weight_analysis_results.json')

    print(f"Connecting to database...")
    try:
        conn = get_db_connection(database_url)
    except Exception as e:
        print(f"ERROR: Could not connect to database: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        print(f"Loading race analysis cache data (last {LOOKBACK_DAYS} days)...")
        raw_rows = load_cache_data(conn)
        print(f"  Loaded {len(raw_rows)} raw DB rows.")

        if not raw_rows:
            print("WARNING: No data found. Check that race_analysis_cache is populated.")
            print("  Run KRA sync + AI prediction generation to populate the cache.")
            conn.close()
            sys.exit(0)

        print("Building analysis DataFrame...")
        df = build_dataframe(raw_rows)

        if df.empty:
            print("WARNING: DataFrame is empty after processing. No valid horse-race pairs found.")
            conn.close()
            sys.exit(0)

        total_races = df['raceId'].nunique()
        total_obs = len(df)
        print(f"  {total_races} unique races, {total_obs} horse-race observations.")

        # Check if sub-scores are available (only from calculate_score cache, not jockey cache)
        has_sub_scores = any(df[key].notna().sum() >= MIN_DATA_POINTS for key in FACTOR_MAP if key != 'tch')
        if not has_sub_scores:
            print(
                "\nWARNING: No factor sub-scores found in the cache.\n"
                "  The current cache stores analyze_jockey results, not calculate_score sub-scores.\n"
                "  To enable full validation, update AnalysisService.analyzeJockey() to also\n"
                "  store calculate_score sub-scores in race_analysis_cache (analysisType='scores').\n"
                "  Only jockey factor (jky) can be validated with the current cache structure.\n"
            )

        print("Computing factor correlations...")
        correlations = compute_correlations(df)

        print("Generating suggested weights...")
        suggested = suggest_weights(correlations)

        print_table(correlations, suggested)

        save_results(correlations, suggested, output_path, total_races, total_obs)

    finally:
        conn.close()


if __name__ == '__main__':
    main()
