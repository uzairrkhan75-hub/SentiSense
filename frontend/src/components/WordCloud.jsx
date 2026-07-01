import { motion } from "framer-motion";

// Lightweight, dependency-free word cloud. Word size scales with frequency;
// color reflects sentiment valence from the backend explanation.
export default function WordCloud({ keywords }) {
  if (!keywords || keywords.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Not enough keywords to build a word cloud.
      </p>
    );
  }

  const maxValue = Math.max(...keywords.map((k) => k.value));

  const colorFor = (score) => {
    if (score > 0.05) return "#16a34a";
    if (score < -0.05) return "#dc2626";
    return "#64748b";
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2">
      {keywords.map((k, i) => {
        const size = 0.85 + (k.value / maxValue) * 1.6; // rem
        return (
          <motion.span
            key={k.text}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.5) }}
            whileHover={{ scale: 1.15 }}
            style={{ fontSize: `${size}rem`, color: colorFor(k.score) }}
            className="cursor-default font-semibold leading-tight"
            title={`count: ${k.value}, valence: ${k.score}`}
          >
            {k.text}
          </motion.span>
        );
      })}
    </div>
  );
}
