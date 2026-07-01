"""Train classic ML sentiment classifiers and persist the best one.

Usage:
    python ml/train.py                      # uses bundled seed dataset
    python ml/train.py --data reviews.csv   # CSV with text + label columns

The CSV is expected to have a text column (text/review/comment/content) and a
label column (label/sentiment/target) with values like positive/negative/
neutral (or 0/1, pos/neg which are normalized automatically).

It trains three models (MultinomialNB, LogisticRegression, LinearSVC) inside a
TF-IDF pipeline, reports accuracy and macro-F1 via cross-validation, then
refits the best model on all data and saves it to ml/artifacts/model.joblib.
"""
import argparse
import os
import sys

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

# Allow importing the preprocessing pipeline from the app package.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.preprocess import preprocess  # noqa: E402

ARTIFACT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")
ARTIFACT_PATH = os.path.join(ARTIFACT_DIR, "model.joblib")

_TEXT_COLS = ("text", "review", "comment", "content", "tweet")
_LABEL_COLS = ("label", "sentiment", "target", "polarity")

_LABEL_MAP = {
    "pos": "positive",
    "positive": "positive",
    "1": "positive",
    "4": "positive",
    "neg": "negative",
    "negative": "negative",
    "0": "negative",
    "neu": "neutral",
    "neutral": "neutral",
    "2": "neutral",
}


def _seed_dataset() -> pd.DataFrame:
    """A built-in, template-generated dataset so the pipeline runs end-to-end
    without external data. It is large and lexically consistent enough that the
    classic models train and evaluate sensibly for the demo / Models dashboard.
    """
    subjects = [
        "product", "service", "movie", "app", "phone", "laptop", "restaurant",
        "hotel", "book", "game", "camera", "headphones",
    ]
    pos_adj = [
        "excellent", "amazing", "fantastic", "wonderful", "great", "superb",
        "outstanding", "brilliant", "delightful", "impressive",
    ]
    neg_adj = [
        "terrible", "awful", "horrible", "disappointing", "poor", "frustrating",
        "useless", "dreadful", "mediocre", "broken",
    ]
    pos_templates = [
        "I absolutely love this {s}, it is {a}.",
        "The {s} was {a} and exceeded my expectations.",
        "Such an {a} {s}, I highly recommend it.",
        "This {s} is {a}, I am very happy with it.",
        "Best {s} ever, a truly {a} experience.",
        "Great {s}, the quality is {a} and worth every penny.",
        "I am so impressed, this {s} is genuinely {a}.",
        "What an {a} {s}, it made my day.",
        "Fantastic {s}, everything about it feels {a}.",
        "Five stars, the {s} is {a} and reliable.",
    ]
    neg_templates = [
        "I really hate this {s}, it is {a}.",
        "The {s} was {a} and a complete waste of money.",
        "Such a {a} {s}, I would not recommend it.",
        "This {s} is {a}, I am very unhappy with it.",
        "Worst {s} ever, a truly {a} experience.",
        "Poor {s}, the quality is {a} and overpriced.",
        "I am so frustrated, this {s} is genuinely {a}.",
        "What a {a} {s}, it ruined my day.",
        "Disappointing {s}, everything about it feels {a}.",
        "One star, the {s} is {a} and unreliable.",
    ]
    neutral_templates = [
        "The {s} arrived on Tuesday as scheduled.",
        "This {s} is okay, it does the job.",
        "The {s} comes in three different colors.",
        "I bought the {s} from the store yesterday.",
        "The manual explains how the {s} works.",
        "The {s} is average, nothing special about it.",
        "I am still deciding whether to keep the {s}.",
        "The {s} was delivered in a standard box.",
        "According to the listing, the {s} weighs two kilograms.",
        "The {s} is similar to the previous version.",
    ]

    rows = []
    for i, s in enumerate(subjects):
        for j, a in enumerate(pos_adj):
            rows.append((pos_templates[(i + j) % len(pos_templates)].format(s=s, a=a), "positive"))
        for j, a in enumerate(neg_adj):
            rows.append((neg_templates[(i + j) % len(neg_templates)].format(s=s, a=a), "negative"))
        for t in neutral_templates:
            rows.append((t.format(s=s), "neutral"))

    # Ambiguous / conflicting-signal examples so the models make some realistic
    # mistakes. Without these the templated data is perfectly separable and every
    # model scores 1.0, which makes the comparison dashboard meaningless. These
    # deliberately mix positive and negative cues against the true label.
    hard_templates = [
        ("Oh great, the {s} broke again, just wonderful.", "negative"),
        ("Amazing how poor this {s} turned out to be.", "negative"),
        ("I wanted to love the {s} but it was disappointing.", "negative"),
        ("Not bad at all, the {s} actually works really well.", "positive"),
        ("Awful name, but honestly the {s} is genuinely excellent.", "positive"),
        ("The {s} is terrible? No, it is actually quite good.", "positive"),
        ("Great price but the {s} quality is poor, so average.", "neutral"),
        ("The {s} is neither good nor bad, just average.", "neutral"),
        ("Mixed feelings, the {s} is wonderful yet frustrating.", "neutral"),
    ]
    for i, s in enumerate(subjects):
        for k in range(3):
            text, label = hard_templates[(i + k) % len(hard_templates)]
            rows.append((text.format(s=s), label))

    return pd.DataFrame(rows, columns=["text", "label"])


def _find_col(df, candidates):
    for col in df.columns:
        if str(col).strip().lower() in candidates:
            return col
    return None


def load_dataset(path):
    if path:
        df = pd.read_csv(path)
        text_col = _find_col(df, _TEXT_COLS) or df.columns[0]
        label_col = _find_col(df, _LABEL_COLS) or df.columns[-1]
        df = df[[text_col, label_col]].dropna()
        df.columns = ["text", "label"]
    else:
        print("No --data provided; using bundled seed dataset (demo only).")
        df = _seed_dataset()

    df["label"] = (
        df["label"].astype(str).str.strip().str.lower().map(lambda v: _LABEL_MAP.get(v, v))
    )
    df["text"] = df["text"].astype(str)
    return df


def build_pipelines():
    vectorizer_kwargs = dict(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
    return {
        "naive_bayes": Pipeline(
            [
                ("tfidf", TfidfVectorizer(**vectorizer_kwargs)),
                ("clf", MultinomialNB()),
            ]
        ),
        "logistic_regression": Pipeline(
            [
                ("tfidf", TfidfVectorizer(**vectorizer_kwargs)),
                ("clf", LogisticRegression(max_iter=1000)),
            ]
        ),
        "linear_svc": Pipeline(
            [
                ("tfidf", TfidfVectorizer(**vectorizer_kwargs)),
                ("clf", LinearSVC()),
            ]
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Train SentiSense ML models.")
    parser.add_argument("--data", help="Path to a labeled CSV dataset.", default=None)
    args = parser.parse_args()

    df = load_dataset(args.data)
    print(f"Loaded {len(df)} rows. Label counts:\n{df['label'].value_counts()}\n")

    print("Preprocessing text...")
    df["processed"] = df["text"].apply(preprocess)
    df = df[df["processed"].str.len() > 0]

    X = df["processed"].tolist()
    y = df["label"].tolist()

    n_classes = len(set(y))
    cv = min(5, max(2, min(pd.Series(y).value_counts())))

    best_name, best_model, best_score = None, None, -1.0
    for name, pipe in build_pipelines().items():
        try:
            scores = cross_val_score(pipe, X, y, cv=cv, scoring="f1_macro")
            mean_f1 = scores.mean()
        except Exception as exc:
            print(f"  {name}: skipped ({exc})")
            continue
        print(f"  {name}: macro-F1 = {mean_f1:.4f} (cv={cv})")
        if mean_f1 > best_score:
            best_name, best_model, best_score = name, pipe, mean_f1

    if best_model is None:
        print("No model could be trained.")
        return

    print(f"\nBest model: {best_name} (macro-F1 = {best_score:.4f})")

    # Hold-out report for visibility, then refit on all data for the artifact.
    if len(df) >= 10 and n_classes > 1:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        best_model.fit(X_train, y_train)
        print("\nHold-out classification report:")
        print(classification_report(y_test, best_model.predict(X_test), zero_division=0))

    best_model.fit(X, y)

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    joblib.dump(best_model, ARTIFACT_PATH)
    print(f"Saved model to {ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
