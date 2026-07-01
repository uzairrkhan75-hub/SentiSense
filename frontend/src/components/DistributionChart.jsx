import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";
import { SENTIMENT_META } from "../utils/sentiment";

const ORDER = ["positive", "neutral", "negative"];

function toData(distribution) {
  return ORDER.filter((k) => k in distribution).map((key) => ({
    name: SENTIMENT_META[key].label,
    key,
    value: distribution[key],
    color: SENTIMENT_META[key].color,
  }));
}

export function DistributionPie({ distribution }) {
  const data = toData(distribution);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            isAnimationActive
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
              "count",
            ]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionBar({ distribution }) {
  const data = toData(distribution);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
