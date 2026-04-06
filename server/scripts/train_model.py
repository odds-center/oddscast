"""
Train win-prediction model on historical OddsCast race data.

Trains both LightGBM and XGBoost, picks the one with higher ROC-AUC.
- Small dataset (< 50 races): skips training, not enough signal
- Medium dataset (50-200 races): XGBoost tends to win (less overfitting)
- Large dataset (200+ races): LightGBM tends to win (better at scale)

Features: 15 sub-scores stored in predictions.scores.analysisData.horseScoreResult[].sub
Target: binary (1 = finished 1st, 0 = otherwise)

Usage:
  pip install lightgbm xgboost psycopg2-binary scikit-learn
  python3 train_model.py --dsn "postgresql://user:pw@host:5432/db"
  # or: DATABASE_URL="postgresql://..." python3 train_model.py

Output:
  server/scripts/model.pkl  — { model, feature_keys, framework, auc } bundled together
  Commit this file to git so Railway picks it up on next deploy.

Notes:
  - Re-run monthly as more race data accumulates.
  - analysis.py auto-loads model.pkl at startup (60% rule + 40% model blend).
  - model.pkl not present = pure rule-based scoring (safe fallback).
"""
import argparse
import os
import pickle
import sys

import numpy as np
import psycopg2
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit

# ─── Feature keys (match analysis.py horse['sub'] short keys) ───
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

MIN_RACES = 30   # absolute minimum (< 30 races = too noisy)
WARN_RACES = 100  # below this: warn, but still train


def fetch_training_rows(dsn: str) -> list[dict]:
    """Extract per-horse feature vectors + win label from completed races."""
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    cur.execute("""
        SELECT p."raceId", p.scores
        FROM oddscast.predictions p
        JOIN oddscast.races r ON r.id = p."raceId"
        WHERE r.status = 'COMPLETED'
          AND p.status = 'COMPLETED'
          AND p.scores IS NOT NULL
        ORDER BY p."raceId"
    """)
    prediction_rows = cur.fetchall()

    cur.execute("""
        SELECT "raceId", "hrNo"
        FROM oddscast.race_results
        WHERE "ordInt" = 1 AND "hrNo" IS NOT NULL
    """)
    winner_map: dict[str, str] = {str(r[0]): str(r[1]) for r in cur.fetchall()}
    conn.close()

    rows = []
    for race_id, scores_json in prediction_rows:
        winner_hr_no = winner_map.get(str(race_id))
        if not winner_hr_no:
            continue
        scores = scores_json if isinstance(scores_json, dict) else {}
        horse_score_result = scores.get("analysisData", {}).get("horseScoreResult", [])
        if not isinstance(horse_score_result, list) or len(horse_score_result) < 3:
            continue
        for horse in horse_score_result:
            if not isinstance(horse, dict):
                continue
            sub = horse.get("sub", {})
            if not isinstance(sub, dict) or not sub:
                continue
            rows.append({
                "race_id": race_id,
                "features": [float(sub.get(k, 50.0)) for k in FEATURE_KEYS],
                "label": 1 if str(horse.get("hrNo", "")) == winner_hr_no else 0,
            })
    return rows


def _train_lgb(X_train, y_train, X_val, y_val, scale_pos_weight):
    try:
        import lightgbm as lgb
    except ImportError:
        return None, None

    model = lgb.LGBMClassifier(
        n_estimators=300, learning_rate=0.05, num_leaves=15,
        max_depth=4, min_child_samples=5,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        random_state=42, verbose=-1,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(0)],
    )
    auc = roc_auc_score(y_val, model.predict_proba(X_val)[:, 1])
    return model, auc


def _train_xgb(X_train, y_train, X_val, y_val, scale_pos_weight):
    try:
        import xgboost as xgb
    except ImportError:
        return None, None

    model = xgb.XGBClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        min_child_weight=3, subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric="auc", early_stopping_rounds=30,
        random_state=42, verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    auc = roc_auc_score(y_val, model.predict_proba(X_val)[:, 1])
    return model, auc


def train(dsn: str, model_path: str) -> None:
    print("Fetching training data...")
    rows = fetch_training_rows(dsn)

    race_count = len(set(r["race_id"] for r in rows))
    sample_count = len(rows)
    pos = sum(r["label"] for r in rows)

    print(f"Dataset: {sample_count} samples | {race_count} races | {pos} winners")

    if race_count < MIN_RACES:
        print(
            f"Only {race_count} races — need at least {MIN_RACES} to train. "
            "Accumulate more completed race predictions first.",
            file=sys.stderr,
        )
        sys.exit(1)

    if race_count < WARN_RACES:
        print(f"Warning: {race_count} races is small. Model will work but accuracy improves with more data.")

    race_ids = np.array([r["race_id"] for r in rows])
    X = np.array([r["features"] for r in rows])
    y = np.array([r["label"] for r in rows])
    scale = float((len(y) - y.sum()) / max(y.sum(), 1))

    # Small dataset: use GroupKFold CV for stable AUC estimate
    # Larger dataset: single GroupShuffleSplit is fine
    if race_count < WARN_RACES:
        n_splits = min(5, race_count // 6)
        print(f"Small dataset — using {n_splits}-fold group CV")
        kf = GroupKFold(n_splits=n_splits)
        splits = list(kf.split(X, y, groups=race_ids))
        # Use last fold for final train/val (largest possible val set)
        train_idx, val_idx = splits[-1]
    else:
        splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        train_idx, val_idx = next(splitter.split(X, y, groups=race_ids))

    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]
    print(f"Train: {len(X_train)} | Val: {len(X_val)}")

    # Train both, pick winner
    results = {}
    print("\nTraining LightGBM...")
    lgb_model, lgb_auc = _train_lgb(X_train, y_train, X_val, y_val, scale)
    if lgb_model is not None:
        results["lightgbm"] = (lgb_model, lgb_auc)
        print(f"  LightGBM AUC: {lgb_auc:.4f}")

    print("Training XGBoost...")
    xgb_model, xgb_auc = _train_xgb(X_train, y_train, X_val, y_val, scale)
    if xgb_model is not None:
        results["xgboost"] = (xgb_model, xgb_auc)
        print(f"  XGBoost  AUC: {xgb_auc:.4f}")

    if not results:
        print("Neither LightGBM nor XGBoost could be imported. Install at least one.", file=sys.stderr)
        sys.exit(1)

    best_framework = max(results, key=lambda k: results[k][1])
    best_model, best_auc = results[best_framework]
    print(f"\nWinner: {best_framework} (AUC {best_auc:.4f})")

    if best_auc < 0.52:
        print("Warning: AUC < 0.52 — barely above random. More data strongly recommended.")
    elif best_auc < 0.58:
        print("Note: AUC is modest — model will help but more data will improve it further.")
    else:
        print("Good AUC — model should meaningfully improve predictions.")

    # Feature importance
    try:
        if best_framework == "lightgbm":
            imps = best_model.feature_importances_
        else:
            imps = best_model.feature_importances_
        ranked = sorted(zip(FEATURE_KEYS, imps), key=lambda x: x[1], reverse=True)
        print("\nTop feature importances:")
        for name, imp in ranked[:8]:
            bar = "█" * int(imp / max(imps) * 20)
            print(f"  {name:<6} {bar} {imp:.0f}")
    except Exception:
        pass

    bundle = {
        "model": best_model,
        "feature_keys": FEATURE_KEYS,
        "framework": best_framework,
        "auc": best_auc,
        "race_count": race_count,
    }
    with open(model_path, "wb") as f:
        pickle.dump(bundle, f)
    print(f"\nSaved: {model_path}")
    print("Commit model.pkl and push → Railway redeploys with new model.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", default=os.getenv("DATABASE_URL"))
    parser.add_argument(
        "--out",
        default=os.path.join(os.path.dirname(__file__), "model.pkl"),
    )
    args = parser.parse_args()
    if not args.dsn:
        print("Error: --dsn required or set DATABASE_URL", file=sys.stderr)
        sys.exit(1)
    train(args.dsn, args.out)
