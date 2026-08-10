import { motion } from "framer-motion";
import { User, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export type TwinStatus = "not_initialized" | "calibrating" | "active";

export interface UserProfile {
  full_name: string | null;
  email: string | null;
  updated_at: string | null;
  profile_picture: string | null;
}

interface UserProfileMiniPanelProps {
  profile: UserProfile | null;
  email: string | null;
  twinStatus: TwinStatus;
  loading?: boolean;
}

const STATUS_CONFIG: Record<
  TwinStatus,
  { label: string; color: string; icon: typeof CheckCircle; bgColor: string; borderColor: string }
> = {
  not_initialized: {
    label: "Not Initialized",
    color: "#6b7280",
    icon: AlertCircle,
    bgColor: "rgba(107,114,128,0.08)",
    borderColor: "rgba(107,114,128,0.2)",
  },
  calibrating: {
    label: "Calibrating",
    color: "#fbbf24",
    icon: Loader,
    bgColor: "rgba(251,191,36,0.08)",
    borderColor: "rgba(251,191,36,0.2)",
  },
  active: {
    label: "Active",
    color: "#22d3ee",
    icon: CheckCircle,
    bgColor: "rgba(34,211,238,0.08)",
    borderColor: "rgba(34,211,238,0.2)",
  },
};

function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserProfileMiniPanel({
  profile,
  email,
  twinStatus,
  loading,
}: UserProfileMiniPanelProps) {
  const statusConfig = STATUS_CONFIG[twinStatus];
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <div className="hud-card p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/5 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-32 bg-white/5 rounded" />
            <div className="h-3 w-40 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name ?? email?.split("@")[0] ?? "Researcher";
  const displayEmail = email ?? "—";
  const lastUpdated = profile?.updated_at
    ? (() => {
        try {
          return formatDistanceToNow(new Date(profile.updated_at), {
            addSuffix: true,
          });
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="hud-card p-5 space-y-4">
      {/* Avatar + Identity */}
      <div className="flex items-center gap-3">
        {profile?.profile_picture ? (
          <img
            src={profile.profile_picture}
            alt={displayName}
            className="h-12 w-12 rounded-full border border-white/10 object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-base font-semibold text-white/70">
              {getInitials(profile?.full_name ?? null)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold text-white/90 truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
        </div>
      </div>

      {/* Twin status badge */}
      <motion.div
        key={twinStatus}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2.5 rounded-xl border p-2.5"
        style={{
          backgroundColor: statusConfig.bgColor,
          borderColor: statusConfig.borderColor,
        }}
      >
        <StatusIcon
          className={`h-4 w-4 flex-shrink-0 ${twinStatus === "calibrating" ? "animate-spin" : ""}`}
          style={{ color: statusConfig.color }}
        />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Twin Status
          </p>
          <p
            className="text-xs font-semibold"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </p>
        </div>
      </motion.div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <Clock className="h-3 w-3" />
          <span>Profile updated {lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
