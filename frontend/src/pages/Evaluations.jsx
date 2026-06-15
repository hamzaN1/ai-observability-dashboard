import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function Evaluations() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/evaluations")
      .then((r) => r.json())
      .then((data) => { setEvals(data); setLoading(false); });
  }, []);

  const scoreColor = (score) => {
    if (score >= 0.75) return "text-green-400";
    if (score >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Evaluations</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="pb-3 pr-4">Prompt</th>
                <th className="pb-3 pr-4">Model</th>
                <th className="pb-3 pr-4">Relevance</th>
                <th className="pb-3 pr-4">Faithfulness</th>
                <th className="pb-3 pr-4">Completeness</th>
                <th className="pb-3 pr-4">Overall</th>
                <th className="pb-3">Hallucination</th>
              </tr>
            </thead>
            <tbody>
              {evals.map((e) => (
                <tr key={e.trace_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 text-gray-300 max-w-xs truncate">{e.prompt}</td>
                  <td className="py-3 pr-4 text-gray-400">{e.model}</td>
                  <td className={`py-3 pr-4 font-mono ${scoreColor(e.relevance)}`}>
                    {(e.relevance * 100).toFixed(0)}%
                  </td>
                  <td className={`py-3 pr-4 font-mono ${scoreColor(e.faithfulness)}`}>
                    {(e.faithfulness * 100).toFixed(0)}%
                  </td>
                  <td className={`py-3 pr-4 font-mono ${scoreColor(e.completeness)}`}>
                    {(e.completeness * 100).toFixed(0)}%
                  </td>
                  <td className={`py-3 pr-4 font-mono font-bold ${scoreColor(e.overall_score)}`}>
                    {(e.overall_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-3">
                    {e.hallucination_flag ? (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                        <ShieldAlert size={14} /> Flagged
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                        <ShieldCheck size={14} /> Clean
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {evals.length === 0 && (
            <p className="text-gray-500 text-center py-8">No evaluations yet. Send a chat first.</p>
          )}
        </div>
      )}
    </div>
  );
}