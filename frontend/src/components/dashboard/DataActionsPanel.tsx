import { motion } from "framer-motion";
import {
  Upload,
  PlayCircle,
  History,
  RefreshCw,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

interface DataActionsPanelProps {
  twinStatus: "not_initialized" | "calibrating" | "active";
  onStartSession?: () => void;
  onUploadEEG?: () => void;
}

const actions = [
  {
    id: "upload-eeg",
    icon: Upload,
    label: "Upload EEG Data",
    description: "Import sleep EEG recordings",
    color: "#22d3ee",
    bgColor: "rgba(34,211,238,0.08)",
    borderColor: "rgba(34,211,238,0.2)",
    action: "upload",
  },
  {
    id: "start-session",
    icon: PlayCircle,
    label: "Start Focus Session",
    description: "Begin real-time cognitive mapping",
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.08)",
    borderColor: "rgba(167,139,250,0.2)",
    action: "session",
  },
  {
    id: "sleep-history",
    icon: History,
    label: "View Sleep History",
    description: "Browse past sleep recordings",
    color: "#34d399",
    bgColor: "rgba(52,211,153,0.08)",
    borderColor: "rgba(52,211,153,0.2)",
    action: "history",
  },
  {
    id: "recalibrate",
    icon: RefreshCw,
    label: "Recalibrate Twin",
    description: "Re-run the initialization questionnaire",
    color: "#fbbf24",
    bgColor: "rgba(251,191,36,0.08)",
    borderColor: "rgba(251,191,36,0.2)",
    action: "recalibrate",
  },
] as const;

export function DataActionsPanel({
  twinStatus,
  onStartSession,
  onUploadEEG,
}: DataActionsPanelProps) {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        onUploadEEG?.();
        break;
      case "session":
        onStartSession?.();
        break;
      case "history":
        // Future: navigate to history route
        break;
      case "recalibrate":
        navigate({ to: "/onboarding" });
        break;
    }
  };

  return (
    <div className="hud-card p-5 space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Quick Actions
      </p>

      {/* Continue initialization banner */}
      {twinStatus === "not_initialized" && (
        <Link to="/onboarding">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center gap-3 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/10 p-3.5 cursor-pointer"
          >
            <BrainCircuit className="h-5 w-5 text-[var(--violet-glow)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--violet-glow)]">
                Complete Twin Initialization
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Your cognitive profile setup is incomplete.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--violet-glow)]/60 flex-shrink-0" />
          </motion.div>
        </Link>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              id={action.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction(action.action)}
              className="flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all hover:brightness-110"
              style={{
                backgroundColor: action.bgColor,
                borderColor: action.borderColor,
              }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: action.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80 leading-tight">
                  {action.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
