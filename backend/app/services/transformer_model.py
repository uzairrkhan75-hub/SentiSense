"""Transformer (BERT-family) sentiment model.

Uses a 3-class RoBERTa model (CardiffNLP) whose labels map directly to our
negative / neutral / positive scheme. Loading is lazy and fully optional: if
``transformers``/``torch`` are not installed or the model cannot be downloaded,
every function degrades to a no-op so the hybrid engine keeps working on the
other methods.

The model (~500 MB) downloads on first use and is then cached by Hugging Face.
Set SENTISENSE_TRANSFORMER to override the model name, or SENTISENSE_DISABLE_BERT=1
to disable it entirely.
"""
import os
import threading

_MODEL_NAME = os.getenv(
    "SENTISENSE_TRANSFORMER", "cardiffnlp/twitter-roberta-base-sentiment-latest"
)
_DISABLED = os.getenv("SENTISENSE_DISABLE_BERT", "0") == "1"

_LABEL_MAP = {
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
    "label_0": "negative",
    "label_1": "neutral",
    "label_2": "positive",
}

_pipeline = None
_load_attempted = False
_warm_thread = None


def warmup():
    """Load the model in a background daemon thread so the first analyze request
    never blocks on the (potentially large) download / load. Safe to call once
    at app startup; a no-op if disabled or already started."""
    global _warm_thread
    if _DISABLED or _warm_thread is not None:
        return
    _warm_thread = threading.Thread(target=_load, daemon=True)
    _warm_thread.start()


def is_available() -> bool:
    return _load() is not None


def is_loaded() -> bool:
    """Whether the model is already loaded, without triggering a download."""
    return _pipeline is not None


def _reachable(host="huggingface.co", port=443, timeout=2.0) -> bool:
    import socket

    try:
        socket.create_connection((host, port), timeout=timeout).close()
        return True
    except OSError:
        return False


def _load():
    global _pipeline, _load_attempted
    if _load_attempted or _DISABLED:
        return _pipeline
    _load_attempted = True

    # If Hugging Face is unreachable, force offline mode so transformers uses any
    # local cache and fails fast instead of spamming a long network retry loop.
    if not _reachable():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    try:
        from transformers import pipeline

        _pipeline = pipeline(
            "sentiment-analysis",
            model=_MODEL_NAME,
            top_k=None,
            truncation=True,
            max_length=256,
        )
    except Exception:
        _pipeline = None
    return _pipeline


def predict(text: str):
    """Return ``(label, confidence)`` or ``None`` when unavailable."""
    pipe = _load()
    text = (text or "").strip()
    if pipe is None or not text:
        return None
    try:
        out = pipe(text[:512])
        scores = out[0] if out and isinstance(out[0], list) else out
        best = max(scores, key=lambda s: s["score"])
        label = _LABEL_MAP.get(str(best["label"]).lower(), str(best["label"]).lower())
        return label, float(best["score"])
    except Exception:
        return None
