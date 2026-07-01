export const SENTIMENT_META = {
  positive: {
    label: "Positive",
    color: "#16a34a",
    bg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-200",
    emoji: "😊",
  },
  negative: {
    label: "Negative",
    color: "#dc2626",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    emoji: "😞",
  },
  neutral: {
    label: "Neutral",
    color: "#64748b",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-200",
    emoji: "😐",
  },
};

export function metaFor(label) {
  return SENTIMENT_META[label] || SENTIMENT_META.neutral;
}

export function formatPercent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}
