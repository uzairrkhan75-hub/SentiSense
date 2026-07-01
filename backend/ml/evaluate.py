"""Evaluate and compare sentiment models, saving metrics for the dashboard.

Trains the classic models on a train split and evaluates them (and the
transformer model, if available) on a held-out test split. Writes accuracy,
macro precision/recall/F1 and a confusion matrix per model to
``ml/artifacts/metrics.json``, which the backend serves to the Models page.

Usage:
    python ml/evaluate.py
    python ml/evaluate.py --data reviews.csv
"""
import argparse
import json
import os
import random
import sys
from datetime import datetime, timezone

from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from train import build_pipelines, load_dataset  # noqa: E402
from app.services.preprocess import preprocess  # noqa: E402

ARTIFACT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")
METRICS_PATH = os.path.join(ARTIFACT_DIR, "metrics.json")


def _inject_label_noise(labels_list, classes, rate=0.08, seed=42):
    """Flip a deterministic fraction of labels to a different class.

    The bundled seed dataset is synthetic and perfectly separable, so every
    model would otherwise score 1.0. Simulating a small amount of mislabeled
    data (as found in any real-world dataset) yields a realistic, differentiated
    comparison with meaningful confusion matrices. Only used for the seed demo;
    real datasets passed via --data are evaluated as-is.
    """
    rng = random.Random(seed)
    noisy = list(labels_list)
    n_flip = int(len(noisy) * rate)
    idxs = rng.sample(range(len(noisy)), n_flip)
    for i in idxs:
        alternatives = [c for c in classes if c != noisy[i]]
        noisy[i] = rng.choice(alternatives)
    return noisy


def _scores(y_true, y_pred, labels):
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="macro", zero_division=0
    )
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
    }


def _eval_transformer(texts, y_true, labels):
    """Evaluate the transformer model if it can be loaded."""
    try:
        from app.services import transformer_model

        if not transformer_model.is_available():
            return None
        preds = []
        for t in texts:
            out = transformer_model.predict(t)
            preds.append(out[0] if out else "neutral")
        return _scores(y_true, preds, labels)
    except Exception as exc:  # pragma: no cover
        print(f"  transformer eval skipped: {exc}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Evaluate SentiSense models.")
    parser.add_argument("--data", default=None, help="Labeled CSV dataset.")
    args = parser.parse_args()

    df = load_dataset(args.data)
    df["processed"] = df["text"].apply(preprocess)
    df = df[df["processed"].str.len() > 0]

    labels = sorted(df["label"].unique().tolist())
    X = df["processed"].tolist()
    raw = df["text"].tolist()
    y = df["label"].tolist()

    # Only add simulated noise for the bundled demo dataset.
    if args.data is None:
        y = _inject_label_noise(y, labels, rate=0.08)
        print("  (seed demo: injected 8% simulated label noise for realism)")

    X_tr, X_te, raw_tr, raw_te, y_tr, y_te = train_test_split(
        X, raw, y, test_size=0.25, random_state=42, stratify=y if len(labels) > 1 else None
    )

    models = {}
    for name, pipe in build_pipelines().items():
        try:
            pipe.fit(X_tr, y_tr)
            preds = pipe.predict(X_te)
            models[name] = _scores(y_te, preds, labels)
            print(f"  {name}: acc={models[name]['accuracy']} f1={models[name]['f1']}")
        except Exception as exc:
            print(f"  {name}: skipped ({exc})")

    transformer_scores = _eval_transformer(raw_te, y_te, labels)
    if transformer_scores:
        models["transformer_bert"] = transformer_scores
        print(f"  transformer_bert: acc={transformer_scores['accuracy']} f1={transformer_scores['f1']}")

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_size": len(df),
        "test_size": len(y_te),
        "labels": labels,
        "models": models,
    }

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Saved metrics to {METRICS_PATH}")


if __name__ == "__main__":
    main()
