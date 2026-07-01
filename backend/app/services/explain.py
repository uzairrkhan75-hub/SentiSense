"""Explainability helpers.

Produces two artifacts that make a prediction interpretable:
  1. ``tokens`` - the original words paired with their VADER lexicon valence so
     the UI can highlight what pushed the sentiment positive/negative.
  2. ``keywords`` - the most salient non-stopword terms with frequency and
     sentiment, used to render a sentiment-colored word cloud.

Everything relies on the VADER lexicon and NLTK stopwords, so it runs offline.
"""
import re
from collections import defaultdict

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from .preprocess import ensure_nltk

_analyzer = SentimentIntensityAnalyzer()
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z']+")

# Grammar for shallow noun-phrase chunking: optional determiner/adjectives
# followed by one or more nouns (e.g. "great product", "perfect length").
_NP_GRAMMAR = "NP: {<DT>?<JJ.*>*<NN.*>+}"
_chunker = None

_STOPWORDS = None


def _stopwords():
    global _STOPWORDS
    if _STOPWORDS is None:
        ensure_nltk()
        try:
            from nltk.corpus import stopwords

            _STOPWORDS = set(stopwords.words("english"))
        except Exception:
            _STOPWORDS = set()
    return _STOPWORDS


def _valence(word: str) -> float:
    return float(_analyzer.lexicon.get(word.lower(), 0.0))


def explain(text: str, max_keywords: int = 30) -> dict:
    text = (text or "").strip()
    if not text:
        return {"tokens": [], "keywords": []}

    words = _WORD_RE.findall(text)

    # Per-word valence for inline highlighting (VADER range is roughly -4..4).
    tokens = [{"word": w, "score": round(_valence(w) / 4.0, 3)} for w in words]

    # Aggregate keyword frequencies (skip stopwords / very short tokens).
    stops = _stopwords()
    freq = defaultdict(int)
    for w in words:
        lw = w.lower()
        if len(lw) > 2 and lw not in stops:
            freq[lw] += 1

    keywords = [
        {"text": word, "value": count, "score": round(_valence(word) / 4.0, 3)}
        for word, count in freq.items()
    ]
    keywords.sort(key=lambda k: (k["value"], abs(k["score"])), reverse=True)

    # Magnitude = total volume of sentiment, regardless of polarity.
    magnitude = round(sum(abs(t["score"]) for t in tokens), 2)

    return {
        "tokens": tokens,
        "keywords": keywords[:max_keywords],
        "magnitude": magnitude,
    }


def _phrase_score(phrase: str) -> float:
    """Sentiment polarity of a phrase in [-1, 1]."""
    from textblob import TextBlob

    polarity = TextBlob(phrase).sentiment.polarity
    if abs(polarity) < 0.01:
        # Fall back to VADER for phrases TextBlob rates as neutral.
        polarity = _analyzer.polarity_scores(phrase)["compound"]
    return round(float(polarity), 3)


def detect_themes(text: str, max_themes: int = 10) -> list:
    """Aspect-based sentiment: extract noun-phrase themes and score each.

    Returns ``[{theme, magnitude, score}]`` similar to a "Detected Themes"
    table - magnitude reflects sentiment volume, score the polarity.
    """
    global _chunker
    text = (text or "").strip()
    if not text:
        return []

    ensure_nltk()
    try:
        import nltk
        from nltk import pos_tag
        from nltk.tokenize import word_tokenize

        if _chunker is None:
            _chunker = nltk.RegexpParser(_NP_GRAMMAR)

        tagged = pos_tag(word_tokenize(text))
        tree = _chunker.parse(tagged)
    except Exception:
        return []

    seen = {}
    for subtree in tree.subtrees(lambda t: t.label() == "NP"):
        words = [w for w, _ in subtree.leaves() if _WORD_RE.match(w)]
        words = [w for w in words if w.lower() not in _stopwords()]
        if not words:
            continue
        phrase = " ".join(words).lower()
        if len(phrase) < 3 or phrase in seen:
            continue
        magnitude = round(sum(abs(_valence(w) / 4.0) for w in words), 2)
        seen[phrase] = {
            "theme": phrase,
            "magnitude": magnitude,
            "score": _phrase_score(phrase),
        }

    themes = list(seen.values())
    # Surface the most sentiment-laden themes first.
    themes.sort(key=lambda t: (t["magnitude"], abs(t["score"])), reverse=True)
    return themes[:max_themes]
