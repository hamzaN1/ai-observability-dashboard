import { useEffect, useRef, useState } from "react";

export default function LiveLog() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/logs");
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [data, ...prev].slice(0, 50)); // keep last 50
    };

    return () => ws.close();
  }, []);

  return (
    <div className="bg-gray-950 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
        <span className="text-gray-400 text-xs">{connected ? "Live" : "Disconnected"}</span>
      </div>

      {logs.length === 0 && (
        <p className="text-gray-600 text-xs">Waiting for requests...</p>
      )}

      {logs.map((log, i) => (
        <div key={i} className="mb-2 border-b border-gray-800 pb-2">
          <span className={`text-xs font-semibold ${log.status === "success" ? "text-green-400" : "text-red-400"}`}>
            [{log.status.toUpperCase()}]
          </span>{" "}
          <span className="text-blue-300">{log.model}</span>{" "}
          <span className="text-gray-300">{log.prompt}</span>
          <div className="text-gray-500 text-xs mt-0.5">
            {log.latency_ms}ms · {log.total_tokens} tokens · {log.user_id}
          </div>
        </div>
      ))}
    </div>
  );
}