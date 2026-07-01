import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const LABELS = {
  joy: "Joy",
  trust: "Trust",
  anticipation: "Anticipation",
  surprise: "Surprise",
  fear: "Fear",
  anger: "Anger",
  sadness: "Sadness",
  disgust: "Disgust",
};

export default function EmotionChart({ emotions }) {
  if (!emotions || !emotions.scores) return null;
  const data = Object.entries(emotions.scores).map(([key, value]) => ({
    emotion: LABELS[key] || key,
    value: Math.round(value * 100),
  }));

  const hasSignal = data.some((d) => d.value > 0);

  return (
    <div>
      {emotions.top && (
        <p className="mb-2 text-sm text-slate-500">
          Dominant emotion:{" "}
          <span className="font-semibold capitalize text-brand-600">
            {emotions.top}
          </span>
        </p>
      )}
      {hasSignal ? (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="emotion"
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Radar
                dataKey="value"
                stroke="#F06E4B"
                fill="#D85A38"
                fillOpacity={0.45}
                isAnimationActive
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "intensity"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          No strong emotional signals detected in this text.
        </p>
      )}
    </div>
  );
}
