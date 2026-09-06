import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { BrainCircuit, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";


// @ts-ignore
import brainHologramUrl from "@/components/three/3D_Models/brain_hologram.glb?url";

export type LoadState = "calm" | "active" | "warning" | "uncalibrated";

function getLoadState(load: number | null): LoadState {
  if (load === null) return "uncalibrated";
  if (load <= 35) return "calm";
  if (load <= 70) return "active";
  return "warning";
}

const STATE_CONFIG: Record<
  LoadState,
  {
    primary: string;
    secondary: string;
    glowColor: string;
    label: string;
    pointColor: string;
    ambientColor: string;
    pulseSpeed: number;
  }
> = {
  calm: {
    primary: "oklch(0.7 0.18 200)",
    secondary: "oklch(0.6 0.15 195)",
    glowColor: "oklch(0.6 0.15 200 / 50%)",
    label: "Calm",
    pointColor: "#22d3ee",
    ambientColor: "#06b6d4",
    pulseSpeed: 1.2,
  },
  active: {
    primary: "oklch(0.55 0.22 295)",
    secondary: "oklch(0.7 0.25 300)",
    glowColor: "oklch(0.55 0.22 295 / 50%)",
    label: "Active",
    pointColor: "#a78bfa",
    ambientColor: "#7c3aed",
    pulseSpeed: 2.2,
  },
  warning: {
    primary: "oklch(0.7 0.2 60)",
    secondary: "oklch(0.75 0.22 50)",
    glowColor: "oklch(0.7 0.2 60 / 50%)",
    label: "High Load",
    pointColor: "#f59e0b",
    ambientColor: "#d97706",
    pulseSpeed: 3.5,
  },
  uncalibrated: {
    primary: "oklch(0.4 0.02 280)",
    secondary: "oklch(0.35 0.02 280)",
    glowColor: "oklch(0.4 0.02 280 / 30%)",
    label: "Uncalibrated",
    pointColor: "#6b7280",
    ambientColor: "#4b5563",
    pulseSpeed: 0.5,
  },
};

function LiveBrainModel({ loadState }: { loadState: LoadState }) {
  const { scene } = useGLTF(brainHologramUrl);
  const modelRef = useThreeRef<THREE.Group>(null);
  const config = STATE_CONFIG[loadState];

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.12;
      const t = state.clock.elapsedTime;
      const speed = config.pulseSpeed;
      modelRef.current.position.y = Math.sin(t * speed * 0.3) * 0.05;
    }
  });

  return <primitive ref={modelRef} object={scene} scale={2.1} />;
}

useGLTF.preload(brainHologramUrl);

interface CognitiveTwinCoreProps {
  cognitiveLoad: number | null;
  selectedMetric?: string | null;
}

export function CognitiveTwinCore({
  cognitiveLoad,
  selectedMetric,
}: CognitiveTwinCoreProps) {
  const loadState = getLoadState(cognitiveLoad);
  const config = STATE_CONFIG[loadState];

  if (loadState === "uncalibrated") {
    return (
      <div className="hud-card p-6 flex flex-col items-center justify-center text-center gap-5 min-h-[340px]">
        {/* Neural grid background */}
        <div
          className="absolute inset-0 rounded-[1.25rem] overflow-hidden pointer-events-none"
          aria-hidden
        >
          <svg
            className="w-full h-full opacity-[0.04]"
            viewBox="0 0 400 340"
            fill="none"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={i * 28}
                x2="400"
                y2={i * 28}
                stroke="white"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={i * 24}
                y1="0"
                x2={i * 24}
                y2="340"
                stroke="white"
                strokeWidth="0.5"
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10 h-32 w-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
          <BrainCircuit className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="relative z-10">
          <h3 className="font-display text-lg font-semibold text-white/70">
            Twin Not Calibrated
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-[220px]">
            Complete onboarding to initialize your cognitive digital twin.
          </p>
        </div>

        <Link
          to="/onboarding"
          className="relative z-10 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-[var(--violet)] hover:bg-[color-mix(in_oklab,var(--violet)_18%,transparent)]"
        >
          Start Calibration
        </Link>
      </div>
    );
  }

  return (
    <div className="hud-card relative overflow-hidden min-h-[340px] flex flex-col">
      {/* Animated glow background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={loadState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 rounded-[1.25rem] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${config.glowColor}, transparent 70%)`,
          }}
        />
      </AnimatePresence>

      {/* Neural scan line */}
      <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] pointer-events-none">
        <motion.div
          className="absolute w-full h-px opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.primary}, transparent)`,
          }}
          animate={{ y: ["0%", "100%"] }}
          transition={{
            duration: 3 / config.pulseSpeed,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Neural grid */}
      <div
        className="absolute inset-0 rounded-[1.25rem] overflow-hidden pointer-events-none"
        aria-hidden
      >
        <svg
          className="w-full h-full opacity-[0.04]"
          viewBox="0 0 400 340"
          fill="none"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 28}
              x2="400"
              y2={i * 28}
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 24}
              y1="0"
              x2={i * 24}
              y2="340"
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Status badge */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Cognitive Twin
        </span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="h-2 w-2 rounded-full animate-status-ping absolute"
              style={{ backgroundColor: config.primary }}
            />
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: config.primary }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: config.primary }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* 3D Brain */}
      <div className="relative z-10 flex-1 min-h-[220px]">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} color={config.ambientColor} />
          <pointLight
            position={[5, 5, 5]}
            intensity={2}
            color={config.pointColor}
          />
          <pointLight
            position={[-5, -3, 2]}
            intensity={1.2}
            color={config.ambientColor}
          />
          <Float
            speed={config.pulseSpeed}
            rotationIntensity={0.25}
            floatIntensity={0.6}
          >
            <LiveBrainModel loadState={loadState} />
          </Float>
        </Canvas>
      </div>

      {/* Selected metric overlay */}
      {selectedMetric && (
        <div className="relative z-10 px-5 pb-5">
          <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
            <Zap className="inline h-3 w-3 mr-1 text-yellow-400" />
            Responding to:{" "}
            <span className="text-white font-medium">{selectedMetric}</span>
          </div>
        </div>
      )}
    </div>
  );
}
