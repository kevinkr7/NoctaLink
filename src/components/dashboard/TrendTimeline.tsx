import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

export interface PredictionPoint {
  prediction_date: string;
  cognitive_readiness: number | null;
  fatigue_score: number | null;
  attention_score: number | null;
}

export interface SleepPoint {
  sleep_date: string;
  sleep_quality_score: number | null;
}

interface TrendTimelineProps {
  predictions: PredictionPoint[];
  sleepSessions: SleepPoint[];
  loading?: boolean;
}

type Tab = "cognitive" | "sleep" | "fatigue";

const TABS: { id: Tab; label: string }[] = [
  { id: "cognitive", label: "Cognitive Load" },
  { id: "sleep", label: "Sleep Quality" },
  { id: "fatigue", label: "Fatigue" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-1.5 w-3 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>
            {p.value !== null && p.value !== undefined
              ? Number(p.value).toFixed(1)
              : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendTimeline({
  predictions,
  sleepSessions,
  loading,
}: TrendTimelineProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cognitive");

  if (loading) {
    return (
      <div className="hud-card p-5 space-y-4 animate-pulse">
        <div className="h-4 w-36 bg-white/5 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 w-24 bg-white/5 rounded-full" />
          ))}
        </div>
        <div className="h-56 bg-white/5 rounded-xl" />
      </div>
    );
  }

  // Prepare cognitive load data from predictions
  const cognitiveData = predictions
    .filter((p) => p.cognitive_readiness !== null)
    .slice(-14)
    .map((p) => ({
      date: (() => {
        try {
          return format(new Date(p.prediction_date), "MMM d");
        } catch {
          return "—";
        }
      })(),
      "Cognitive Readiness": p.cognitive_readiness,
      Attention: p.attention_score,
    }));

  // Prepare sleep quality data
  const sleepData = sleepSessions
    .filter((s) => s.sleep_quality_score !== null)
    .slice(-14)
    .map((s) => ({
      date: (() => {
        try {
          return format(new Date(s.sleep_date), "MMM d");
        } catch {
          return "—";
        }
      })(),
      "Sleep Quality": s.sleep_quality_score,
    }));

  // Fatigue trend from predictions
  const fatigueData = predictions
    .filter((p) => p.fatigue_score !== null)
    .slice(-14)
    .map((p) => ({
      date: (() => {
        try {
          return format(new Date(p.prediction_date), "MMM d");
        } catch {
          return "—";
        }
      })(),
      Fatigue: p.fatigue_score,
    }));

  const isEmpty =
    (activeTab === "cognitive" && cognitiveData.length === 0) ||
    (activeTab === "sleep" && sleepData.length === 0) ||
    (activeTab === "fatigue" && fatigueData.length === 0);

  const chartAxisStyle = {
    fontSize: 10,
    fill: "rgba(255,255,255,0.35)",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  return (
    <div className="hud-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trend Timeline
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            Last 14 data points
          </p>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--violet)]/20 border border-[var(--violet)]/40 text-[var(--violet-glow)]"
                : "border border-white/8 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="h-52">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">
              No{" "}
              {activeTab === "cognitive"
                ? "prediction"
                : activeTab === "sleep"
                  ? "sleep quality"
                  : "fatigue"}{" "}
              data yet. Data will appear after your first recorded session.
            </p>
          </div>
        ) : activeTab === "cognitive" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cognitiveData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}
              />
              <Area
                type="monotone"
                dataKey="Cognitive Readiness"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#cogGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="Attention"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#attGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : activeTab === "sleep" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sleepData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Sleep Quality"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#sleepGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={fatigueData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Fatigue"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#fatGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
