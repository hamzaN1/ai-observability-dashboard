import { useEffect, useState } from "react";
import { getTraces, postFeedback } from "../lib/api";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Search, RotateCcw } from "lucide-react";

const STATUS_STYLE = {
  success: "bg-success/10 text-success",
  failure: "bg-danger/10 text-danger",
};

function TraceRow({ trace }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [replay, setReplay] = useState(null);
  const [replaying, setReplaying] = useState(false);

  const sendFeedback = async (helpful) => {
    await postFeedback(trace.id, helpful);
    setFeedback(helpful);
  };

  const handleReplay = async () => {
    setReplaying(true);
    try {
      const res = await fetch(`http://localhost:8000/replay/${trace.id}`, {
        method: "POST",
      });
      const data = await res.json();
      setReplay(data);
    } catch (error) {
      console.error("Failed to replay trace:", error);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-surface hover:bg-white/5 transition-colors text-left"
      >
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${STATUS_STYLE[trace.status] || STATUS_STYLE.failure}`}>
          {trace.status}
        </span>
        <span className="text-xs font-mono text-muted w-64 truncate">{trace.id}</span>
        <span className="text-sm text-white flex-1 truncate">{trace.prompt}</span>
        <span className="text-xs text-muted font-mono">{trace.model}</span>
        <span className="text-xs text-muted font-mono w-20 text-right">{Math.round(trace.latency_ms)}ms</span>
        <span className="text-muted ml-2">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 py-4 bg-bg border-t border-border space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <p className="text-muted mb-1 uppercase tracking-widest">Prompt</p>
              <p className="text-white bg-surface p-3 rounded-lg">{trace.prompt}</p>
            </div>
            <div>
              <p className="text-muted mb-1 uppercase tracking-widest">Response</p>
              <p className="text-white bg-surface p-3 rounded-lg min-h-[60px]">
                {trace.response || <span className="text-danger">{trace.error_message || "No response"}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-muted">
            <span>Tokens: <span className="text-white">{trace.prompt_tokens}p + {trace.completion_tokens}c = {trace.total_tokens}</span></span>
            <span>User: <span className="text-white">{trace.user_id}</span></span>
            <span>Session: <span className="text-white truncate max-w-[140px] inline-block align-bottom">{trace.session_id}</span></span>
            <span>Time: <span className="text-white">{new Date(trace.created_at).toLocaleString()}</span></span>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Was this response helpful?</span>
            <button
              onClick={() => sendFeedback(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                feedback === true
                  ? "bg-success/10 border-success text-success"
                  : "border-border text-muted hover:border-success hover:text-success"
              }`}
            >
              <ThumbsUp size={12} /> Helpful
            </button>
            <button
              onClick={() => sendFeedback(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                feedback === false
                  ? "bg-danger/10 border-danger text-danger"
                  : "border-border text-muted hover:border-danger hover:text-danger"
              }`}
            >
              <ThumbsDown size={12} /> Not helpful
            </button>
          </div>

          {/* Replay Section */}
          <div className="mt-6 border-t border-border/50 pt-4">
            <button
              onClick={handleReplay}
              disabled={replaying}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 
                         disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              <RotateCcw size={14} className={replaying ? "animate-spin" : ""} />
              {replaying ? "Replaying..." : "Replay Prompt"}
            </button>

            {replay && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-muted text-xs font-medium mb-2 uppercase tracking-wide">
                    Original Response
                  </p>
                  <p className="text-white text-sm whitespace-pre-wrap">{replay.original_response}</p>
                  <p className="text-muted text-xs mt-3">{replay.original_latency_ms}ms</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-indigo-400 text-xs font-medium mb-2 uppercase tracking-wide">
                    Replayed Response
                  </p>
                  <p className="text-white text-sm whitespace-pre-wrap">{replay.replayed_response}</p>
                  <p className="text-muted text-xs mt-3">{replay.replayed_latency_ms}ms</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Traces() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getTraces(100).then(data => {
      setTraces(data);
      setLoading(false);
    });
  }, []);

  const filtered = traces.filter(
    t =>
      t.prompt.toLowerCase().includes(search.toLowerCase()) ||
      t.model.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Traces</h1>
          <p className="text-sm text-muted mt-1">Every LLM interaction, inspectable</p>
        </div>
        <span className="text-xs font-mono text-muted">{filtered.length} traces</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by prompt, model, or status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-muted text-sm font-mono animate-pulse">Loading traces…</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(trace => (
            <TraceRow key={trace.id} trace={trace} />
          ))}
        </div>
      )}
    </div>
  );
}