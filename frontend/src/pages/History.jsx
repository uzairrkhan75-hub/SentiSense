import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, FileText, Type, Download, Inbox, Hash } from "lucide-react";
import PageShell from "../components/PageShell";
import { metaFor, formatPercent } from "../utils/sentiment";
import client from "../api/client";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/history");
        setItems(data.items || []);
      } catch (err) {
        setError(err.response?.data?.error || "Could not load history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportReport = async (id, format) => {
    const res = await client.get(`/export?format=${format}&id=${id}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentisense_${id}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Analysis History</h1>
        <p className="mt-1 text-slate-500">Your most recent analyses, newest first.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : error ? (
        <div className="card text-center text-slate-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center text-slate-400">
          <Inbox size={40} className="mb-3" />
          <p className="font-medium">No analyses yet</p>
          <p className="text-sm">Run an analysis to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="card flex items-center gap-4 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {item.kind === "bulk" ? (
                  <FileText size={18} />
                ) : item.kind === "social" ? (
                  <Hash size={18} />
                ) : (
                  <Type size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.kind === "bulk" ? (
                  <p className="truncate font-medium text-slate-700">
                    {item.filename || "Bulk upload"}{" "}
                    <span className="text-slate-400">({item.count} entries)</span>
                  </p>
                ) : item.kind === "social" ? (
                  <p className="truncate font-medium text-slate-700">
                    {item.query || "Social search"}{" "}
                    <span className="text-slate-400">({item.count} posts)</span>
                  </p>
                ) : (
                  <p className="truncate font-medium text-slate-700">{item.text}</p>
                )}
                <p className="text-xs text-slate-400">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ""}
                </p>
              </div>

              {item.kind === "single" && item.label && (
                <span
                  className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline ${
                    metaFor(item.label).bg
                  } ${metaFor(item.label).text}`}
                >
                  {metaFor(item.label).label}
                  {item.confidence != null && ` · ${formatPercent(item.confidence)}`}
                </span>
              )}

              <div className="flex gap-1">
                <button
                  onClick={() => exportReport(item.id, "csv")}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
                  title="Export CSV"
                >
                  <Download size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
