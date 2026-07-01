"""Loader and predictor for the trained classic ML model.

The training script (`ml/train.py`) persists a scikit-learn Pipeline
(TF-IDF + classifier) to `ml/artifacts/model.joblib`. This module loads it
lazily and degrades gracefully when no artifact is present (Phase 1), so the
hybrid engine can still run on rule-based methods alone.
"""
import os

import joblib

_ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "ml",
    "artifacts",
    "model.joblib",
)

_model = None
_load_attempted = False


def is_available() -> bool:
    return _load_model() is not None


def _load_model():
    global _model, _load_attempted
    if _load_attempted:
        return _model
    _load_attempted = True
    if os.path.exists(_ARTIFACT_PATH):
        try:
            _model = joblib.load(_ARTIFACT_PATH)
        except Exception:
            _model = None
    return _model


def predict(processed_text: str):
    """Return ``(label, confidence)`` or ``None`` if no model is loaded.

    ``processed_text`` should already be run through the preprocessing
    pipeline. Confidence uses ``predict_proba`` when available, otherwise a
    decision-function margin squashed into [0, 1].
    """
    model = _load_model()
    if model is None or not processed_text:
        return None

    label = str(model.predict([processed_text])[0])
    confidence = 0.6

    if hasattr(model, "predict_proba"):
        try:
            proba = model.predict_proba([processed_text])[0]
            confidence = float(max(proba))
        except Exception:
            pass
    elif hasattr(model, "decision_function"):
        try:
            import numpy as np

            scores = np.atleast_1d(model.decision_function([processed_text])[0])
            margin = float(np.max(np.abs(scores)))
            confidence = float(1 / (1 + np.exp(-margin)))
        except Exception:
            pass

    return label, confidence
