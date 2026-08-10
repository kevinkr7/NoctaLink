import { motion } from "framer-motion";
import { Coffee, Wind, BookOpen, Zap, Heart, AlertTriangle } from "lucide-react";

export interface RecommendationInputs {
  cognitiveLoad: number | null;
  fatigueScore: number | null;
  recoveryScore: number | null;
  sleepQuality: number | null;
  attentionScore: number | null;
}

export interface Recommendation {
  id: string;
  icon: typeof Coffee;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  color: string;
}

const PRIORITY_STYLES = {
  high: {
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
  },
  medium: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  low: {
    border: "border-cyan-500/15",
    bg: "bg-cyan-500/[0.04]",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/15",
  },
};

export function generateRecommendations(
  inputs: RecommendationInputs
): Recommendation[] {
  const { cognitiveLoad, fatigueScore, recoveryScore, sleepQuality, attentionScore } =
    inputs;

  const recs: Recommendation[] = [];

  // Recovery needed — highest priority
  if (recoveryScore !== null && recoveryScore < 35) {
    recs.push({
      id: "recovery",
      icon: Heart,
      title: "Recovery Needed",
      detail:
        "Your recovery index is critically low. Prioritize sleep and avoid high-load tasks today.",
      priority: "high",
      color: "#f87171",
    });
  }

  // Take a break — high cognitive load + high fatigue
  if (
    cognitiveLoad !== null &&
    cognitiveLoad > 70 &&
    fatigueScore !== null &&
    fatigueScore > 60
  ) {
    recs.push({
      id: "break",
      icon: Wind,
      title: "Take a Break",
      detail:
        "High cognitive load with elevated fatigue detected. Step away for 10–20 minutes.",
      priority: "high",
      color: "#f59e0b",
    });
  }

  // Avoid intense work — moderate-high load
  if (
    cognitiveLoad !== null &&
    cognitiveLoad > 65 &&
    !(fatigueScore !== null && fatigueScore > 60)
  ) {
    recs.push({
      id: "avoid-intense",
      icon: AlertTriangle,
      title: "Avoid Intense Work",
      detail:
        "Cognitive load is elevated. Stick to administrative or lower-complexity tasks.",
      priority: "medium",
      color: "#f59e0b",
    });
  }

  // Start low-load task — moderate fatigue
  if (
    fatigueScore !== null &&
    fatigueScore > 45 &&
    fatigueScore <= 65 &&
    (cognitiveLoad === null || cognitiveLoad <= 65)
  ) {
    recs.push({
      id: "low-load",
      icon: BookOpen,
      title: "Start a Low-Load Task",
      detail:
        "Moderate fatigue suggests lighter cognitive work — reading, reviewing, or organizing are good options.",
      priority: "medium",
      color: "#a78bfa",
    });
  }

  // Good time for deep work — all metrics favorable
  if (
    (cognitiveLoad === null || cognitiveLoad <= 50) &&
    (fatigueScore === null || fatigueScore <= 40) &&
    (sleepQuality === null || sleepQuality >= 65) &&
    (attentionScore === null || attentionScore >= 65)
  ) {
    recs.push({
      id: "deep-work",
      icon: Zap,
      title: "Good Time for Deep Work",
      detail:
        "Metrics are favorable. This is an optimal window for focused, complex cognitive tasks.",
      priority: "low",
      color: "#22d3ee",
    });
  }

  // Caffeine guidance
  if (fatigueScore !== null && fatigueScore > 55 && recoveryScore !== null && recoveryScore > 40) {
    recs.push({
      id: "caffeine",
      icon: Coffee,
      title: "Moderate Caffeine May Help",
      detail:
        "Fatigue is elevated but recovery is adequate. A moderate caffeine intake may help sustain focus.",
      priority: "low",
      color: "#fbbf24",
    });
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 4);
}

interface RecommendationsPanelProps {
  inputs: RecommendationInputs;
  loading?: boolean;
}

export function RecommendationsPanel({
  inputs,
  loading,
}: RecommendationsPanelProps) {
  const recs = generateRecommendations(inputs);
  const hasData = Object.values(inputs).some((v) => v !== null);

  if (loading) {
    return (
      <div className="hud-card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="hud-card p-5 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Recommendations
      </p>

      {!hasData ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            No data available yet. Recommendations will appear after your first
            session is recorded.
          </p>
        </div>
      ) : recs.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-muted-foreground">
            All metrics are in a healthy range. No specific recommendations
            right now — keep it up!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recs.map((rec, i) => {
            const style = PRIORITY_STYLES[rec.priority];
            const Icon = rec.icon;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-3`}
              >
                <div
                  className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${rec.color}18` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: rec.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-white/85">
                      {rec.title}
                    </p>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-medium ${style.badge}`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {rec.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
