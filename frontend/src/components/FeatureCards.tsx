import { Brain, Moon, Network } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Moon,
    title: "Sleep Intelligence",
    desc: "Extracts meaningful sleep biomarkers from EEG signals to understand sleep quality and neural recovery.",
  },
  {
    icon: Brain,
    title: "Cognitive Twin",
    desc: "Builds a personalized digital representation of cognitive behavior and mental performance.",
  },
  {
    icon: Network,
    title: "Predictive Insights",
    desc: "Generates attention, memory, fatigue, and cognitive readiness predictions using intelligent analytics.",
  },
];

export function FeatureCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
          whileHover={{ y: -6 }}
          className="group relative overflow-hidden rounded-2xl glass p-8 transition-all duration-500 hover:violet-glow"
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--violet)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30" />
          <div className="relative">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--violet-glow)]">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
