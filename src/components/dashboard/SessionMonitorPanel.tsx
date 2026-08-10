import { motion } from "framer-motion";
import { Activity, Clock, Brain, Zap, TrendingUp, PlayCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export interface CognitiveSession {
  id: number;
  session_name: string | null;
  cognitive_load_score: number | null;
  attention_stability: number | null;
  fatigue_score: number | null;
  status: string;
  started_at: string;
  ended_at: string | null;
}

interface SessionMonitorPanelProps {
  session: CognitiveSession | null;
  loading?: boolean;
  serverError?: string | null;
  onStartSession?: () => void;
}

function getDuration(startedAt: string): string {
  try {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  } catch {
    return "Unknown";
  }
}

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <span
        className="text-lg font-bold font-display"
        style={{ color: value === null ? "#6b7280" : color }}
      >
        {value === null ? "—" : `${value.toFixed(0)}`}
      </span>
    </div>
  );
}

export function SessionMonitorPanel({
  session,
  loading,
  serverError,
  onStartSession,
}: SessionMonitorPanelProps) {
  if (loading) {
    return (
      <div className="hud-card p-5 space-y-4 animate-pulse">
        <div className="h-4 w-44 bg-white/5 rounded" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasTableError =
    serverError &&
    (serverError.includes("does not exist") ||
      serverError.includes("relation") ||
      serverError.includes("undefined"));

  if (!session) {
    return (
      <div className="hud-card p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full bg-[var(--violet)]/10 animate-pulse-glow" />
          <PlayCircle className="relative h-14 w-14 text-muted-foreground/30" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white/60">
            No Active Cognitive Session
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[240px]">
            {hasTableError
              ? "Run the cognitive_sessions_migration.sql to enable session tracking."
              : "Start a focus session to begin real-time cognitive mapping."}
          </p>
        </div>
        {!hasTableError && (
          <button
            onClick={onStartSession}
            className="flex items-center gap-2 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/10 px-5 py-2.5 text-sm font-medium text-[var(--violet-glow)] transition hover:bg-[var(--violet)]/20"
          >
            <PlayCircle className="h-4 w-4" />
            Start Focus Session
          </button>
        )}
        {hasTableError && (
          <div className="text-[10px] text-muted-foreground/50 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 max-w-[280px] text-center">
            Apply migration: <code className="text-white/40">cognitive_sessions_migration.sql</code>
          </div>
        )}
      </div>
    );
  }

  const startedFormatted = (() => {
    try {
      return format(new Date(session.started_at), "HH:mm");
    } catch {
      return "—";
    }
  })();

  const duration = getDuration(session.started_at);

  const loadColor =
    session.cognitive_load_score === null
      ? "#6b7280"
      : session.cognitive_load_score <= 35
        ? "#22d3ee"
        : session.cognitive_load_score <= 70
          ? "#a78bfa"
          : "#f59e0b";

  return (
    <div className="hud-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Live Session
          </p>
          <p className="mt-0.5 font-display text-sm font-semibold text-white/90">
            {session.session_name ?? "Untitled Session"}
          </p>
        </div>
        {/* Live pulse */}
        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1">
          <div className="relative">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-status-ping absolute" />
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-green-400">
            Active
          </span>
        </div>
      </div>

      {/* Session meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Started {startedFormatted}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3.5 w-3.5" />
          <span>Duration: {duration}</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatChip
          icon={Brain}
          label="Cog. Load"
          value={session.cognitive_load_score}
          color={loadColor}
        />
        <StatChip
          icon={Zap}
          label="Attention"
          value={session.attention_stability}
          color="#22d3ee"
        />
        <StatChip
          icon={TrendingUp}
          label="Fatigue"
          value={session.fatigue_score}
          color={
            session.fatigue_score !== null && session.fatigue_score > 60
              ? "#f59e0b"
              : "#6b7280"
          }
        />
        <StatChip
          icon={Activity}
          label="Status"
          value={null}
          color="#a78bfa"
        />
      </div>

      {/* Fatigue trend text */}
      {session.fatigue_score !== null && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
            Fatigue Trend
          </p>
          <p className="text-xs text-white/70">
            {session.fatigue_score > 70
              ? "⚠ Rising fatigue — consider a short break"
              : session.fatigue_score > 45
                ? "Moderate fatigue — stay aware"
                : "Low fatigue — performing well"}
          </p>
        </div>
      )}
    </div>
  );
}
