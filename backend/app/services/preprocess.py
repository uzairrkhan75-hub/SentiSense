"""Text preprocessing pipeline built on NLTK.

Steps: lowercase -> strip URLs/mentions/HTML -> tokenize -> remove stopwords
and non-alphabetic tokens -> lemmatize (WordNet).

NLTK data is downloaded on demand the first time it is needed so the project
works after a plain `pip install` without a separate setup step.
"""
import re

import nltk
from nltk.corpus import stopwords, wordnet
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk import pos_tag

_URL_RE = re.compile(r"http\S+|www\.\S+")
_MENTION_RE = re.compile(r"[@#]\w+")
_HTML_RE = re.compile(r"<.*?>")
_NON_ALPHA_RE = re.compile(r"[^a-z\s]")

_REQUIRED_NLTK = [
    ("tokenizers/punkt", "punkt"),
    ("tokenizers/punkt_tab", "punkt_tab"),
    ("corpora/stopwords", "stopwords"),
    ("corpora/wordnet", "wordnet"),
    ("corpora/omw-1.4", "omw-1.4"),
    ("taggers/averaged_perceptron_tagger", "averaged_perceptron_tagger"),
    ("taggers/averaged_perceptron_tagger_eng", "averaged_perceptron_tagger_eng"),
]

_initialized = False
_lemmatizer = None
_stopwords = set()


def ensure_nltk():
    global _initialized, _lemmatizer, _stopwords
    if _initialized:
        return
    for path, pkg in _REQUIRED_NLTK:
        try:
            nltk.data.find(path)
        except LookupError:
            try:
                nltk.download(pkg, quiet=True)
            except Exception:
                pass
    _lemmatizer = WordNetLemmatizer()
    try:
        _stopwords = set(stopwords.words("english"))
    except Exception:
        _stopwords = set()
    _initialized = True


def _wordnet_pos(treebank_tag):
    if treebank_tag.startswith("J"):
        return wordnet.ADJ
    if treebank_tag.startswith("V"):
        return wordnet.VERB
    if treebank_tag.startswith("R"):
        return wordnet.ADV
    return wordnet.NOUN


def clean_text(text: str) -> str:
    """Lowercase and remove URLs, mentions/hashtags, HTML and symbols."""
    text = (text or "").lower()
    text = _URL_RE.sub(" ", text)
    text = _MENTION_RE.sub(" ", text)
    text = _HTML_RE.sub(" ", text)
    text = _NON_ALPHA_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


_TW_URL_RE = re.compile(r"http\S+|www\.\S+")
_TW_MENTION_RE = re.compile(r"@\w+")
_TW_NUMBER_RE = re.compile(r"\b\d+\b")


def clean_social(text: str) -> str:
    """Twitter-mode cleaning: drop usernames, links and numbers; keep hashtag
    words (strip the leading #) and casing/punctuation so VADER can still read
    emphasis. Mirrors the "Twitter-like content" option in common demos.
    """
    text = text or ""
    text = _TW_URL_RE.sub(" ", text)
    text = _TW_MENTION_RE.sub(" ", text)
    text = _TW_NUMBER_RE.sub(" ", text)
    text = text.replace("#", " ")
    return re.sub(r"\s+", " ", text).strip()


def preprocess(text: str) -> str:
    """Full pipeline returning a normalized, space-joined token string.

    Suitable as input to a TF-IDF vectorizer. Rule-based analyzers (VADER /
    TextBlob) should use the *raw* text instead, since they rely on
    punctuation and casing.
    """
    ensure_nltk()
    cleaned = clean_text(text)
    if not cleaned:
        return ""

    try:
        tokens = word_tokenize(cleaned)
    except Exception:
        tokens = cleaned.split()

    tokens = [t for t in tokens if t not in _stopwords and len(t) > 1]
    if not tokens:
        return ""

    try:
        tagged = pos_tag(tokens)
        lemmas = [
            _lemmatizer.lemmatize(tok, _wordnet_pos(tag)) for tok, tag in tagged
        ]
    except Exception:
        lemmas = [_lemmatizer.lemmatize(tok) for tok in tokens] if _lemmatizer else tokens

    return " ".join(lemmas)
