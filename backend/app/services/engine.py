"""Hybrid sentiment engine.

Combines three signals into a single decision:
  1. VADER (rule-based, social-media tuned)
  2. TextBlob (rule-based, polarity)
  3. Classic ML classifier (TF-IDF + linear model), when an artifact exists

Each method emits ``{label, score}`` where ``score`` is a signed polarity in
[-1, 1]. The final label is a weighted vote and confidence reflects agreement
strength. Output labels are: positive | negative | neutral.
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

from . import ml_model, transformer_model
from .preprocess import preprocess

POSITIVE = "positive"
NEGATIVE = "negative"
NEUTRAL = "neutral"

# Thresholds for converting a signed polarity into a label.
_POS_THRESHOLD = 0.05
_NEG_THRESHOLD = -0.05

# Relative weights for the weighted vote. The transformer (bert) is trusted most.
_WEIGHTS = {"vader": 1.0, "textblob": 0.8, "ml": 1.5, "bert": 2.0}

_vader = SentimentIntensityAnalyzer()


def _score_to_label(score: float) -> str:
    if score >= _POS_THRESHOLD:
        return POSITIVE
    if score <= _NEG_THRESHOLD:
        return NEGATIVE
    return NEUTRAL


def _vader_result(text: str):
    compound = _vader.polarity_scores(text)["compound"]
    return {"label": _score_to_label(compound), "score": round(compound, 4)}


def _textblob_result(text: str):
    polarity = TextBlob(text).sentiment.polarity
    return {"label": _score_to_label(polarity), "score": round(polarity, 4)}


def _normalize_label(label: str) -> str:
    label = (label or "").lower()
    if label in (POSITIVE, NEGATIVE, NEUTRAL):
        return label
    return {
        "pos": POSITIVE,
        "neg": NEGATIVE,
        "neu": NEUTRAL,
        "1": POSITIVE,
        "0": NEGATIVE,
        "4": POSITIVE,
        "2": NEUTRAL,
    }.get(label, label)


def _ml_result(processed: str):
    prediction = ml_model.predict(processed)
    if prediction is None:
        return None
    label, confidence = prediction
    label = _normalize_label(label)
    sign = {POSITIVE: 1.0, NEGATIVE: -1.0, NEUTRAL: 0.0}.get(label, 0.0)
    return {"label": label, "score": round(sign * confidence, 4)}


def _bert_result(text: str):
    prediction = transformer_model.predict(text)
    if prediction is None:
        return None
    label, confidence = prediction
    label = _normalize_label(label)
    sign = {POSITIVE: 1.0, NEGATIVE: -1.0, NEUTRAL: 0.0}.get(label, 0.0)
    return {"label": label, "score": round(sign * confidence, 4)}


def analyze(text: str) -> dict:
    """Analyze a single piece of text and return a structured result."""
    text = (text or "").strip()
    if not text:
        return {
            "text": text,
            "label": NEUTRAL,
            "confidence": 0.0,
            "scores": {},
            "breakdown": {},
        }

    processed = preprocess(text)

    breakdown = {
        "vader": _vader_result(text),
        "textblob": _textblob_result(text),
    }
    ml = _ml_result(processed)
    if ml is not None:
        breakdown["ml"] = ml
    bert = _bert_result(text)
    if bert is not None:
        breakdown["bert"] = bert

    # Weighted vote across methods.
    weighted_score = 0.0
    total_weight = 0.0
    votes = {POSITIVE: 0.0, NEGATIVE: 0.0, NEUTRAL: 0.0}
    for method, res in breakdown.items():
        weight = _WEIGHTS.get(method, 1.0)
        weighted_score += res["score"] * weight
        total_weight += weight
        votes[res["label"]] += weight

    avg_score = weighted_score / total_weight if total_weight else 0.0
    final_label = max(votes, key=votes.get)

    # If the vote is a tie or leans neutral, fall back to the averaged score.
    if list(votes.values()).count(votes[final_label]) > 1:
        final_label = _score_to_label(avg_score)

    # Confidence: blend of vote agreement and signal magnitude.
    agreement = votes[final_label] / total_weight if total_weight else 0.0
    magnitude = min(abs(avg_score) * 2, 1.0)
    if final_label == NEUTRAL:
        confidence = round(agreement * (1 - magnitude), 4)
    else:
        confidence = round(0.5 * agreement + 0.5 * magnitude, 4)
    confidence = max(0.0, min(1.0, confidence))

    return {
        "text": text,
        "label": final_label,
        "confidence": confidence,
        "scores": {"compound": round(avg_score, 4)},
        "breakdown": breakdown,
    }


def analyze_many(texts):
    return [analyze(t) for t in texts]
