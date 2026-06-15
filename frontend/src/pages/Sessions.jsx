import { useEffect, useState } from "react";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/traces?limit=200")
      .then((r) => r.json())
      .then((traces) => {
        // Group traces by session_id
        const grouped = traces.reduce((acc, trace) => {
          if (!acc[trace.session_id]) {
            acc[trace.session_id] = {
              session_id: trace.session_id,
              user_id: trace.user_id,
              traces: [],
              total_tokens: 0,
              started_at: trace.created_at,
            };
          }
          acc[trace.session_id].traces.push(trace);
          acc[trace.session_id].total_tokens += trace.total_tokens;
          return acc;
        }, {});

        setSessions(Object.values(grouped));
        setLoading(false);
      });
  }, []);

  const [selected, setSelected] = useState(null);

  return (
    <div className="p-6 flex gap-6">
      {/* Session list */}
      <div className="w-80 shrink-0">
        <h1 className="text-2xl font-bold text-white mb-4">Sessions</h1>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => setSelected(s)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selected?.session_id === s.session_id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-500"
                }`}
              >
                <p className="text-white text-sm font-medium truncate">
                  {s.user_id}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {s.traces.length} messages · {s.total_tokens} tokens
                </p>
                <p className="text-gray-500 text-xs mt-1 font-mono truncate">
                  {s.session_id.slice(0, 16)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session detail */}
      <div className="flex-1">
        {selected ? (
          <>
            <h2 className="text-white font-semibold mb-4">
              Session · {selected.session_id.slice(0, 20)}...
            </h2>
            <div className="space-y-4">
              {selected.traces.map((trace) => (
                <div key={trace.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      trace.status === "success"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {trace.status}
                    </span>
                    <span className="text-gray-500 text-xs">{trace.latency_ms}ms</span>
                  </div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Prompt</p>
                  <p className="text-gray-200 text-sm mb-3">{trace.prompt}</p>
                  {trace.response && (
                    <>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Response</p>
                      <p className="text-gray-300 text-sm">{trace.response}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a session to inspect it</p>
          </div>
        )}
      </div>
    </div>
  );
}