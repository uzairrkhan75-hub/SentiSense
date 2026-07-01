import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, MessageSquare, ArrowUp, ExternalLink } from "lucide-react";
import PageShell from "../components/PageShell";
import { DistributionPie, DistributionBar } from "../components/DistributionChart";
import CountUp from "../components/CountUp";
import { metaFor, formatPercent } from "../utils/sentiment";
import client from "../api/client";

const SOURCES = [
  { id: "hackernews", label: "Hacker News" },
  { id: "reddit", label: "Reddit" },
];

const EXAMPLES = ["iPhone", "Tesla", "ChatGPT", "Bitcoin", "climate change"];

const looksLikeUrl = (q) => /^https?:\/\/|www\.|\.[a-z]{2,}\//i.test(q.trim());

export default function Social() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("hackernews");
  const [subreddit, setSubreddit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await client.post("/social", {
        query,
        source,
        subreddit: source === "reddit" ? subreddit.trim() || undefined : undefined,
        limit: 30,
      });
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not fetch social posts. Try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Social Sentiment</h1>
        <p className="mt-1 text-slate-500">
          Pull recent public posts about a topic and analyze the mood of the
          conversation in real time.
        </p>
      </div>

      <form onSubmit={search} className="card">
        <div className="mb-3 flex gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                source === s.id
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Topic or keyword (e.g. iPhone, Tesla, ChatGPT)"
              className="input pl-10"
            />
          </div>
          {source === "reddit" && (
            <div className="relative sm:w-56">
              <MessageSquare size={18} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                placeholder="Subreddit (optional)"
                className="input pl-10"
              />
            </div>
          )}
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? "Fetching..." : "Analyze"}
          </button>
        </div>

        {/* Example topics */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              {ex}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Enter a <span className="font-medium text-slate-500">topic or keyword</span>{" "}
          (not a full URL) to find recent posts about it.
          {source === "reddit" &&
            " Reddit may be rate-limited on some networks; Hacker News is the most reliable source."}
        </p>

        {looksLikeUrl(query) && (
          <p className="mt-2 text-sm font-medium text-amber-600">
            That looks like a URL. Try a short keyword instead, e.g. a brand or
            topic name.
          </p>
        )}
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      </form>

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Posts analyzed" value={data.count} />
            <StatCard label="Avg. confidence" value={formatPercent(data.avg_confidence)} />
            <StatCard
              label="Top sentiment"
              value={
                metaFor(
                  Object.entries(data.distribution).sort((a, b) => b[1] - a[1])[0]?.[0]
                ).label
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-2 font-semibold text-slate-700">Sentiment distribution</h3>
              <DistributionPie distribution={data.distribution} />
            </div>
            <div className="card">
              <h3 className="mb-2 font-semibold text-slate-700">Counts by sentiment</h3>
              <DistributionBar distribution={data.distribution} />
            </div>
          </div>

          <div className="space-y-3">
            {data.results.map((r, i) => {
              const meta = metaFor(r.label);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="card flex items-start gap-4 py-4"
                >
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full`} style={{ backgroundColor: meta.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 text-sm text-slate-700">{r.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="max-w-[200px] truncate">{r.source}</span>
                      <span>by {r.author}</span>
                      <span className="flex items-center gap-1">
                        <ArrowUp size={12} /> {r.ups}
                      </span>
                      {r.permalink && (
                        <a
                          href={r.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-brand-500 hover:underline"
                        >
                          <ExternalLink size={12} /> view
                        </a>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}
                  >
                    {meta.label} · {formatPercent(r.confidence)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="card flex flex-col items-center justify-center text-center"
    >
      <p className="text-3xl font-extrabold text-slate-800">
        <CountUp value={value} />
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </motion.div>
  );
}
