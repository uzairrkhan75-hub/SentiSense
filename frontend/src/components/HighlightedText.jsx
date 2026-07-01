// Renders the analyzed text with each word tinted by its sentiment valence.
// Positive words → green, negative → red, neutral → unstyled.
function colorFor(score) {
  if (score > 0.05) {
    const a = Math.min(0.18 + score * 0.5, 0.6);
    return { backgroundColor: `rgba(22, 163, 74, ${a})` };
  }
  if (score < -0.05) {
    const a = Math.min(0.18 + Math.abs(score) * 0.5, 0.6);
    return { backgroundColor: `rgba(220, 38, 38, ${a})` };
  }
  return {};
}

export default function HighlightedText({ tokens }) {
  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="leading-relaxed">
      {tokens.map((t, i) => {
        const style = colorFor(t.score);
        const styled = Object.keys(style).length > 0;
        return (
          <span
            key={i}
            style={style}
            className={`mr-1 inline-block rounded px-1 ${
              styled ? "font-medium text-slate-800" : "text-slate-600"
            }`}
            title={t.score ? `valence: ${t.score}` : undefined}
          >
            {t.word}
          </span>
        );
      })}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "rgba(22,163,74,0.5)" }} />
          Positive word
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "rgba(220,38,38,0.5)" }} />
          Negative word
        </span>
      </div>
    </div>
  );
}
