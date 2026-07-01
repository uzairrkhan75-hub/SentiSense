import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Loader2, Download } from "lucide-react";
import PageShell from "../components/PageShell";
import BulkExamples from "../components/BulkExamples";
import { DistributionPie, DistributionBar } from "../components/DistributionChart";
import CountUp from "../components/CountUp";
import { metaFor, formatPercent } from "../utils/sentiment";
import client from "../api/client";

export default function BulkUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    setError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await client.post("/analyze/bulk", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!data?.id) return;
    const res = await client.get(`/export?format=${format}&id=${data.id}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentisense_bulk.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Bulk Analysis</h1>
        <p className="mt-1 text-slate-500">
          Upload a CSV or TXT file to analyze many reviews or comments at once.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <motion.div
          animate={{ y: dragging ? -6 : 0 }}
          className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F06E4B] text-white shadow-lg shadow-[#F06E4B]/30"
        >
          <UploadCloud size={28} />
        </motion.div>
        {file ? (
          <p className="flex items-center gap-2 font-medium text-slate-700">
            <FileText size={16} /> {file.name}
          </p>
        ) : (
          <>
            <p className="font-semibold text-slate-700">
              Drag &amp; drop a file here, or click to browse
            </p>
            <p className="mt-1 text-sm text-slate-400">
              CSV (with a text column) or TXT (one entry per line)
            </p>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          onClick={upload}
          disabled={!file || loading}
          className="btn-primary ml-auto"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
          {loading ? "Processing..." : "Analyze file"}
        </button>
      </div>

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Entries analyzed" value={data.count} />
            <StatCard
              label="Avg. confidence"
              value={formatPercent(data.avg_confidence)}
            />
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

          <div className="flex gap-3">
            <button onClick={() => exportReport("csv")} className="btn-ghost">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => exportReport("pdf")} className="btn-ghost">
              <Download size={16} /> Export PDF
            </button>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Text</th>
                    <th className="px-4 py-3">Sentiment</th>
                    <th className="px-4 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.slice(0, 200).map((r, i) => {
                    const meta = metaFor(r.label);
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="max-w-md truncate px-4 py-3 text-slate-600">
                          {r.text}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatPercent(r.confidence)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      <BulkExamples />
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
