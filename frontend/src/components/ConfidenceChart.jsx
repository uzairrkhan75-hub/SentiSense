import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const METHOD_LABELS = {
  vader: "VADER",
  textblob: "TextBlob",
  ml: "ML Model",
  bert: "BERT",
};

// Each method exposes a signed polarity score in [-1, 1].
export default function ConfidenceChart({ breakdown }) {
  const data = Object.entries(breakdown).map(([method, res]) => ({
    name: METHOD_LABELS[method] || method,
    score: res.score,
    label: res.label,
  }));

  const colorFor = (label) =>
    label === "positive"
      ? "#16a34a"
      : label === "negative"
      ? "#dc2626"
      : "#94a3b8";

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.06)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
            formatter={(value, _n, item) => [
              `${value} (${item.payload.label})`,
              "polarity",
            ]}
          />
          <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={42}>
            {data.map((entry, index) => (
              <Cell key={index} fill={colorFor(entry.label)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
