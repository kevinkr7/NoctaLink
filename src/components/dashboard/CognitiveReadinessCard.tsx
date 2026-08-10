import { motion } from "framer-motion";
import { Shield, AlertTriangle, Battery, BrainCircuit } from "lucide-react";

export type ReadinessLevel =
  | "ready"
  | "slightly_strained"
  | "overloaded"
  | "recovery_needed"
  | "insufficient_data";

export interface ReadinessInputs {
  sleepQuality: number | null;
  recoveryScore: number | null;
  cognitiveLoad: number | null;
  fatigueScore: number | null;
}

const READINESS_CONFIG: Record<
  ReadinessLevel,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Shield;
  }
> = {
  ready: {
    label: "Ready",
    description: "Your cognitive system is well-rested and primed for peak performance.",
    color: "#22d3ee",
    bgColor: "rgba(34,211,238,0.08)",
    borderColor: "rgba(34,211,238,0.25)",
    icon: Shield,
  },
  slightly_strained: {
    label: "Slightly Strained",
    description: "Some cognitive fatigue is present. Manageable, but monitor load closely.",
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.08)",
    borderColor: "rgba(167,139,250,0.25)",
    icon: BrainCircuit,
  },
  overloaded: {
    label: "Mentally Overloaded",
    description: "High cognitive demand detected. Reduce task complexity and take breaks.",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    icon: AlertTriangle,
  },
  recovery_needed: {
    label: "Recovery Recommended",
    description: "Sleep quality and recovery are low. Prioritize rest before high-load tasks.",
    color: "#f87171",
    bgColor: "rgba(248,113,113,0.08)",
    borderColor: "rgba(248,113,113,0.25)",
    icon: Battery,
  },
  insufficient_data: {
    label: "Insufficient Data",
    description: "More sessions are needed to calculate your cognitive readiness accurately.",
    color: "#6b7280",
    bgColor: "rgba(107,114,128,0.08)",
    borderColor: "rgba(107,114,128,0.2)",
    icon: BrainCircuit,
  },
};

export function computeReadiness(inputs: ReadinessInputs): ReadinessLevel {
  const { sleepQuality, recoveryScore, cognitiveLoad, fatigueScore } = inputs;

  // Need at least some data
  const hasData =
    sleepQuality !== null ||
    recoveryScore !== null ||
    cognitiveLoad !== null ||
    fatigueScore !== null;

  if (!hasData) return "insufficient_data";

  let score = 0;
  let count = 0;

  // Sleep quality: higher is better (0-100 scale)
  if (sleepQuality !== null) {
    score += sleepQuality;
    count++;
  }

  // Recovery: higher is better (0-100 scale)
  if (recoveryScore !== null) {
    score += recoveryScore;
    count++;
  }

  // Cognitive load: lower is better (invert)
  if (cognitiveLoad !== null) {
    score += 100 - cognitiveLoad;
    count++;
  }

  // Fatigue: lower is better (invert, 0-100 scale)
  if (fatigueScore !== null) {
    score += 100 - fatigueScore;
    count++;
  }

  if (count === 0) return "insufficient_data";

  const avg = score / count;

  // Specific override: very low recovery OR very high fatigue → recovery_needed
  if (
    (recoveryScore !== null && recoveryScore < 30) ||
    (fatigueScore !== null && fatigueScore > 75)
  ) {
    return "recovery_needed";
  }

  // High cognitive load override → overloaded
  if (cognitiveLoad !== null && cognitiveLoad > 70) {
    return "overloaded";
  }

  if (avg >= 70) return "ready";
  if (avg >= 50) return "slightly_strained";
  if (avg >= 35) return "overloaded";
  return "recovery_needed";
}

interface ReadinessFactorRowProps {
  label: string;
  value: number | null;
  goodThreshold: number;
  invert?: boolean;
  unit?: string;
}

function ReadinessFactorRow({
  label,
  value,
  goodThreshold,
  invert = false,
  unit = "",
}: ReadinessFactorRowProps) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground/40">No data</span>
      </div>
    );
  }

  const isGood = invert ? value < goodThreshold : value >= goodThreshold;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-white/80">
          {value.toFixed(0)}
          {unit}
        </span>
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: isGood ? "#22d3ee" : "#f59e0b" }}
        />
      </div>
    </div>
  );
}

interface CognitiveReadinessCardProps {
  inputs: ReadinessInputs;
  loading?: boolean;
  onClick?: () => void;
}

export function CognitiveReadinessCard({
  inputs,
  loading,
  onClick,
}: CognitiveReadinessCardProps) {
  const level = computeReadiness(inputs);
  const config = READINESS_CONFIG[level];
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="hud-card p-5 space-y-4 animate-pulse">
        <div className="h-4 w-40 bg-white/5 rounded" />
        <div className="h-16 w-full bg-white/5 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="hud-card p-5 space-y-4 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Cognitive Readiness
      </p>

      {/* Status badge */}
      <motion.div
        key={level}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl p-3.5"
        style={{
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {config.description}
          </p>
        </div>
      </motion.div>

      {/* Factor breakdown */}
      <div className="space-y-0">
        <ReadinessFactorRow
          label="Sleep Quality"
          value={inputs.sleepQuality}
          goodThreshold={65}
          unit="/100"
        />
        <ReadinessFactorRow
          label="Recovery Index"
          value={inputs.recoveryScore}
          goodThreshold={60}
          unit="/100"
        />
        <ReadinessFactorRow
          label="Cognitive Load"
          value={inputs.cognitiveLoad}
          goodThreshold={70}
          invert
          unit="/100"
        />
        <ReadinessFactorRow
          label="Fatigue Score"
          value={inputs.fatigueScore}
          goodThreshold={60}
          invert
          unit="/100"
        />
      </div>
    </motion.div>
  );
}
