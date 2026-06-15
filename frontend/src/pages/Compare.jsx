import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function Compare() {
  const [prompt, setPrompt] = useState("");
  const [modelA, setModelA] = useState("llama3.2");
  const [modelB, setModelB] = useState("mistral");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/compare`, {
        prompt,
        model_a: modelA,
        model_b: modelB,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Model Comparison</h1>

      <div className="bg-gray-900 rounded-xl p-5 mb-6">
        <textarea
          className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm mb-4 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a prompt to run against both models..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex gap-3 items-center">
          <input
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm w-40"
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            placeholder="Model A"
          />
          <span className="text-gray-500 text-sm">vs</span>
          <input
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm w-40"
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            placeholder="Model B"
          />
          <button
            onClick={run}
            disabled={loading}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Running..." : "Compare"}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-4">
          {[result.model_a, result.model_b].map((m) => (
            <div key={m.model} className="bg-gray-900 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-blue-400">{m.model}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                  {m.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                <span>⏱ {m.latency_ms}ms</span>
                <span>🔢 {m.total_tokens} tokens</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {m.response || "No response"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}