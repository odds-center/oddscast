"""
Train LightGBM win-prediction model on historical OddsCast race data.

Features: Python analysis sub-scores already stored in predictions.scores JSONB.
Target: binary (1 = horse finished 1st, 0 = otherwise).
Evaluation metric: ROC-AUC (ranking metric, not accuracy).

Usage:
  pip install lightgbm psycopg2-binary
  python3 train_model.py --dsn "postgresql://user:pw@host:5432/db?options=-csearch_path%3Doddscast"

Output:
  server/scripts/model.pkl  — LGBMClassifier + feature list bundled together

Notes:
- Requires 200+ completed races with saved predictions to be useful.
- Re-run monthly as more race data accumulates.
- Model is loaded by analysis.py when present (blended 40% model / 60% rule score).
"""
import argparse
import json
import os
import pickle
import sys

import numpy as np
import psycopg2
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupShuffleSplit

try:
    import lightgbm as lgb
except ImportError:
    print("lightgbm not installed. Run: pip install lightgbm", file=sys.stderr)
    sys.exit(1)

# Short keys used in analysis.py horse['sub'] dict
# Maps to W_HORSE factors: rat=rating, frm=form, cnd=condition, etc.
FEATURE_KEYS = [
    "rat",   # rating
    "frm",   # form
    "cnd",   # condition
    "exp",   # experience
    "suit",  # suitability
    "trn",   # trainer
    "jky",   # jockey
    "rest",  # rest period
    "dist",  # distance fit
    "cls",   # class change
    "trng",  # training readiness
    "sdf",   # same-day fatigue
    "gate",  # gate bias
    "fsz",   # field size
    "pace",  # pace scenario
]


def fetch_training_rows(dsn: str) -> list[dict]:
    """
    Extract per-horse feature vectors + win label from completed races.
    Joins predictions.scores JSONB -> analysisData.horseScoreResult with race_results.
    """
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Pull all completed predictions with scores JSONB
    # Note: TypeORM maps entity fields to camelCase column names (raceId, not race_id)
    cur.execute(
        """
        SELECT
            p."raceId",
            p.scores
        FROM oddscast.predictions p
        JOIN oddscast.races r ON r.id = p."raceId"
        WHERE r.status = 'COMPLETED'
          AND p.status = 'COMPLETED'
          AND p.scores IS NOT NULL
        ORDER BY p."raceId"
        """
    )
    prediction_rows = cur.fetchall()

    # Pull race results (winner hrNo per race)
    cur.execute(
        """
        SELECT "raceId", "hrNo"
        FROM oddscast.race_results
        WHERE "ordInt" = 1
          AND "hrNo" IS NOT NULL
        """
    )
    winner_map: dict[str, str] = {str(r[0]): str(r[1]) for r in cur.fetchall()}
    conn.close()

    rows = []
    for race_id, scores_json in prediction_rows:
        winner_hr_no = winner_map.get(str(race_id))
        if not winner_hr_no:
            continue

        scores = scores_json if isinstance(scores_json, dict) else {}
        analysis_data = scores.get("analysisData", {})
        horse_score_result = analysis_data.get("horseScoreResult", [])

        if not isinstance(horse_score_result, list) or len(horse_score_result) < 3:
            continue  # Skip races with too few horses (data quality issue)

        for horse in horse_score_result:
            if not isinstance(horse, dict):
                continue
            hr_no = str(horse.get("hrNo", ""))
            # Python stores sub-scores in horse['sub'] dict with short keys
            sub_scores = horse.get("sub", {})
            if not isinstance(sub_scores, dict) or not sub_scores:
                continue

            feature_vec = [float(sub_scores.get(k, 50.0)) for k in FEATURE_KEYS]
            label = 1 if hr_no == winner_hr_no else 0
            rows.append(
                {
                    "race_id": race_id,
                    "features": feature_vec,
                    "label": label,
                }
            )

    return rows


def train(dsn: str, model_path: str) -> None:
    print("Fetching training data...")
    rows = fetch_training_rows(dsn)

    if len(rows) < 500:
        print(
            f"Only {len(rows)} training samples — need 500+ for reliable model. "
            "Accumulate more completed race predictions first.",
            file=sys.stderr,
        )
        if len(rows) < 100:
            sys.exit(1)
        print("Proceeding with small dataset (results may be unreliable).")

    race_ids = np.array([r["race_id"] for r in rows])
    X = np.array([r["features"] for r in rows])
    y = np.array([r["label"] for r in rows])

    pos = y.sum()
    neg = len(y) - pos
    print(f"Dataset: {len(rows)} samples, {len(set(race_ids))} races, {int(pos)} winners, {int(neg)} non-winners")

    # Group-aware train/val split (no race appears in both train and val)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, val_idx = next(splitter.split(X, y, groups=race_ids))
    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]

    print(f"Train: {len(X_train)} | Val: {len(X_val)}")

    # Scale pos_weight to handle class imbalance (typically 1 winner per 8-14 horses)
    scale = (len(y_train) - y_train.sum()) / max(y_train.sum(), 1)

    model = lgb.LGBMClassifier(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        max_depth=5,
        min_child_samples=10,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=float(scale),
        random_state=42,
        verbose=-1,
    )
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(50)],
    )

    val_proba = model.predict_proba(X_val)[:, 1]
    auc = roc_auc_score(y_val, val_proba)
    print(f"Validation ROC-AUC: {auc:.4f}")
    if auc < 0.55:
        print("Warning: AUC < 0.55 — model barely better than random. More data needed.")

    # Feature importance
    importances = sorted(
        zip(FEATURE_KEYS, model.feature_importances_), key=lambda x: x[1], reverse=True
    )
    print("\nFeature importances:")
    for name, imp in importances:
        print(f"  {name:<22} {imp}")

    bundle = {"model": model, "feature_keys": FEATURE_KEYS}
    with open(model_path, "wb") as f:
        pickle.dump(bundle, f)
    print(f"\nModel saved: {model_path}")
    print("Re-deploy server to pick up new model.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dsn",
        default=os.getenv("DATABASE_URL"),
        help="PostgreSQL DSN (or set DATABASE_URL env var)",
    )
    parser.add_argument(
        "--out",
        default=os.path.join(os.path.dirname(__file__), "model.pkl"),
        help="Output path for model.pkl",
    )
    args = parser.parse_args()

    if not args.dsn:
        print("Error: --dsn required or set DATABASE_URL env var", file=sys.stderr)
        sys.exit(1)

    train(args.dsn, args.out)
