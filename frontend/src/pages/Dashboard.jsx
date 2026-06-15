import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import MetricCard from "../components/MetricCard";
import { getAnalytics, getTraces, getFeedbackTrend } from "../lib/api";

const CHART_STYLE = {
  tooltip: {
    contentStyle: { background: "#1A1D27", border: "1px solid #2A2D3E", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "#6B7280" },
  },
  grid: { stroke: "#2A2D3E", strokeDasharray: "3 3" },
};

function buildDailyVolume(traces) {
  const map = {};
  traces.forEach(t => {
    const day = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map[day] = (map[day] || 0) + 1;
  });
  return Object.entries(map)
    .map(([day, count]) => ({ day, count }))
    .slice(-7);
}

function buildLatencyTrend(traces) {
  return traces
    .slice(0, 20)
    .reverse()
    .map((t, i) => ({ i: i + 1, latency: Math.round(t.latency_ms) }));
}

function buildTokenTrend(traces) {
  const map = {};
  traces.forEach(t => {
    const day = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map[day] = (map[day] || 0) + (t.total_tokens || 0);
  });
  return Object.entries(map)
    .map(([day, tokens]) => ({ day, tokens }))
    .slice(-7);
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [traces, setTraces] = useState([]);
  const [feedbackTrend, setFeedbackTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalytics(), getTraces(100), getFeedbackTrend()]).then(([a, t, f]) => {
      setAnalytics(a);
      setTraces(t);
      setFeedbackTrend(f);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted text-sm font-mono animate-pulse">Loading metrics…</p>
      </div>
    );
  }

  const dailyVolume = buildDailyVolume(traces);
  const latencyTrend = buildLatencyTrend(traces);
  const tokenTrend = buildTokenTrend(traces);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Real-time observability for your LLM application</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Total Requests"
          value={analytics.total_requests.toLocaleString()}
          sub={`${analytics.successful_requests} succeeded · ${analytics.failed_requests} failed`}
          pulse
        />
        <MetricCard
          label="Total Tokens"
          value={analytics.total_tokens.toLocaleString()}
          sub="across all sessions"
          accent
        />
        <MetricCard
          label="Avg Latency"
          value={`${analytics.avg_latency_ms.toLocaleString()}ms`}
          sub="mean response time"
        />
        <MetricCard
          label="Error Rate"
          value={`${analytics.error_rate}%`}
          sub="of all requests"
        />
        <MetricCard
          label="Satisfaction"
          value={`${analytics.satisfaction_score}%`}
          sub="based on feedback"
          accent
        />
        <MetricCard
          label="Success Rate"
          value={`${(100 - analytics.error_rate).toFixed(1)}%`}
          sub="requests succeeded"
          pulse
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Request Volume — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyVolume}>
              <CartesianGrid {...CHART_STYLE.grid} />
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Token Usage — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tokenTrend}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_STYLE.grid} />
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#tokenGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Latency Trend — Last 20 Requests (ms)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={latencyTrend}>
            <CartesianGrid {...CHART_STYLE.grid} />
            <XAxis dataKey="i" tick={{ fill: "#6B7280", fontSize: 11 }} label={{ value: "request #", position: "insideBottomRight", offset: -5, fill: "#6B7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
            <Tooltip {...CHART_STYLE.tooltip} />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Satisfaction Trend */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Satisfaction Trend — Helpful vs Not Helpful</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={feedbackTrend}>
            <CartesianGrid {...CHART_STYLE.grid} />
            <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
            <Tooltip {...CHART_STYLE.tooltip} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="helpful" fill="#10B981" radius={[4, 4, 0, 0]} name="Helpful" />
            <Bar dataKey="not_helpful" fill="#EF4444" radius={[4, 4, 0, 0]} name="Not Helpful" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}