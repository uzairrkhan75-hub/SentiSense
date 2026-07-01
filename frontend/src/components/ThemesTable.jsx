import { motion } from "framer-motion";

// "Detected Themes" table - aspect-based sentiment. Each row is a noun-phrase
// theme with its sentiment magnitude and a color-coded polarity score.
function scoreCellStyle(score) {
  if (score > 0.05) {
    const a = Math.min(0.25 + score * 0.6, 0.95);
    return { backgroundColor: `rgba(22, 163, 74, ${a})`, color: "#fff" };
  }
  if (score < -0.05) {
    const a = Math.min(0.25 + Math.abs(score) * 0.6, 0.95);
    return { backgroundColor: `rgba(220, 38, 38, ${a})`, color: "#fff" };
  }
  return { backgroundColor: "#e2e8f0", color: "#475569" };
}

export default function ThemesTable({ themes }) {
  if (!themes || themes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No distinct themes detected in this text.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Detected Theme</th>
            <th className="px-4 py-3 text-right">Magnitude</th>
            <th className="px-4 py-3 text-right">Sentiment Score</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t, i) => (
            <motion.tr
              key={t.theme}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="border-t border-slate-100"
            >
              <td className="px-4 py-3 font-medium capitalize text-slate-700">
                {t.theme}
              </td>
              <td className="px-4 py-3 text-right italic text-slate-400">
                {t.magnitude.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className="inline-block min-w-[64px] rounded-md px-3 py-1 text-center text-xs font-bold"
                  style={scoreCellStyle(t.score)}
                >
                  {t.score > 0 ? "+" : ""}
                  {t.score.toFixed(3)}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
