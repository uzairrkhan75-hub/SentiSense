import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageShell from "../components/PageShell";
import { metaFor, formatPercent } from "../utils/sentiment";
import client from "../api/client";

const SAMPLE_A = "The new update is fantastic, everything runs faster and looks great!";
const SAMPLE_B = "The new update is a disaster, it crashes constantly and lost my data.";

export default function Compare() {
  const [textA, setTextA] = useState(SAMPLE_A);
  const [textB, setTextB] = useState(SAMPLE_B);
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compare = async () => {
    if (!textA.trim() || !textB.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [ra, rb] = await Promise.all([
        client.post("/analyze", { text: textA }),
        client.post("/analyze", { text: textB }),
      ]);
      setA(ra.data);
      setB(rb.data);
    } catch (err) {
      setError(err.response?.data?.error || "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    a && b
      ? [
          {
            metric: "Polarity",
            A: a.scores?.compound ?? 0,
            B: b.scores?.compound ?? 0,
          },
          {
            metric: "Confidence",
            A: Number((a.confidence || 0).toFixed(2)),
            B: Number((b.confidence || 0).toFixed(2)),
          },
          {
            metric: "Magnitude",
            A: a.magnitude ?? 0,
            B: b.magnitude ?? 0,
          },
        ]
      : [];

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Compare Texts</h1>
        <p className="mt-1 text-slate-500">
          Analyze two pieces of text side by side - great for comparing products,
          reviews or versions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 font-semibold text-brand-600">Text A</h3>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            rows={5}
            className="input resize-none"
            placeholder="First text..."
          />
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold text-brand-700">Text B</h3>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            rows={5}
            className="input resize-none"
            placeholder="Second text..."
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          onClick={compare}
          disabled={loading || !textA.trim() || !textB.trim()}
          className="btn-primary ml-auto"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <GitCompare size={18} />}
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>

      {a && b && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <ResultColumn title="Text A" result={a} accent="brand" />
            <ResultColumn title="Text B" result={b} accent="purple" />
          </div>

          <div className="card">
            <h3 className="mb-4 font-semibold text-slate-700">Side-by-side metrics</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="A" fill="#F06E4B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="B" fill="#D85A38" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}

function ResultColumn({ title, result, accent }) {
  const meta = metaFor(result.label);
  const score = result.scores?.compound ?? 0;
  return (
    <motion.div whileHover={{ y: -4 }} className="card">
      <p className={`mb-3 text-sm font-semibold ${accent === "brand" ? "text-brand-600" : "text-brand-700"}`}>
        {title}
      </p>
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${meta.bg}`}>
          {meta.emoji}
        </div>
        <div>
          <p className={`text-2xl font-extrabold ${meta.text}`}>{meta.label}</p>
          <p className="text-sm text-slate-400">
            {score > 0 ? "+" : ""}
            {score.toFixed(2)} polarity · {formatPercent(result.confidence)} confidence
          </p>
        </div>
      </div>
      {result.emotions?.top && (
        <p className="mt-3 text-sm text-slate-500">
          Dominant emotion:{" "}
          <span className="font-semibold capitalize text-brand-600">
            {result.emotions.top}
          </span>
        </p>
      )}
    </motion.div>
  );
}
