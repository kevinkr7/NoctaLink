import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export interface InsightInputs {
  cognitiveLoad: number | null;
  previousLoad: number | null;
  sleepQuality: number | null;
  recoveryScore: number | null;
  fatigueScore: number | null;
  attentionScore: number | null;
  sessionCount: number;
}

export interface Insight {
  id: string;
  text: string;
  type: "positive" | "warning" | "neutral";
}

export function generateInsights(inputs: InsightInputs): Insight[] {
  const {
    cognitiveLoad,
    previousLoad,
    sleepQuality,
    recoveryScore,
    fatigueScore,
    attentionScore,
    sessionCount,
  } = inputs;

  if (sessionCount < 2) {
    return [];
  }

  const insights: Insight[] = [];

  // Cognitive load vs previous session
  if (cognitiveLoad !== null && previousLoad !== null) {
    const delta = cognitiveLoad - previousLoad;
    if (delta > 10) {
      insights.push({
        id: "load-up",
        text: `Your cognitive load is ${Math.abs(Math.round(delta))} points higher than your previous session.`,
        type: "warning",
      });
    } else if (delta < -10) {
      insights.push({
        id: "load-down",
        text: `Your cognitive load has decreased by ${Math.abs(Math.round(delta))} points since last session — you are recovering well.`,
        type: "positive",
      });
    } else {
      insights.push({
        id: "load-stable",
        text: "Your current load is stable compared to the previous session.",
        type: "neutral",
      });
    }
  }

  // Sleep vs cognitive performance
  if (sleepQuality !== null && cognitiveLoad !== null) {
    if (sleepQuality < 45 && cognitiveLoad > 60) {
      insights.push({
        id: "sleep-load",
        text: "Sleep recovery is low, which may be amplifying your current high cognitive load.",
        type: "warning",
      });
    } else if (sleepQuality >= 75 && cognitiveLoad <= 50) {
      insights.push({
        id: "sleep-good",
        text: "Good sleep quality is supporting a healthy cognitive load level today.",
        type: "positive",
      });
    }
  }

  // Recovery vs tasks
  if (recoveryScore !== null && recoveryScore < 40) {
    insights.push({
      id: "recovery-low",
      text: "Sleep recovery is low, so high-load tasks may be harder today. Consider lighter work.",
      type: "warning",
    });
  }

  // Attention stability
  if (attentionScore !== null && attentionScore < 40) {
    insights.push({
      id: "attention-low",
      text: `Attention stability is at ${Math.round(attentionScore)}% — tasks requiring sustained focus may feel more difficult.`,
      type: "warning",
    });
  } else if (attentionScore !== null && attentionScore >= 75) {
    insights.push({
      id: "attention-high",
      text: `High attention stability at ${Math.round(attentionScore)}% — an excellent time for complex cognitive tasks.`,
      type: "positive",
    });
  }

  // Fatigue
  if (fatigueScore !== null && fatigueScore > 70) {
    insights.push({
      id: "fatigue-high",
      text: `Fatigue score is elevated at ${Math.round(fatigueScore)}/100. A short break or rest is recommended.`,
      type: "warning",
    });
  }

  return insights.slice(0, 4); // Cap at 4 insights
}

const TYPE_STYLES = {
  positive: {
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    dot: "#22d3ee",
    text: "text-white/75",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    dot: "#f59e0b",
    text: "text-white/75",
  },
  neutral: {
    border: "border-white/8",
    bg: "bg-white/[0.02]",
    dot: "#6b7280",
    text: "text-muted-foreground",
  },
};

interface InsightsPanelProps {
  inputs: InsightInputs;
  loading?: boolean;
}

export function InsightsPanel({ inputs, loading }: InsightsPanelProps) {
  const insights = generateInsights(inputs);
  const hasEnoughData = inputs.sessionCount >= 2;

  if (loading) {
    return (
      <div className="hud-card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-white/5 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="hud-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400/60" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Live Insights
        </p>
      </div>

      {!hasEnoughData ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            More sessions are needed to generate personalized insights. Complete
            at least 2 cognitive or sleep sessions.
          </p>
        </div>
      ) : insights.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Metrics look stable. No notable patterns detected yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const style = TYPE_STYLES[insight.type];
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-3`}
              >
                <div
                  className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.dot }}
                />
                <p className={`text-xs leading-relaxed ${style.text}`}>
                  {insight.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
