import { motion } from "framer-motion";
import { metaFor, formatPercent } from "../utils/sentiment";
import ConfidenceChart from "./ConfidenceChart";
import CountUp from "./CountUp";

export default function SentimentCard({ result }) {
  if (!result) return null;
  const meta = metaFor(result.label);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
      className="card overflow-hidden"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ring-4 ${meta.bg} ${meta.ring}`}
          >
            {meta.emoji}
          </motion.div>
          <div>
            <p className="text-sm font-medium text-slate-400">Detected sentiment</p>
            <p className={`text-3xl font-extrabold ${meta.text}`}>{meta.label}</p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-sm font-medium text-slate-400">Confidence</p>
          <p className="text-3xl font-extrabold text-slate-800">
            <CountUp value={Math.round((result.confidence || 0) * 100)} suffix="%" />
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Confidence level</span>
          <span>{formatPercent(result.confidence)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(result.confidence || 0) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: meta.color }}
          />
        </div>
      </div>

      {result.breakdown && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Model breakdown
          </p>
          <ConfidenceChart breakdown={result.breakdown} />
        </div>
      )}
    </motion.div>
  );
}
