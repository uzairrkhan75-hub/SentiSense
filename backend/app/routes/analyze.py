import csv
import io
import re
from collections import Counter
from datetime import datetime, timezone

import pandas as pd
import requests
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from pymongo.errors import PyMongoError
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from ..models.db import get_analyses
from ..services.engine import analyze, analyze_many
from ..services.emotion import detect_emotions
from ..services.explain import explain, detect_themes
from ..services.preprocess import clean_social

analyze_bp = Blueprint("analyze", __name__)

_LABELS = ["positive", "negative", "neutral"]


def _save_analysis(user_id, kind, payload):
    """Persist an analysis. Returns inserted id or None when DB unavailable."""
    doc = {
        "user_id": user_id,
        "kind": kind,
        "created_at": datetime.now(timezone.utc),
        **payload,
    }
    try:
        result = get_analyses().insert_one(doc)
        return str(result.inserted_id)
    except PyMongoError:
        return None


def _distribution(results):
    counts = Counter(r["label"] for r in results)
    return {label: counts.get(label, 0) for label in _LABELS}


@analyze_bp.post("/analyze")
@jwt_required()
def analyze_single():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    raw_text = (data.get("text") or "").strip()
    twitter_mode = bool(data.get("twitter"))
    if not raw_text:
        return jsonify({"error": "Field 'text' is required."}), 400

    # In Twitter mode, strip usernames/links/numbers before analysis.
    text = clean_social(raw_text) if twitter_mode else raw_text
    if not text:
        text = raw_text

    result = analyze(text)
    result["emotions"] = detect_emotions(text)
    result["explanation"] = explain(text)
    result["themes"] = detect_themes(text)
    result["magnitude"] = result["explanation"].get("magnitude", 0)
    result["twitter"] = twitter_mode

    saved_id = _save_analysis(
        user_id,
        "single",
        {
            "text": raw_text,
            "label": result["label"],
            "confidence": result["confidence"],
            "breakdown": result["breakdown"],
            "emotions": result["emotions"],
            "themes": result["themes"],
            "magnitude": result["magnitude"],
        },
    )
    result["id"] = saved_id
    return jsonify(result)


@analyze_bp.post("/analyze/url")
@jwt_required()
def analyze_url():
    """Fetch a web page, extract its readable text, and analyze it."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not re.match(r"^https?://", url):
        return jsonify({"error": "Provide a valid http(s) URL."}), 400

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        html = resp.text
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not fetch the page: {exc}"}), 502

    # Drop non-content sections, then pull paragraph text.
    cleaned = re.sub(
        r"(?is)<(script|style|noscript|nav|header|footer|aside)[^>]*>.*?</\1>",
        " ",
        html,
    )
    paragraphs = re.findall(r"(?is)<p[^>]*>(.*?)</p>", cleaned)
    chunks = [_strip_html(p) for p in paragraphs]
    article = " ".join(c for c in chunks if len(c) > 40)
    if len(article) < 50:
        article = _strip_html(cleaned)
    article = article[:4000].strip()

    if len(article) < 20:
        return jsonify({"error": "Could not extract readable text from that page."}), 422

    title_match = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    title = _strip_html(title_match.group(1)) if title_match else url

    result = analyze(article)
    result["emotions"] = detect_emotions(article)
    result["explanation"] = explain(article)
    result["themes"] = detect_themes(article)
    result["magnitude"] = result["explanation"].get("magnitude", 0)
    result["url"] = url
    result["title"] = title

    saved_id = _save_analysis(
        user_id,
        "single",
        {
            "text": f"[{title}] {article[:500]}",
            "label": result["label"],
            "confidence": result["confidence"],
            "breakdown": result["breakdown"],
            "emotions": result["emotions"],
            "themes": result["themes"],
            "magnitude": result["magnitude"],
            "url": url,
        },
    )
    result["id"] = saved_id
    return jsonify(result)


@analyze_bp.post("/analyze/bulk")
@jwt_required()
def analyze_bulk():
    user_id = get_jwt_identity()
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded (field name 'file')."}), 400

    file = request.files["file"]
    filename = (file.filename or "").lower()
    raw = file.read()
    if not raw:
        return jsonify({"error": "Uploaded file is empty."}), 400

    texts = []
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(raw))
            if df.empty:
                return jsonify({"error": "CSV file has no rows."}), 400
            # Prefer a column named text/review/comment/content, else first column.
            preferred = next(
                (
                    c
                    for c in df.columns
                    if str(c).strip().lower()
                    in ("text", "review", "comment", "content", "tweet")
                ),
                df.columns[0],
            )
            texts = [str(v) for v in df[preferred].dropna().tolist()]
        else:  # treat as plain text, one entry per line
            text = raw.decode("utf-8", errors="ignore")
            texts = [line.strip() for line in text.splitlines() if line.strip()]
    except Exception as exc:
        return jsonify({"error": f"Could not parse file: {exc}"}), 400

    texts = [t for t in texts if t.strip()]
    if not texts:
        return jsonify({"error": "No text rows found in the file."}), 400

    # Guard against huge files in this demo build.
    texts = texts[:5000]

    results = analyze_many(texts)
    distribution = _distribution(results)
    avg_confidence = round(
        sum(r["confidence"] for r in results) / len(results), 4
    )

    saved_id = _save_analysis(
        user_id,
        "bulk",
        {
            "filename": file.filename,
            "count": len(results),
            "distribution": distribution,
            "avg_confidence": avg_confidence,
            "results": [
                {"text": r["text"], "label": r["label"], "confidence": r["confidence"]}
                for r in results
            ],
        },
    )

    return jsonify(
        {
            "id": saved_id,
            "count": len(results),
            "distribution": distribution,
            "avg_confidence": avg_confidence,
            "results": results,
        }
    )


@analyze_bp.get("/history")
@jwt_required()
def history():
    user_id = get_jwt_identity()
    try:
        cursor = (
            get_analyses()
            .find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(100)
        )
        items = []
        for doc in cursor:
            items.append(
                {
                    "id": str(doc["_id"]),
                    "kind": doc.get("kind"),
                    "created_at": doc.get("created_at").isoformat()
                    if doc.get("created_at")
                    else None,
                    "text": doc.get("text"),
                    "label": doc.get("label"),
                    "confidence": doc.get("confidence"),
                    "filename": doc.get("filename"),
                    "query": doc.get("query"),
                    "count": doc.get("count"),
                    "distribution": doc.get("distribution"),
                }
            )
        return jsonify({"items": items})
    except PyMongoError:
        return jsonify({"error": "Database unavailable."}), 503


@analyze_bp.get("/models/metrics")
@jwt_required()
def model_metrics():
    """Serve the saved model-comparison metrics (from ml/evaluate.py)."""
    import json
    import os

    path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ml",
        "artifacts",
        "metrics.json",
    )
    if not os.path.exists(path):
        return jsonify({"available": False})
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["available"] = True
        from ..services import transformer_model

        data["bert_loaded"] = transformer_model.is_loaded()
        return jsonify(data)
    except Exception as exc:
        return jsonify({"available": False, "error": str(exc)}), 500


@analyze_bp.get("/trends")
@jwt_required()
def trends():
    """Aggregate the user's sentiment counts per calendar day."""
    user_id = get_jwt_identity()
    try:
        cursor = get_analyses().find({"user_id": user_id}).sort("created_at", 1)
        buckets = {}
        for doc in cursor:
            created = doc.get("created_at")
            if not created:
                continue
            day = created.date().isoformat()
            bucket = buckets.setdefault(
                day, {"date": day, "positive": 0, "negative": 0, "neutral": 0}
            )
            if doc.get("kind") == "bulk":
                for label, count in (doc.get("distribution") or {}).items():
                    if label in bucket:
                        bucket[label] += count
            elif doc.get("label") in bucket:
                bucket[doc["label"]] += 1
        return jsonify({"points": [buckets[k] for k in sorted(buckets)]})
    except PyMongoError:
        return jsonify({"error": "Database unavailable."}), 503


_HTML_TAG_RE = re.compile(r"<[^>]+>")

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def _strip_html(text: str) -> str:
    import html

    return re.sub(r"\s+", " ", html.unescape(_HTML_TAG_RE.sub(" ", text or ""))).strip()


def _fetch_hackernews(query, limit):
    """Free, key-less, reliable source: Hacker News (Algolia) comments."""
    resp = requests.get(
        "https://hn.algolia.com/api/v1/search_by_date",
        params={"query": query, "tags": "comment", "hitsPerPage": limit},
        headers=_BROWSER_HEADERS,
        timeout=12,
    )
    resp.raise_for_status()
    posts = []
    for hit in resp.json().get("hits", []):
        text = _strip_html(hit.get("comment_text") or hit.get("story_text") or "")
        if len(text) < 5:
            continue
        posts.append(
            {
                "text": text[:1000],
                "author": hit.get("author"),
                "source": hit.get("story_title") or "Hacker News",
                "ups": hit.get("points") or 0,
                "permalink": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
            }
        )
    return posts


def _fetch_reddit(query, subreddit, limit):
    """Reddit public JSON. May be blocked on some networks/IPs."""
    if subreddit:
        path = f"/r/{subreddit}/search.json"
        params = {"q": query, "limit": limit, "sort": "new", "restrict_sr": 1}
    else:
        path = "/search.json"
        params = {"q": query, "limit": limit, "sort": "new"}

    resp = requests.get(
        "https://www.reddit.com" + path,
        params=params,
        headers=_BROWSER_HEADERS,
        timeout=12,
    )
    resp.raise_for_status()
    posts = []
    for child in resp.json().get("data", {}).get("children", []):
        d = child.get("data", {})
        text = f"{d.get('title', '')} {d.get('selftext', '')}".strip()
        if text:
            posts.append(
                {
                    "text": text[:1000],
                    "author": d.get("author"),
                    "source": f"r/{d.get('subreddit')}",
                    "ups": d.get("ups", 0),
                    "permalink": f"https://reddit.com{d.get('permalink', '')}",
                }
            )
    return posts


@analyze_bp.post("/social")
@jwt_required()
def social():
    """Fetch recent public posts for a query and analyze their sentiment.

    Default source is Hacker News (free, no key, reliable). Reddit is available
    as an option but can be IP-blocked on some networks. (X/Twitter now requires
    a paid API, so it is not used.)
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    source = (data.get("source") or "hackernews").strip().lower()
    subreddit = (data.get("subreddit") or "").strip()
    try:
        limit = max(1, min(int(data.get("limit", 25)), 50))
    except (TypeError, ValueError):
        limit = 25

    if not query:
        return jsonify({"error": "Field 'query' is required."}), 400

    try:
        if source == "reddit":
            posts = _fetch_reddit(query, subreddit, limit)
        else:
            source = "hackernews"
            posts = _fetch_hackernews(query, limit)
    except (requests.RequestException, ValueError) as exc:
        return jsonify({"error": f"Could not fetch posts from {source}: {exc}"}), 502

    if not posts:
        return jsonify({"error": "No posts found for that query."}), 404

    results = []
    for post in posts:
        r = analyze(post["text"])
        results.append({**post, "label": r["label"], "confidence": r["confidence"]})

    distribution = _distribution(results)
    avg_confidence = round(sum(r["confidence"] for r in results) / len(results), 4)

    saved_id = _save_analysis(
        user_id,
        "social",
        {
            "query": query,
            "source": source,
            "count": len(results),
            "distribution": distribution,
            "avg_confidence": avg_confidence,
            "results": [
                {"text": r["text"], "label": r["label"], "confidence": r["confidence"]}
                for r in results
            ],
        },
    )

    return jsonify(
        {
            "id": saved_id,
            "query": query,
            "source": source,
            "count": len(results),
            "distribution": distribution,
            "avg_confidence": avg_confidence,
            "results": results,
        }
    )


def _fetch_owned(analysis_id, user_id):
    try:
        doc = get_analyses().find_one(
            {"_id": ObjectId(analysis_id), "user_id": user_id}
        )
    except (InvalidId, PyMongoError):
        return None
    return doc


def _rows_from_doc(doc):
    """Flatten a stored analysis into rows for export."""
    if doc.get("kind") in ("bulk", "social"):
        return [
            [r.get("text", ""), r.get("label", ""), r.get("confidence", "")]
            for r in doc.get("results", [])
        ]
    return [[doc.get("text", ""), doc.get("label", ""), doc.get("confidence", "")]]


@analyze_bp.get("/export")
@jwt_required()
def export():
    user_id = get_jwt_identity()
    analysis_id = request.args.get("id")
    fmt = (request.args.get("format") or "csv").lower()

    if not analysis_id:
        return jsonify({"error": "Query param 'id' is required."}), 400

    doc = _fetch_owned(analysis_id, user_id)
    if not doc:
        return jsonify({"error": "Analysis not found."}), 404

    rows = _rows_from_doc(doc)
    header = ["text", "label", "confidence"]

    if fmt == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(header)
        writer.writerows(rows)
        data = io.BytesIO(buffer.getvalue().encode("utf-8"))
        return send_file(
            data,
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"sentisense_{analysis_id}.csv",
        )

    if fmt == "pdf":
        return _export_pdf(doc, rows, analysis_id)

    return jsonify({"error": "Unsupported format. Use 'csv' or 'pdf'."}), 400


def _export_pdf(doc, rows, analysis_id):
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=A4, title="SentiSense Report")
    styles = getSampleStyleSheet()
    elements = [Paragraph("SentiSense - Sentiment Analysis Report", styles["Title"])]
    elements.append(Spacer(1, 12))

    meta = [
        f"Type: {doc.get('kind', 'single')}",
        f"Created: {doc.get('created_at')}",
    ]
    if doc.get("kind") == "bulk":
        meta.append(f"File: {doc.get('filename')}")
        meta.append(f"Entries: {doc.get('count')}")
        dist = doc.get("distribution", {})
        meta.append(
            "Distribution - "
            + ", ".join(f"{k}: {v}" for k, v in dist.items())
        )
    for line in meta:
        elements.append(Paragraph(line, styles["Normal"]))
    elements.append(Spacer(1, 16))

    # Truncate long text so the table stays readable.
    table_data = [["Text", "Label", "Confidence"]]
    for text, label, conf in rows[:500]:
        snippet = (str(text)[:120] + "...") if len(str(text)) > 120 else str(text)
        table_data.append([Paragraph(snippet, styles["Normal"]), label, str(conf)])

    table = Table(table_data, colWidths=[320, 80, 80])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ]
        )
    )
    elements.append(table)
    pdf.build(elements)
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"sentisense_{analysis_id}.pdf",
    )
