import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase/client";
import { StarField } from "@/components/StarField";
import { Navbar } from "@/components/Navbar";

// Dashboard components
import { CognitiveTwinCore } from "@/components/dashboard/CognitiveTwinCore";
import { CognitiveLoadGauge } from "@/components/dashboard/CognitiveLoadGauge";
import {
  SleepEEGPanel,
  type SleepSession,
  type EEGFeatures,
} from "@/components/dashboard/SleepEEGPanel";
import {
  CognitiveReadinessCard,
  computeReadiness,
  type ReadinessInputs,
} from "@/components/dashboard/CognitiveReadinessCard";
import {
  SessionMonitorPanel,
  type CognitiveSession,
} from "@/components/dashboard/SessionMonitorPanel";
import {
  TrendTimeline,
  type PredictionPoint,
  type SleepPoint,
} from "@/components/dashboard/TrendTimeline";
import {
  InsightsPanel,
  type InsightInputs,
} from "@/components/dashboard/InsightsPanel";
import {
  RecommendationsPanel,
  type RecommendationInputs,
} from "@/components/dashboard/RecommendationsPanel";
import { DataActionsPanel } from "@/components/dashboard/DataActionsPanel";
import {
  UserProfileMiniPanel,
  type UserProfile,
  type TwinStatus,
} from "@/components/dashboard/UserProfileMiniPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prediction {
  prediction_date: string;
  cognitive_readiness: number | null;
  fatigue_score: number | null;
  attention_score: number | null;
  memory_score: number | null;
}

interface SleepRec {
  recovery_score: number | null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NoctaLink Cognitive Twin" },
      {
        name: "description",
        content: "Your live cognitive monitoring cockpit.",
      },
    ],
  }),
  component: DashboardPage,
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function MetricModal({
  metric,
  onClose,
}: {
  metric: string;
  onClose: () => void;
}) {
  const descriptions: Record<string, string> = {
    "Delta Power":
      "Delta waves (0.5–4 Hz) represent deep slow-wave sleep. High delta power indicates sufficient restorative sleep, which is critical for memory consolidation and physical recovery.",
    "Theta Power":
      "Theta waves (4–8 Hz) are associated with light sleep, drowsiness, and memory encoding. Elevated theta during wakefulness may suggest mental fatigue.",
    "Alpha Power":
      "Alpha waves (8–12 Hz) appear during relaxed wakefulness with eyes closed. Good alpha presence often correlates with reduced stress and improved focus readiness.",
    "Signal Quality":
      "Indicates how clean and reliable your EEG recording was. Scores above 70% are considered good. Lower values may affect the accuracy of derived biomarkers.",
    "Cognitive Load":
      "A composite score from 0–100 representing the mental effort currently required. Scores above 70 are high and may cause fatigue over time.",
  };

  const detail = descriptions[metric] ?? `Detailed information about ${metric} will appear here as more data is collected.`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl glass-strong violet-glow p-6"
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-white transition-colors text-lg"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          {metric}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate();

  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [previousPrediction, setPreviousPrediction] = useState<Prediction | null>(null);
  const [allPredictions, setAllPredictions] = useState<PredictionPoint[]>([]);
  const [latestSleepSession, setLatestSleepSession] = useState<SleepSession | null>(null);
  const [eegFeatures, setEEGFeatures] = useState<EEGFeatures | null>(null);
  const [allSleepSessions, setAllSleepSessions] = useState<SleepPoint[]>([]);
  const [sleepRec, setSleepRec] = useState<SleepRec | null>(null);
  const [activeSession, setActiveSession] = useState<CognitiveSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [twinStatus, setTwinStatus] = useState<TwinStatus>("not_initialized");

  // Loading flags
  const [profileLoading, setProfileLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [sleepLoading, setSleepLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);

  // UI state
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [modalMetric, setModalMetric] = useState<string | null>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate({ to: "/login" });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ── Fetch profile ────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, profile_picture, updated_at")
        .eq("id", uid)
        .maybeSingle();

      setProfile(
        data
          ? {
              full_name: data.full_name ?? null,
              email: userEmail,
              profile_picture: data.profile_picture ?? null,
              updated_at: data.updated_at ?? null,
            }
          : null
      );

      // Determine twin status based on questionnaire completion
      const { count: qaCount } = await supabase
        .from("questionnaire_answers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid);

      if ((qaCount ?? 0) > 0) {
        setTwinStatus("active");
      } else if (data) {
        setTwinStatus("calibrating");
      } else {
        setTwinStatus("not_initialized");
      }
    } catch {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, [userEmail]);

  // ── Fetch predictions ────────────────────────────────────────────────────────
  const fetchPredictions = useCallback(async (uid: string) => {
    setPredictionsLoading(true);
    try {
      const { data } = await supabase
        .from("predictions")
        .select(
          "prediction_date, cognitive_readiness, fatigue_score, attention_score, memory_score"
        )
        .eq("user_id", uid)
        .order("prediction_date", { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        setLatestPrediction(data[0]);
        setPreviousPrediction(data[1] ?? null);
        setAllPredictions(
          [...data].reverse().map((p) => ({
            prediction_date: p.prediction_date,
            cognitive_readiness: p.cognitive_readiness,
            fatigue_score: p.fatigue_score,
            attention_score: p.attention_score,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setPredictionsLoading(false);
    }
  }, []);

  // ── Fetch sleep sessions + EEG ───────────────────────────────────────────────
  const fetchSleepData = useCallback(async (uid: string) => {
    setSleepLoading(true);
    try {
      // All sleep sessions for trend
      const { data: allSleep } = await supabase
        .from("sleep_sessions")
        .select("sleep_date, sleep_quality_score")
        .eq("user_id", uid)
        .order("sleep_date", { ascending: false })
        .limit(30);

      if (allSleep) {
        setAllSleepSessions([...allSleep].reverse());
      }

      // Latest session with EEG
      const { data: latestSleep } = await supabase
        .from("sleep_sessions")
        .select("id, sleep_date, sleep_quality_score, sleep_duration, created_at")
        .eq("user_id", uid)
        .order("sleep_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSleep) {
        setLatestSleepSession({
          id: latestSleep.id,
          sleep_date: latestSleep.sleep_date,
          sleep_quality_score: latestSleep.sleep_quality_score,
          sleep_duration: latestSleep.sleep_duration,
          created_at: latestSleep.created_at,
        });

        // Fetch EEG features for this session
        const { data: eeg } = await supabase
          .from("eeg_features")
          .select(
            "delta_power, theta_power, alpha_power, beta_power, rem_percentage, deep_sleep_percentage, signal_quality"
          )
          .eq("sleep_session_id", latestSleep.id)
          .maybeSingle();

        if (eeg) {
          setEEGFeatures({
            delta_power: eeg.delta_power,
            theta_power: eeg.theta_power,
            alpha_power: eeg.alpha_power,
            beta_power: eeg.beta_power,
            rem_percentage: eeg.rem_percentage,
            deep_sleep_percentage: eeg.deep_sleep_percentage,
            signal_quality: eeg.signal_quality,
          });
        }
      }

      // Latest sleep recommendation for recovery score
      const { data: rec } = await supabase
        .from("sleep_recommendations")
        .select("recovery_score")
        .eq("user_id", uid)
        .order("recommendation_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rec) setSleepRec({ recovery_score: rec.recovery_score });
    } catch {
      // ignore
    } finally {
      setSleepLoading(false);
    }
  }, []);

  // ── Fetch active cognitive session ───────────────────────────────────────────
  const fetchActiveSession = useCallback(async (uid: string) => {
    setSessionLoading(true);
    try {
      const { data, error } = await supabase
        .from("cognitive_sessions")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setSessionError(error.message);
      } else {
        setActiveSession(data ?? null);
      }
    } catch (err: any) {
      setSessionError(err?.message ?? "Unknown error");
    } finally {
      setSessionLoading(false);
    }
  }, []);

  // ── Trigger all fetches once user id is available ────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId);
    fetchPredictions(userId);
    fetchSleepData(userId);
    fetchActiveSession(userId);
  }, [userId, fetchProfile, fetchPredictions, fetchSleepData, fetchActiveSession]);

  // ── Realtime subscription for predictions ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchPredictions(userId)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cognitive_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchActiveSession(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchPredictions, fetchActiveSession]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const cognitiveLoad = latestPrediction?.cognitive_readiness ?? null;
  const previousLoad = previousPrediction?.cognitive_readiness ?? null;
  const fatigueScore = latestPrediction?.fatigue_score ?? null;
  const attentionScore = latestPrediction?.attention_score ?? null;

  const readinessInputs: ReadinessInputs = {
    sleepQuality: latestSleepSession?.sleep_quality_score ?? null,
    recoveryScore: sleepRec?.recovery_score ?? null,
    cognitiveLoad,
    fatigueScore,
  };

  const insightInputs: InsightInputs = {
    cognitiveLoad,
    previousLoad,
    sleepQuality: latestSleepSession?.sleep_quality_score ?? null,
    recoveryScore: sleepRec?.recovery_score ?? null,
    fatigueScore,
    attentionScore,
    sessionCount: allPredictions.length,
  };

  const recommendationInputs: RecommendationInputs = {
    cognitiveLoad,
    fatigueScore,
    recoveryScore: sleepRec?.recovery_score ?? null,
    sleepQuality: latestSleepSession?.sleep_quality_score ?? null,
    attentionScore,
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Background layers */}
      <StarField count={60} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--violet)_8%,transparent),transparent_55%)]" />
      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Navbar />

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              NoctaLink
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Cognitive Monitoring{" "}
              <span className="text-gradient">Cockpit</span>
            </h1>
          </div>

          {/* Live status chip */}
          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:self-auto">
            <div className="relative">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-status-ping absolute" />
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Live Dashboard
            </span>
          </div>
        </motion.div>

        {/* ── Dashboard Grid ─────────────────────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">

          {/* Row 1, Col 1-2: Twin Core (spans 2 cols on xl) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="xl:col-span-2"
          >
            <CognitiveTwinCore
              cognitiveLoad={twinStatus === "active" ? cognitiveLoad : null}
              selectedMetric={selectedMetric}
            />
          </motion.div>

          {/* Row 1, Col 3: User Profile + Load Gauge stacked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <UserProfileMiniPanel
              profile={profile}
              email={userEmail}
              twinStatus={twinStatus}
              loading={profileLoading}
            />
            <CognitiveLoadGauge
              score={cognitiveLoad}
              onClick={() => {
                setSelectedMetric("Cognitive Load");
                setModalMetric("Cognitive Load");
              }}
            />
          </motion.div>

          {/* Row 2, Col 1: Sleep EEG Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SleepEEGPanel
              session={latestSleepSession}
              eeg={eegFeatures}
              loading={sleepLoading}
              onMetricClick={(m) => {
                setSelectedMetric(m);
                setModalMetric(m);
              }}
            />
          </motion.div>

          {/* Row 2, Col 2: Cognitive Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <CognitiveReadinessCard
              inputs={readinessInputs}
              loading={predictionsLoading || sleepLoading}
              onClick={() => setSelectedMetric("Cognitive Readiness")}
            />
          </motion.div>

          {/* Row 2, Col 3: Session Monitor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <SessionMonitorPanel
              session={activeSession}
              loading={sessionLoading}
              serverError={sessionError}
            />
          </motion.div>

          {/* Row 3: Trend Timeline (full width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="md:col-span-2 xl:col-span-3"
          >
            <TrendTimeline
              predictions={allPredictions}
              sleepSessions={allSleepSessions}
              loading={predictionsLoading || sleepLoading}
            />
          </motion.div>

          {/* Row 4, Col 1-2: Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="md:col-span-1 xl:col-span-1"
          >
            <InsightsPanel
              inputs={insightInputs}
              loading={predictionsLoading || sleepLoading}
            />
          </motion.div>

          {/* Row 4, Col 2: Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="md:col-span-1 xl:col-span-1"
          >
            <RecommendationsPanel
              inputs={recommendationInputs}
              loading={predictionsLoading || sleepLoading}
            />
          </motion.div>

          {/* Row 4, Col 3: Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="md:col-span-2 xl:col-span-1"
          >
            <DataActionsPanel
              twinStatus={twinStatus}
            />
          </motion.div>
        </div>
      </main>

      {/* Detail modal */}
      <AnimatePresence>
        {modalMetric && (
          <MetricModal
            metric={modalMetric}
            onClose={() => setModalMetric(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
