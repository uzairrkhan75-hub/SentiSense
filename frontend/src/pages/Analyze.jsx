import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Download,
  Heart,
  Cloud,
  Highlighter,
  Share2,
  Check,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import PageShell from "../components/PageShell";
import UseCases from "../components/UseCases";
import SentimentCard from "../components/SentimentCard";
import EmotionChart from "../components/EmotionChart";
import HighlightedText from "../components/HighlightedText";
import WordCloud from "../components/WordCloud";
import ScoreRange from "../components/ScoreRange";
import ThemesTable from "../components/ThemesTable";
import { metaFor } from "../utils/sentiment";
import client from "../api/client";

const DEFAULT_TEXT =
  "Great product! Perfect length and cut to wear with my leggings! This was recommended by my Consultant.";

export default function Analyze() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    const isUrl = mode === "url";
    if (isUrl ? !url.trim() : !text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = isUrl
        ? await client.post("/analyze/url", { url })
        : await client.post("/analyze", { text });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    if (!result) return;
    const score = result.scores?.compound ?? 0;
    const summary =
      `SentiSense analysis\n` +
      `"${result.text}"\n` +
      `Sentiment: ${result.label} (${score > 0 ? "+" : ""}${score.toFixed(2)})\n` +
      `Confidence: ${Math.round((result.confidence || 0) * 100)}%\n` +
      `Magnitude: ${result.magnitude}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const exportReport = async (format) => {
    if (!result?.id) return;
    try {
      const res = await client.get(`/export?format=${format}&id=${result.id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentisense_result.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Export failed.");
    }
  };

  const score = result?.scores?.compound ?? 0;
  const meta = result ? metaFor(result.label) : null;

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Sentiment Analysis</h1>
        <p className="mt-1 text-slate-500">
          Enter text to detect sentiment, emotions, key themes and confidence in
          real time.
        </p>
      </div>

      {/* Input panel */}
      <div className="card">
        <div className="mb-3 flex gap-2">
          {[
            { id: "text", label: "Text" },
            { id: "url", label: "Web URL" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m.id
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <div className="relative">
            <LinkIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article-to-analyze"
              className="input pl-10 text-base"
            />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Enter your text in English for analysis..."
            className="input resize-none text-base"
          />
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={share}
              disabled={!result}
              className="btn-ghost py-2 text-sm disabled:opacity-50"
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? "Copied!" : "Share this analysis"}
            </button>
          </div>

          <button
            onClick={analyze}
            disabled={loading || (mode === "url" ? !url.trim() : !text.trim())}
            className="btn-primary"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-6"
          >
            {result.title && (
              <div className="card flex items-center gap-3">
                <LinkIcon size={18} className="shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-700">{result.title}</p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-brand-500 hover:underline"
                  >
                    {result.url}
                  </a>
                </div>
              </div>
            )}

            {/* Highlighted text + word cloud */}
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="card lg:col-span-3">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <Highlighter size={18} className="text-amber-500" /> Highlighted text
                </h3>
                <HighlightedText tokens={result.explanation?.tokens} />
              </div>
              <div className="card lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <Cloud size={18} className="text-brand-500" /> Word cloud
                </h3>
                <WordCloud keywords={result.explanation?.keywords} />
              </div>
            </div>

            {/* Document score + magnitude + range */}
            <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg">
                  This document is:{" "}
                  <span className={`font-extrabold ${meta.text}`}>
                    {meta.label.toLowerCase()} ({score > 0 ? "+" : ""}
                    {score.toFixed(2)})
                  </span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm italic text-slate-400">
                  <Info size={13} /> Magnitude: {result.magnitude} · Confidence:{" "}
                  {Math.round((result.confidence || 0) * 100)}%
                </p>
              </div>
              <ScoreRange score={score} />
            </div>

            {/* Detected themes (aspect-based) */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-slate-700">Detected Themes</h3>
              <ThemesTable themes={result.themes} />
            </div>

            {/* Model breakdown + emotions */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SentimentCard result={result} />
              <div className="card">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <Heart size={18} className="text-pink-500" /> Emotion profile
                </h3>
                <EmotionChart emotions={result.emotions} />
              </div>
            </div>

            {result.id && (
              <div className="flex gap-3">
                <button onClick={() => exportReport("csv")} className="btn-ghost">
                  <Download size={16} /> Export CSV
                </button>
                <button onClick={() => exportReport("pdf")} className="btn-ghost">
                  <Download size={16} /> Export PDF
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-3 text-5xl"
            >
              🔍
            </motion.div>
            <p className="font-medium text-slate-400">
              Run an analysis to see results here
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <UseCases />
    </PageShell>
  );
}
