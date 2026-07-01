"""Emotion detection using the NRC Word-Emotion Association Lexicon.

Maps text onto the eight Plutchik emotions. This is lexicon-based, so it runs
fully offline and is reliable for demos (no model download required).
"""
from nrclex import NRCLex

from .preprocess import ensure_nltk

# Plutchik's eight emotions (NRCLex also reports positive/negative, omitted here
# because polarity is already covered by the sentiment engine).
EMOTIONS = [
    "joy",
    "trust",
    "anticipation",
    "surprise",
    "fear",
    "anger",
    "sadness",
    "disgust",
]


def detect_emotions(text: str) -> dict:
    """Return ``{top, scores}`` where scores are per-emotion frequencies."""
    scores = {e: 0.0 for e in EMOTIONS}
    text = (text or "").strip()
    if not text:
        return {"top": None, "scores": scores}

    ensure_nltk()
    try:
        analyzer = NRCLex()
        analyzer.load_raw_text(text)
        freqs = analyzer.affect_frequencies or {}
    except Exception:
        return {"top": None, "scores": scores}

    for emotion in EMOTIONS:
        # Guard against a known older-version typo ("anticip").
        value = freqs.get(emotion)
        if value is None and emotion == "anticipation":
            value = freqs.get("anticip", 0.0)
        scores[emotion] = round(float(value or 0.0), 4)

    top = max(scores, key=scores.get) if any(scores.values()) else None
    return {"top": top, "scores": scores}
