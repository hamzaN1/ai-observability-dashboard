import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#34d399"];

export default function Cost() {
  const [cost, setCost] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/cost")
      .then((r) => r.json())
      .then(setCost);
  }, []);

  if (!cost) return <p className="p-6 text-gray-400">Loading...</p>;

  const modelData = Object.entries(cost.cost_by_model).map(([model, value]) => ({
    name: model,
    cost: value,
  }));

  const dayData = Object.entries(cost.cost_by_day)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({
      day: day.slice(5), // show MM-DD only
      cost: value,
    }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Cost Analysis</h1>

      {/* Total cost card */}
      <div className="bg-gray-800 rounded-xl p-5 mb-8 inline-block">
        <p className="text-gray-400 text-sm mb-1">Total Estimated Cost</p>
        <p className="text-3xl font-bold text-green-400">
          ${cost.total_cost_usd.toFixed(4)}
        </p>
        <p className="text-gray-500 text-xs mt-1">Based on simulated token rates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost by model */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Cost by Model</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={modelData}
                dataKey="cost"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {modelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `$${v.toFixed(6)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by day */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Cost by Day</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dayData}>
              <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(4)}`} />
              <Tooltip formatter={(v) => `$${v.toFixed(6)}`} />
              <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model breakdown table */}
      <div className="bg-gray-800 rounded-xl p-5 mt-8">
        <h2 className="text-white font-semibold mb-4">Breakdown by Model</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="pb-2 text-left">Model</th>
              <th className="pb-2 text-right">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            {modelData.map((m) => (
              <tr key={m.name} className="border-b border-gray-700">
                <td className="py-2 text-gray-300">{m.name}</td>
                <td className="py-2 text-right text-green-400 font-mono">
                  ${m.cost.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}