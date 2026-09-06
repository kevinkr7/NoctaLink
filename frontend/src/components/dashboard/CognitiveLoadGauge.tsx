import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CognitiveLoadGaugeProps {
  score: number | null;
  onClick?: () => void;
}

function getLoadBand(score: number | null): {
  label: string;
  color: string;
  trackColor: string;
  description: string;
} {
  if (score === null) {
    return {
      label: "No Data",
      color: "#6b7280",
      trackColor: "rgba(107,114,128,0.15)",
      description: "No cognitive load data recorded yet.",
    };
  }
  if (score <= 35) {
    return {
      label: "Low Load",
      color: "#22d3ee",
      trackColor: "rgba(34,211,238,0.15)",
      description: "Your cognitive system is operating at a relaxed state.",
    };
  }
  if (score <= 70) {
    return {
      label: "Moderate Load",
      color: "#a78bfa",
      trackColor: "rgba(167,139,250,0.15)",
      description: "Moderate engagement — a productive zone.",
    };
  }
  return {
    label: "High Load",
    color: "#f59e0b",
    trackColor: "rgba(245,158,11,0.15)",
    description: "Elevated cognitive load. Consider taking a break.",
  };
}

export function CognitiveLoadGauge({ score, onClick }: CognitiveLoadGaugeProps) {
  const SIZE = 180;
  const STROKE_WIDTH = 12;
  const R = (SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  // Arc covers 270° (¾ circle), starting from 135° (bottom-left)
  const ARC_LENGTH = CIRCUMFERENCE * 0.75;

  const band = getLoadBand(score);
  const pct = score === null ? 0 : Math.min(100, Math.max(0, score)) / 100;

  // Spring-animated fill
  const spring = useSpring(0, { stiffness: 40, damping: 15 });
  const dashOffset = useTransform(spring, (v) => ARC_LENGTH * (1 - v));

  useEffect(() => {
    spring.set(pct);
  }, [pct, spring]);

  // SVG rotation so the arc starts at bottom-left (135°)
  const rotation = 135;

  return (
    <div
      id="cognitive-load-gauge"
      className="hud-card p-5 flex flex-col gap-4 cursor-pointer group"
      onClick={onClick}
      title="Click for details"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Cognitive Load
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Latest reading
          </p>
        </div>
        <div
          className="rounded-full px-2.5 py-1 text-xs font-semibold border"
          style={{
            color: band.color,
            borderColor: `${band.color}40`,
            backgroundColor: `${band.color}18`,
          }}
        >
          {band.label}
        </div>
      </div>

      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            fill="none"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Background track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={band.trackColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              fill="none"
            />
            {/* Animated progress arc */}
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={band.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              fill="none"
              style={{
                filter: `drop-shadow(0 0 8px ${band.color}90)`,
              }}
            />
          </svg>

          {/* Center score */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ transform: "rotate(0deg)" }}
          >
            <motion.span
              key={score}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="font-display text-4xl font-bold"
              style={{ color: band.color }}
            >
              {score === null ? "—" : Math.round(score)}
            </motion.span>
            <span className="text-xs text-muted-foreground mt-0.5">/100</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-center text-muted-foreground leading-relaxed max-w-[200px] group-hover:text-muted-foreground/80 transition-colors">
          {band.description}
        </p>
      </div>

      {/* Live indicator */}
      {score !== null && (
        <div className="flex items-center justify-center gap-1.5">
          <div className="relative">
            <div
              className="h-1.5 w-1.5 rounded-full animate-status-ping absolute"
              style={{ backgroundColor: band.color }}
            />
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: band.color }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Live
          </span>
        </div>
      )}

      {score === null && (
        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          No session data
        </p>
      )}
    </div>
  );
}
