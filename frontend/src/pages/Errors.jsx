import { useEffect, useState } from "react";
import { getErrors } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const CHART_STYLE = {
  tooltip: {
    contentStyle: { background: "#1A1D27", border: "1px solid #2A2D3E", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "#6B7280" },
  },
  grid: { stroke: "#2A2D3E", strokeDasharray: "3 3" },
};

const CATEGORY_COLOR = {
  timeout: "#F59E0B",
  rate_limit: "#EF4444",
  model_unavailable: "#8B5CF6",
  invalid_request: "#EC4899",
  unknown: "#6B7280",
};

export default function Errors() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getErrors().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted text-sm font-mono animate-pulse">Loading errors…</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Errors</h1>
        <p className="text-sm text-muted mt-1">
          {data.total} total failures tracked
        </p>
      </div>

      {/* Category count cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {data.by_category.map(({ category, count }) => (
          <div key={category} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full w-fit"
              style={{
                background: `${CATEGORY_COLOR[category]}20`,
                color: CATEGORY_COLOR[category] || "#6B7280",
              }}
            >
              {category}
            </span>
            <p className="text-3xl font-bold font-mono text-white">{count}</p>
            <p className="text-xs text-muted">occurrences</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Errors by Category</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.by_category}>
            <CartesianGrid {...CHART_STYLE.grid} />
            <XAxis dataKey="category" tick={{ fill: "#6B7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
            <Tooltip {...CHART_STYLE.tooltip} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.by_category.map(({ category }) => (
                <Cell
                  key={category}
                  fill={CATEGORY_COLOR[category] || "#6B7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent errors table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-white">Recent Failures</p>
        </div>
        <div className="divide-y divide-border">
          {data.recent.map(e => (
            <div key={e.id} className="px-5 py-3 flex items-start gap-4">
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full mt-0.5 shrink-0"
                style={{
                  background: `${CATEGORY_COLOR[e.error_category]}20`,
                  color: CATEGORY_COLOR[e.error_category] || "#6B7280",
                }}
              >
                {e.error_category || "unknown"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{e.prompt}</p>
                <p className="text-xs text-danger mt-0.5">{e.error_message || "No message"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-muted">{e.model}</p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}