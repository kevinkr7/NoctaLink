import { motion } from "framer-motion";
import { BrainCircuit, Moon, Upload } from "lucide-react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

export interface SleepSession {
  id: number;
  sleep_date: string;
  sleep_quality_score: number | null;
  sleep_duration: number | null;
  created_at: string;
}

export interface EEGFeatures {
  delta_power: number | null;
  theta_power: number | null;
  alpha_power: number | null;
  beta_power: number | null;
  rem_percentage: number | null;
  deep_sleep_percentage: number | null;
  signal_quality: number | null;
}

interface SleepEEGPanelProps {
  session: SleepSession | null;
  eeg: EEGFeatures | null;
  loading?: boolean;
  onMetricClick?: (metric: string) => void;
}

function MetricBar({
  label,
  value,
  max,
  color,
  unit = "",
  onClick,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  unit?: string;
  onClick?: () => void;
}) {
  const pct = value === null ? 0 : Math.min(100, (value / max) * 100);
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      title={`Click to focus on ${label}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground group-hover:text-white/70 transition-colors">
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: value === null ? "#6b7280" : color }}
        >
          {value === null ? "—" : `${value.toFixed(2)}${unit}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </button>
  );
}

export function SleepEEGPanel({
  session,
  eeg,
  loading,
  onMetricClick,
}: SleepEEGPanelProps) {
  if (loading) {
    return (
      <div className="hud-card p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-1.5 w-full bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="hud-card p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
        <Moon className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <h3 className="font-display text-sm font-semibold text-white/60">
            No Sleep EEG Baseline
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[240px]">
            Upload or record sleep EEG data to initialize your cognitive twin.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-[var(--violet)] hover:text-white">
          <Upload className="h-3.5 w-3.5" />
          Upload EEG Data
        </button>
      </div>
    );
  }

  const sleepQuality = session.sleep_quality_score;
  const qualityColor =
    sleepQuality === null
      ? "#6b7280"
      : sleepQuality >= 70
        ? "#22d3ee"
        : sleepQuality >= 45
          ? "#a78bfa"
          : "#f59e0b";

  const recordedAt = (() => {
    try {
      return format(new Date(session.sleep_date), "MMM d, yyyy");
    } catch {
      return "Unknown date";
    }
  })();

  const remNremBalance =
    eeg?.rem_percentage !== null && eeg?.deep_sleep_percentage !== null
      ? `${eeg?.rem_percentage?.toFixed(0)}% REM / ${eeg?.deep_sleep_percentage?.toFixed(0)}% NREM`
      : null;

  return (
    <div className="hud-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Sleep EEG Biomarkers
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            Last recording: {recordedAt}
          </p>
        </div>
        <BrainCircuit className="h-4 w-4 text-muted-foreground/40" />
      </div>

      {/* Quality score */}
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            backgroundColor: `${qualityColor}18`,
            border: `1px solid ${qualityColor}40`,
            color: qualityColor,
          }}
        >
          {sleepQuality === null ? "—" : Math.round(sleepQuality)}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/80">Sleep Quality Score</p>
          <p className="text-[10px] text-muted-foreground">
            {sleepQuality === null
              ? "No quality score recorded"
              : sleepQuality >= 70
                ? "Good sleep quality"
                : sleepQuality >= 45
                  ? "Moderate sleep quality"
                  : "Poor sleep quality — recovery may be impaired"}
          </p>
        </div>
      </div>

      {/* EEG Metrics */}
      {eeg ? (
        <div className="space-y-3">
          <MetricBar
            label="Delta Power (Deep Sleep)"
            value={eeg.delta_power}
            max={100}
            color="#22d3ee"
            onClick={() => onMetricClick?.("Delta Power")}
          />
          <MetricBar
            label="Theta Power (Memory)"
            value={eeg.theta_power}
            max={100}
            color="#a78bfa"
            onClick={() => onMetricClick?.("Theta Power")}
          />
          <MetricBar
            label="Alpha Power (Relaxation)"
            value={eeg.alpha_power}
            max={100}
            color="#34d399"
            onClick={() => onMetricClick?.("Alpha Power")}
          />

          {remNremBalance && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                REM / NREM Balance
              </p>
              <p className="text-xs font-semibold text-white/80">
                {remNremBalance}
              </p>
            </div>
          )}

          {eeg.signal_quality !== null && (
            <MetricBar
              label="Signal Quality"
              value={eeg.signal_quality}
              max={100}
              color="#fbbf24"
              unit="%"
              onClick={() => onMetricClick?.("Signal Quality")}
            />
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50 text-center py-3">
          No EEG feature data linked to this sleep session.
        </p>
      )}

      {/* Duration */}
      {session.sleep_duration !== null && (
        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
          <span className="text-muted-foreground">Sleep duration</span>
          <span className="font-semibold text-white/70">
            {session.sleep_duration}h
          </span>
        </div>
      )}
    </div>
  );
}
