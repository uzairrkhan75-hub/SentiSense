import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Gauge, Sparkles, AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageShell from "../components/PageShell";
import client from "../api/client";

const MODEL_NAMES = {
  naive_bayes: "Naive Bayes",
  logistic_regression: "Logistic Regression",
  linear_svc: "Linear SVC",
  transformer_bert: "BERT (RoBERTa)",
};

const MODEL_COLORS = {
  linear_svc: "#F06E4B",
  logistic_regression: "#0ea5e9",
  naive_bayes: "#16a34a",
  transformer_bert: "#8b5cf6",
};

const FALLBACK_BAR_COLORS = ["#F06E4B", "#0ea5e9", "#16a34a", "#8b5cf6", "#f59e0b"];

export default function Models() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.get("/models/metrics");
        setData(res.data);
      } catch {
        setData({ available: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      </PageShell>
    );
  }

  if (!data?.available) {
    return (
      <PageShell>
        <Header />
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="text-amber-500" size={36} />
          <p className="font-semibold text-slate-700">No evaluation metrics yet</p>
          <p className="max-w-md text-sm text-slate-500">
            Generate the model comparison by running the evaluation script in the
            backend, then refresh this page:
          </p>
          <code className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-100">
            python ml/evaluate.py
          </code>
        </div>
      </PageShell>
    );
  }

  const models = data.models || {};
  const metricRows = ["accuracy", "precision", "recall", "f1"].map((metric) => {
    const row = { metric: metric[0].toUpperCase() + metric.slice(1) };
    Object.entries(models).forEach(([key, m]) => {
      row[MODEL_NAMES[key] || key] = m[metric];
    });
    return row;
  });
  const modelKeys = Object.keys(models);

  return (
    <PageShell>
      <Header />

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-500">
        <span className="rounded-lg bg-slate-100 px-3 py-1">
          Dataset: <b>{data.dataset_size}</b> samples
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1">
          Test set: <b>{data.test_size}</b>
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1">
          Classes: <b>{(data.labels || []).join(", ")}</b>
        </span>
        <span
          className={`rounded-lg px-3 py-1 ${
            data.bert_loaded ? "bg-green-100 text-green-700" : "bg-slate-100"
          }`}
        >
          BERT: <b>{data.bert_loaded ? "loaded" : "not loaded"}</b>
        </span>
      </div>

      <div className="card mb-6">
        <h3 className="mb-4 font-semibold text-slate-700">Performance comparison</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricRows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend iconType="circle" />
              {modelKeys.map((key, i) => {
                const label = MODEL_NAMES[key] || key;
                return (
                  <Bar
                    key={label}
                    dataKey={label}
                    fill={MODEL_COLORS[key] || FALLBACK_BAR_COLORS[i % FALLBACK_BAR_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="mb-3 font-semibold text-slate-700">Confusion matrices</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(models).map(([key, m]) => (
          <ConfusionMatrix
            key={key}
            title={MODEL_NAMES[key] || key}
            matrix={m.confusion_matrix}
            labels={data.labels}
            f1={m.f1}
          />
        ))}
      </div>
    </PageShell>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
        <Gauge size={22} />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Model Comparison</h1>
        <p className="text-slate-500">
          Evaluation of every sentiment model: accuracy, precision, recall, F1 and
          confusion matrices.
        </p>
      </div>
    </div>
  );
}

function ConfusionMatrix({ title, matrix, labels, f1 }) {
  if (!matrix || matrix.length === 0) return null;
  const max = Math.max(...matrix.flat(), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-semibold text-slate-700">
          <Sparkles size={16} className="text-brand-500" /> {title}
        </h4>
        <span className="text-xs text-slate-400">macro F1: {f1}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-1 text-xs text-slate-400"></th>
              {labels.map((l) => (
                <th key={l} className="p-1 text-xs font-medium text-slate-500">
                  {l.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="p-1 text-xs font-medium text-slate-500">{labels[i].slice(0, 3)}</td>
                {row.map((val, j) => {
                  const intensity = val / max;
                  const isDiag = i === j;
                  const bg = isDiag
                    ? `rgba(22, 163, 74, ${0.15 + intensity * 0.7})`
                    : `rgba(220, 38, 38, ${0.1 + intensity * 0.6})`;
                  return (
                    <td key={j} className="p-1">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: val === 0 ? "#f8fafc" : bg,
                          color: intensity > 0.4 ? "#fff" : "#475569",
                        }}
                      >
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">Rows = actual, columns = predicted</p>
    </motion.div>
  );
}
