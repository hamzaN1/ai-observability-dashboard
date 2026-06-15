import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, List, AlertCircle, MessagesSquare, FlaskConical, DollarSign, Scale} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Traces from "./pages/Traces";
import Errors from "./pages/Errors";
import Sessions from "./pages/Sessions";
import Evaluations from "./pages/Evaluations";
import Cost from "./pages/Cost";
import Compare from "./pages/Compare";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/traces", icon: List, label: "Traces" },
  { to: "/errors", icon: AlertCircle, label: "Errors" },
  { to: "/sessions", icon: MessagesSquare, label: "Sessions" },
  { to: "/evaluations", icon: FlaskConical, label: "Evaluations" },
  { to: "/cost", icon: DollarSign, label: "Cost" },
  { to: "/compare", icon: Scale, label: "Model Comparison" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-border">
            <span className="text-accent font-bold text-lg tracking-tight">⬡ ObserveAI</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-border">
            <p className="text-xs text-muted font-mono">v1.0.0 · local</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-bg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/traces" element={<Traces />} />
            <Route path="/errors" element={<Errors />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/cost" element={<Cost />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}