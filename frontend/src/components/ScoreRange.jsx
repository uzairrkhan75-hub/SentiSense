import { motion } from "framer-motion";

// Document-level polarity legend: a -1..+1 gradient bar with an animated marker
// at the document's score. Mirrors the "Score Range" widget in common demos.
export default function ScoreRange({ score = 0 }) {
  const clamped = Math.max(-1, Math.min(1, score));
  const percent = ((clamped + 1) / 2) * 100;

  return (
    <div className="w-full max-w-xs">
      <div className="mb-1 flex justify-between text-[11px] font-semibold">
        <span className="text-red-500">negative</span>
        <span className="text-slate-400">neutral</span>
        <span className="text-green-600">positive</span>
      </div>
      <div className="relative">
        <div
          className="h-3 w-full rounded-full"
          style={{
            background:
              "linear-gradient(to right, #dc2626 0%, #fca5a5 25%, #e2e8f0 50%, #86efac 75%, #16a34a 100%)",
          }}
        />
        <motion.div
          initial={{ left: "50%", opacity: 0 }}
          animate={{ left: `${percent}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="absolute -top-1 -ml-2 h-5 w-5 rounded-full border-2 border-white bg-slate-800 shadow-md"
          style={{ left: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>-1</span>
        <span>-0.25</span>
        <span>+0.25</span>
        <span>+1</span>
      </div>
    </div>
  );
}
