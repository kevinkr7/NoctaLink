import { motion } from "framer-motion";
import { useState } from "react";
import { Activity, Brain, Cpu, LineChart, Sparkles, Waves } from "lucide-react";

const modules = [
  { icon: Activity, title: "EEG Signals", desc: "Raw multi-channel EEG captured during sleep cycles." },
  { icon: Waves, title: "Sleep Analysis", desc: "Stage classification and architecture mapping across the night." },
  { icon: Sparkles, title: "Feature Extraction", desc: "Spectral, temporal, and connectivity biomarkers distilled." },
  { icon: Cpu, title: "Machine Learning Engine", desc: "Adaptive models trained on multi-subject cognitive datasets." },
  { icon: Brain, title: "Cognitive Twin", desc: "A personalized digital model of your cognitive state." },
  { icon: LineChart, title: "Predictive Insights", desc: "Attention, memory, fatigue, and readiness forecasts." },
];

export function Architecture() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="grid gap-4 md:gap-6">
        {modules.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`relative flex items-center gap-5 rounded-2xl glass p-5 transition-all duration-500 ${
              active === i ? "violet-glow scale-[1.02] border-[var(--violet)]/40" : ""
            }`}
          >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
              <m.icon className="h-6 w-6 text-[var(--violet-glow)]" />
              <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--violet)] text-[10px] font-semibold text-white">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold md:text-lg">{m.title}</h4>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </div>
            <div className="hidden h-2 w-2 rounded-full bg-[var(--violet-glow)] shadow-[0_0_12px_var(--violet-glow)] md:block" />
          </motion.div>
        ))}
      </div>
      {/* connecting line */}
      <div className="pointer-events-none absolute left-[46px] top-0 -z-10 h-full w-px bg-gradient-to-b from-transparent via-[var(--violet)]/40 to-transparent md:left-[46px]" />
    </div>
  );
}
