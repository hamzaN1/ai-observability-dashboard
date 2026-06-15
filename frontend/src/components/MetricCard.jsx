export default function MetricCard({ label, value, sub, accent = false, pulse = false }) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 ${
        pulse ? "card-pulse" : ""
      }`}
    >
      <p className="text-xs text-muted uppercase tracking-widest font-medium">{label}</p>
      <p
        className={`text-3xl font-bold font-mono ${
          accent ? "text-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}